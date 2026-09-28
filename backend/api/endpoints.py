from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import models
from ..database.connection import get_db
from ..api.auth import get_current_user
from ..services import priority_engine
from pydantic import BaseModel
import json
from datetime import datetime, timedelta
import random

router = APIRouter()


# ─── Clarifications ─────────────────────────────────────────────────────────

@router.get("/clarifications")
def get_clarifications(
    department: Optional[str] = None,
    medicine_risk: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    high_risk_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    q = db.query(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id)
    if department:
        q = q.filter(models.ClarificationRequest.department == department)
    if medicine_risk:
        q = q.filter(models.ClarificationRequest.medicine_risk == medicine_risk)
    if status:
        q = q.filter(models.ClarificationRequest.status == status)
    if search:
        q = q.filter(models.ClarificationRequest.clarification_id.contains(search))
    if high_risk_only:
        q = q.filter(models.ClarificationRequest.medicine_risk == "High",
                     models.ClarificationRequest.status == "Pending")
    if priority:
        q = q.join(models.PriorityPrediction, isouter=True).filter(
            models.PriorityPrediction.priority_level == priority.upper())

    items = q.all()

    result = []
    for item in items:
        pred = item.prediction
        score = pred.score if pred else None
        plevel = (item.current_priority or (pred.priority_level if pred else "MEDIUM"))
        evidence = json.loads(pred.evidence_json) if pred and pred.evidence_json else {}
        result.append({
            "id": item.id,
            "clarification_id": item.clarification_id,
            "patient_id": item.patient_id,
            "prescription_id": item.prescription_id,
            "department": item.department,
            "medicine_category": item.medicine_category,
            "medicine_risk": item.medicine_risk,
            "waiting_time_minutes": item.waiting_time_minutes,
            "clarification_type": item.clarification_type,
            "urgency": item.urgency,
            "status": item.status,
            "assigned_pharmacist": item.assigned_pharmacist,
            "priority_level": plevel,
            "priority_score": score,
            "evidence": evidence,
            "created_at": item.created_at.isoformat() if item.created_at else None
        })

    # Sort: CRITICAL first, then HIGH, MEDIUM, LOW
    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    result.sort(key=lambda x: (order.get(x["priority_level"], 4), -(x["priority_score"] or 0)))
    return result


@router.get("/clarifications/{id}")
def get_clarification(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.ClarificationRequest).filter(models.ClarificationRequest.id == id, models.ClarificationRequest.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    pred = item.prediction
    evidence = json.loads(pred.evidence_json) if pred and pred.evidence_json else {}
    plevel = item.current_priority or (pred.priority_level if pred else "MEDIUM")

    reviews = []
    for r in item.reviews:
        reviews.append({
            "action_type": r.action_type,
            "pharmacist_id": r.pharmacist_id,
            "previous_priority": r.previous_priority,
            "new_priority": r.new_priority,
            "reason": r.reason,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    resolution = None
    if item.resolution:
        resolution = {
            "outcome": item.resolution.outcome,
            "resolution_time_minutes": item.resolution.resolution_time_minutes,
            "resolved_by": item.resolution.resolved_by,
            "created_at": item.resolution.created_at.isoformat() if item.resolution.created_at else None
        }

    return {
        "id": item.id,
        "clarification_id": item.clarification_id,
        "patient_id": item.patient_id,
        "prescription_id": item.prescription_id,
        "department": item.department,
        "medicine_category": item.medicine_category,
        "medicine_risk": item.medicine_risk,
        "waiting_time_minutes": item.waiting_time_minutes,
        "clarification_type": item.clarification_type,
        "urgency": item.urgency,
        "status": item.status,
        "assigned_pharmacist": item.assigned_pharmacist,
        "priority_level": plevel,
        "priority_score": pred.score if pred else None,
        "evidence": evidence,
        "reviews": reviews,
        "resolution": resolution,
        "created_at": item.created_at.isoformat() if item.created_at else None
    }


class ReviewCreate(BaseModel):
    action_type: str
    new_priority: str
    reason: str


@router.post("/clarifications/{id}/review")
def review_clarification(
    id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.ClarificationRequest).filter(models.ClarificationRequest.id == id, models.ClarificationRequest.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    pred = item.prediction
    prev_priority = item.current_priority or (pred.priority_level if pred else "MEDIUM")

    review = models.ReviewAction(
        clarification_id=id,
        pharmacist_id=current_user.email,
        action_type=body.action_type,
        previous_priority=prev_priority,
        new_priority=body.new_priority,
        reason=body.reason
    )
    db.add(review)
    if body.action_type in ["Accept", "Override", "Escalate"]:
        item.current_priority = body.new_priority
        item.status = "Reviewed"

    audit = models.AuditLog(
        user_email=current_user.email, user_role=current_user.role,
        clarification_id=item.clarification_id, action=body.action_type,
        previous_value=prev_priority, new_value=body.new_priority, reason=body.reason
    )
    db.add(audit)
    db.commit()
    return {"message": "Review saved"}


class ResolveCreate(BaseModel):
    outcome: str
    resolution_time_minutes: int
    notes: Optional[str] = None


@router.post("/clarifications/{id}/resolve")
def resolve_clarification(
    id: int,
    body: ResolveCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.ClarificationRequest).filter(models.ClarificationRequest.id == id, models.ClarificationRequest.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    res = models.ResolutionOutcome(
        clarification_id=id, outcome=body.outcome,
        resolution_time_minutes=body.resolution_time_minutes,
        resolved_by=current_user.email, notes=body.notes
    )
    db.add(res)
    item.status = "Resolved"

    audit = models.AuditLog(
        user_email=current_user.email, user_role=current_user.role,
        clarification_id=item.clarification_id, action="RESOLVED",
        new_value=body.outcome, reason=body.notes
    )
    db.add(audit)
    db.commit()
    return {"message": "Resolved"}


# ─── Prescriptions (Pharmacist View) ─────────────────────────────────────────

@router.get("/prescriptions")
def get_pharmacist_prescriptions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from sqlalchemy import or_

    # Only for pharmacists to view incoming prescriptions
    prescriptions = db.query(models.Prescription).filter(
        models.Prescription.status.in_(["Sent to Pharmacy", "Clarification Required", "Response Submitted", "Resolved", "Approved"]),
        or_(models.Prescription.target_pharmacist_id == None, models.Prescription.target_pharmacist_id == current_user.id)
    ).order_by(models.Prescription.created_at.desc()).all()
    
    return [
        {
            "id": p.id,
            "prescription_id": p.prescription_id,
            "doctor_name": p.doctor_name,
            "patient_id": p.patient_id,
            "department": p.department,
            "medicine": p.medicine,
            "medicine_risk": p.medicine_risk,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        } for p in prescriptions
    ]


@router.post("/prescriptions/{prescription_id}/approve")
def approve_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    p = db.query(models.Prescription).filter(models.Prescription.prescription_id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found")

    p.status = "Approved"
    
    audit = models.AuditLog(
        user_email=current_user.email, user_role=current_user.role,
        action="PRESCRIPTION_APPROVED",
        details=f"Prescription {p.prescription_id} approved directly"
    )
    db.add(audit)
    db.commit()

    return {"message": "Prescription approved successfully"}


class PharmacistQuestionCreate(BaseModel):
    pharmacist_question: str


@router.post("/prescriptions/{prescription_id}/clarify")
def create_clarification_from_prescription(
    prescription_id: str,
    body: PharmacistQuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    p = db.query(models.Prescription).filter(models.Prescription.prescription_id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Generate clarification ID
    c_id = f"CLAR-{random.randint(10000, 99999)}"

    # Call AI priority engine
    score = priority_engine.baseline_score(p.medicine_risk, 0, p.department, "Other")
    priority_level = priority_engine.score_to_priority(score, 0.70, 0.90)
    evidence = priority_engine.build_evidence_text(p.medicine_risk, 0, p.department, "Other")

    clar = models.ClarificationRequest(
        user_id=current_user.id,
        clarification_id=c_id,
        patient_id=p.patient_id,
        prescription_id=p.prescription_id,
        department=p.department,
        medicine_category=p.medicine,
        medicine_risk=p.medicine_risk,
        waiting_time_minutes=0,
        clarification_type="Other",
        urgency="Routine",
        status="Pending",
        prescription_db_id=p.id,
        pharmacist_question=body.pharmacist_question
    )
    db.add(clar)
    db.commit()
    db.refresh(clar)

    pred = models.PriorityPrediction(
        clarification_id=clar.id,
        score=score,
        priority_level=priority_level,
        evidence_json=json.dumps({"reason": evidence, "contributions": {}})
    )
    db.add(pred)

    # Update prescription status
    p.status = "Clarification Required"
    
    # Send notification to doctor
    db.add(models.DoctorNotification(
        doctor_id=p.doctor_id,
        notification_type="CLARIFICATION_REQUEST",
        title="NEW CLARIFICATION REQUEST",
        message=f"Pharmacy has requested clarification for: {p.prescription_id}",
        prescription_id=p.prescription_id,
        clarification_id=clar.clarification_id
    ))

    db.commit()
    return {"message": "Clarification created successfully"}


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_open = db.query(models.ClarificationRequest).filter(
        models.ClarificationRequest.user_id == current_user.id,
        models.ClarificationRequest.status != "Resolved").count()

    high_priority = db.query(models.ClarificationRequest).join(
        models.PriorityPrediction, isouter=True).filter(
        models.ClarificationRequest.user_id == current_user.id,
        models.ClarificationRequest.status != "Resolved",
        models.PriorityPrediction.priority_level.in_(["HIGH", "CRITICAL"])
    ).count()

    high_risk_pending = db.query(models.ClarificationRequest).filter(
        models.ClarificationRequest.user_id == current_user.id,
        models.ClarificationRequest.medicine_risk == "High",
        models.ClarificationRequest.status == "Pending"
    ).count()

    # Avg waiting time
    avg_wait = db.query(func.avg(models.ClarificationRequest.waiting_time_minutes)).filter(
        models.ClarificationRequest.user_id == current_user.id,
        models.ClarificationRequest.status != "Resolved"
    ).scalar() or 0

    # Median resolution time from resolved
    resolved = db.query(models.ResolutionOutcome.resolution_time_minutes).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).all()
    res_times = sorted([r[0] for r in resolved if r[0]])
    if res_times:
        mid = len(res_times) // 2
        median_res = res_times[mid]
    else:
        median_res = 0

    # High-risk early resolution rate
    hr_resolved = db.query(models.ResolutionOutcome).join(
        models.ClarificationRequest,
        models.ResolutionOutcome.clarification_id == models.ClarificationRequest.id
    ).filter(models.ClarificationRequest.user_id == current_user.id, models.ClarificationRequest.medicine_risk == "High").all()
    if hr_resolved:
        early = sum(1 for r in hr_resolved if r.resolution_time_minutes <= 60)
        hr_early_rate = round(early / len(hr_resolved), 4)
    else:
        hr_early_rate = 0.0

    # Priority distribution
    from sqlalchemy import case
    dist = db.query(
        models.PriorityPrediction.priority_level,
        func.count(models.PriorityPrediction.id)
    ).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).group_by(models.PriorityPrediction.priority_level).all()

    return {
        "total_open": total_open,
        "high_priority": high_priority,
        "average_waiting_time_min": round(avg_wait, 1),
        "high_risk_pending": high_risk_pending,
        "median_resolution_time_min": median_res,
        "high_risk_early_resolution_rate": hr_early_rate,
        "target_early_resolution_rate": 0.80,
        "priority_distribution": [{"level": d[0], "count": d[1]} for d in dist],
        # Prescription stats for pharmacist dashboard
        "incoming_prescriptions": db.query(models.Prescription).filter(
            models.Prescription.status.in_(["Sent to Pharmacy", "Clarification Required", "Response Submitted", "Resolved", "Approved"])
        ).count(),
        "pending_prescriptions": db.query(models.Prescription).filter(
            models.Prescription.status == "Sent to Pharmacy"
        ).count(),
        "approved_prescriptions": db.query(models.Prescription).filter(
            models.Prescription.status == "Approved"
        ).count(),
        "clarification_required": db.query(models.Prescription).filter(
            models.Prescription.status == "Clarification Required"
        ).count(),
    }


# ─── Analytics ───────────────────────────────────────────────────────────────

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    by_dept = db.query(models.ClarificationRequest.department, func.count()).filter(models.ClarificationRequest.user_id == current_user.id).group_by(
        models.ClarificationRequest.department).all()
    by_risk = db.query(models.ClarificationRequest.medicine_risk, func.count()).filter(models.ClarificationRequest.user_id == current_user.id).group_by(
        models.ClarificationRequest.medicine_risk).all()
    by_priority = db.query(models.PriorityPrediction.priority_level, func.count()).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).group_by(
        models.PriorityPrediction.priority_level).all()
    by_type = db.query(models.ClarificationRequest.clarification_type, func.count()).filter(models.ClarificationRequest.user_id == current_user.id).group_by(
        models.ClarificationRequest.clarification_type).all()

    # Override rate
    total_reviews = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).count()
    overrides = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id, models.ReviewAction.action_type == "Override").count()
    override_rate = round(overrides / total_reviews, 4) if total_reviews > 0 else 0.0

    return {
        "by_department": [{"department": d[0], "count": d[1]} for d in by_dept],
        "by_risk": [{"risk": r[0], "count": r[1]} for r in by_risk],
        "by_priority": [{"priority": p[0], "count": p[1]} for p in by_priority],
        "by_type": [{"type": t[0], "count": t[1]} for t in by_type],
        "override_rate": override_rate,
        "total_overrides": overrides,
        "total_reviews": total_reviews
    }


# ─── Experiments ─────────────────────────────────────────────────────────────

class ExperimentConfig(BaseModel):
    dataset_size: int = 10000
    random_seed: int = 42
    priority_threshold: float = 0.70
    target_early_res_rate: float = 0.80
    early_res_minutes: int = 60


@router.post("/experiments/run")
def run_experiment(
    config: ExperimentConfig,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = priority_engine.run_full_experiment(
        dataset_size=config.dataset_size,
        random_seed=config.random_seed,
        priority_threshold=config.priority_threshold,
        target_res_rate=config.target_early_res_rate,
        early_res_minutes=config.early_res_minutes
    )
    if results is None:
        raise HTTPException(status_code=500, detail="Synthetic data not found. Run generate_synthetic_data.py first.")

    # Persist results
    best_name = results["best_model"]
    best_metrics = results["metrics"].get(best_name, {})
    exp = models.ExperimentResult(
        user_id=current_user.id,
        model_name=best_name,
        dataset_size=config.dataset_size,
        random_seed=config.random_seed,
        priority_threshold=config.priority_threshold,
        target_early_res_rate=config.target_early_res_rate,
        baseline_early_res_rate=results["baseline_early_res_rate"],
        model_early_res_rate=results["model_early_res_rate"],
        accuracy=best_metrics.get("accuracy", 0),
        precision=best_metrics.get("precision", 0),
        recall=best_metrics.get("recall", 0),
        f1=best_metrics.get("f1", 0),
        roc_auc=best_metrics.get("roc_auc"),
        tn=best_metrics.get("tn", 0), fp=best_metrics.get("fp", 0),
        fn=best_metrics.get("fn", 0), tp=best_metrics.get("tp", 0),
        metrics_json=json.dumps(results["metrics"])
    )
    db.add(exp)
    audit = models.AuditLog(
        user_email=current_user.email, user_role=current_user.role,
        action="RUN_EXPERIMENT",
        details=f"Experiment run: best_model={best_name}, improvement={results['improvement_pp']}pp"
    )
    db.add(audit)
    db.commit()

    return results


@router.get("/experiments/latest")
def get_latest_experiment(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    exp = db.query(models.ExperimentResult).filter(models.ExperimentResult.user_id == current_user.id).order_by(models.ExperimentResult.created_at.desc()).first()
    if not exp:
        raise HTTPException(status_code=404, detail="No experiment results found. Run an experiment first.")
    all_metrics = json.loads(exp.metrics_json) if exp.metrics_json else {}
    return {
        "dataset_size": exp.dataset_size,
        "best_model": exp.model_name,
        "best_model_display": exp.model_name.replace("_", " ").title() if exp.model_name else "",
        "target_early_res_rate": exp.target_early_res_rate,
        "baseline_early_res_rate": exp.baseline_early_res_rate,
        "model_early_res_rate": exp.model_early_res_rate,
        "improvement_pp": round((exp.model_early_res_rate - exp.baseline_early_res_rate) * 100, 2),
        "accuracy": exp.accuracy, "precision": exp.precision,
        "recall": exp.recall, "f1": exp.f1, "roc_auc": exp.roc_auc,
        "tn": exp.tn, "fp": exp.fp, "fn": exp.fn, "tp": exp.tp,
        "metrics": all_metrics
    }


# ─── Audit Log ───────────────────────────────────────────────────────────────

@router.get("/audit-log")
def get_audit_log(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    logs = db.query(models.AuditLog).filter(models.AuditLog.user_email == current_user.email).order_by(models.AuditLog.timestamp.desc()).limit(200).all()
    return [{
        "id": l.id, "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        "user_email": l.user_email, "user_role": l.user_role,
        "clarification_id": l.clarification_id, "action": l.action,
        "previous_value": l.previous_value, "new_value": l.new_value,
        "reason": l.reason, "details": l.details
    } for l in logs]


# ─── Stakeholder Feedback ────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    q1_queue_clarity: int
    q2_evidence_clarity: int
    q3_workflow_practical: int
    q4_reduce_delays: int
    q5_review_points_clear: int
    q6_false_negatives_clear: int
    comments: Optional[str] = None


@router.post("/feedback")
def submit_feedback(
    body: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    fb = models.StakeholderFeedback(
        user_id=current_user.id,
        user_email=current_user.email, user_role=current_user.role,
        q1_queue_clarity=body.q1_queue_clarity, q2_evidence_clarity=body.q2_evidence_clarity,
        q3_workflow_practical=body.q3_workflow_practical, q4_reduce_delays=body.q4_reduce_delays,
        q5_review_points_clear=body.q5_review_points_clear,
        q6_false_negatives_clear=body.q6_false_negatives_clear,
        comments=body.comments, is_synthetic=False
    )
    db.add(fb)
    db.commit()
    return {"message": "Feedback submitted"}


@router.get("/feedback/summary")
def get_feedback_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = db.query(models.StakeholderFeedback).filter(models.StakeholderFeedback.user_id == current_user.id).all()
    if not rows:
        return {"count": 0, "averages": {}}
    n = len(rows)

    def avg(field):
        return round(sum(getattr(r, field) for r in rows) / n, 2)

    return {
        "count": n,
        "averages": {
            "queue_clarity": avg("q1_queue_clarity"),
            "evidence_clarity": avg("q2_evidence_clarity"),
            "workflow_practical": avg("q3_workflow_practical"),
            "reduce_delays": avg("q4_reduce_delays"),
            "review_points_clear": avg("q5_review_points_clear"),
            "false_negatives_clear": avg("q6_false_negatives_clear")
        },
        "responses": [{
            "user_email": r.user_email, "user_role": r.user_role,
            "q1": r.q1_queue_clarity, "q2": r.q2_evidence_clarity,
            "q3": r.q3_workflow_practical, "q4": r.q4_reduce_delays,
            "q5": r.q5_review_points_clear, "q6": r.q6_false_negatives_clear,
            "comments": r.comments, "is_synthetic": r.is_synthetic,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in rows]
    }


# ─── Patient Journeys ────────────────────────────────────────────────────────

@router.get("/patient-journeys")
def get_patient_journeys(current_user: models.User = Depends(get_current_user)):
    return [
        {
            "patient_id": "PAT-0001",
            "prescription_id": "RX-10001",
            "clarification_id": "CLAR-50001",
            "department": "Operating Room",
            "medicine_risk": "High",
            "medicine_category": "Cardiovascular",
            "waiting_time_minutes": 42,
            "clarification_type": "Dose",
            "priority": "CRITICAL",
            "priority_score": 0.94,
            "journey_type": "high_urgency",
            "steps": [
                {"time": "08:00", "status": "Prescription Received", "details": "Prescription RX-10001 received for Operating Room patient PAT-0001", "completed": True},
                {"time": "08:05", "status": "Clarification Created", "details": "Dose ambiguity identified — clarification CLAR-50001 created", "completed": True},
                {"time": "08:05", "status": "Priority Calculated", "details": "AI engine assigned priority score 0.94 → CRITICAL", "completed": True},
                {"time": "08:06", "status": "Pharmacist Notified", "details": "Pharmacist alerted to CRITICAL clarification in queue", "completed": True},
                {"time": "08:08", "status": "Pharmacist Reviews Evidence", "details": "Pharmacist reviews: High medicine risk + 42 min wait + OR department + Dose ambiguity", "completed": True},
                {"time": "08:10", "status": "Priority Accepted", "details": "Pharmacist accepts CRITICAL priority after reviewing evidence", "completed": True},
                {"time": "08:12", "status": "Prescriber Contacted", "details": "Synthetic message sent to prescriber: 'Dose clarification required for OR patient'", "completed": True},
                {"time": "08:18", "status": "Prescriber Response", "details": "Prescriber confirms intended dose with clinical justification", "completed": True},
                {"time": "08:20", "status": "Pharmacist Verifies", "details": "Pharmacist verifies prescriber response meets clinical requirements", "completed": True},
                {"time": "08:20", "status": "Resolved", "details": "Clarification resolved — total time: 20 minutes. Dispensing can proceed.", "completed": True}
            ]
        },
        {
            "patient_id": "PAT-0002",
            "prescription_id": "RX-10002",
            "clarification_id": "CLAR-50002",
            "department": "Outpatient",
            "medicine_risk": "Low",
            "medicine_category": "Analgesic",
            "waiting_time_minutes": 8,
            "clarification_type": "Quantity",
            "priority": "LOW",
            "priority_score": 0.18,
            "journey_type": "low_urgency",
            "steps": [
                {"time": "09:00", "status": "Prescription Received", "details": "Prescription RX-10002 received for Outpatient PAT-0002", "completed": True},
                {"time": "09:02", "status": "Clarification Created", "details": "Quantity ambiguity identified — clarification CLAR-50002 created", "completed": True},
                {"time": "09:02", "status": "Priority Calculated", "details": "AI engine assigned priority score 0.18 → LOW (low-risk, short wait, outpatient)", "completed": True},
                {"time": "09:03", "status": "Queued — Lower Priority", "details": "CLAR-50002 placed in queue behind higher-risk CRITICAL and HIGH requests", "completed": True},
                {"time": "09:15", "status": "Higher-Risk Cases Handled", "details": "OR and Ward CRITICAL/HIGH requests resolved first as per priority order", "completed": True},
                {"time": "09:25", "status": "Pharmacist Reviews", "details": "Pharmacist reviews LOW priority quantity clarification when queue permits", "completed": True},
                {"time": "09:28", "status": "Prescriber Contacted", "details": "Synthetic message: 'Please confirm quantity for outpatient prescription'", "completed": True},
                {"time": "09:35", "status": "Resolved", "details": "Quantity confirmed. Resolved — total time: 35 minutes (within acceptable range for low-priority)", "completed": True}
            ]
        }
    ]


# ─── Failure Cases ───────────────────────────────────────────────────────────

@router.get("/failure-cases")
def get_failure_cases(current_user: models.User = Depends(get_current_user)):
    return [
        {
            "case_id": "EDGE-001",
            "title": "High-Risk Medicine + Very Short Waiting Time",
            "input": {"medicine_risk": "High", "waiting_time_minutes": 4, "department": "Ward", "clarification_type": "Drug interaction"},
            "predicted_priority": "HIGH",
            "expected_priority": "HIGH / CRITICAL",
            "score": 0.74,
            "outcome": "Correct",
            "evidence": "Despite short wait, high medicine risk and drug interaction severity yield HIGH priority.",
            "lesson": "Medicine risk must drive priority even with minimal waiting time.",
            "recommended_action": "Pharmacist should review immediately — do not defer due to short wait."
        },
        {
            "case_id": "EDGE-002",
            "title": "Low-Risk Medicine + Extremely Long Waiting Time",
            "input": {"medicine_risk": "Low", "waiting_time_minutes": 110, "department": "Outpatient", "clarification_type": "Quantity"},
            "predicted_priority": "MEDIUM",
            "expected_priority": "MEDIUM / HIGH",
            "score": 0.62,
            "outcome": "Borderline",
            "evidence": "Very long waiting time escalates a low-risk outpatient request to MEDIUM. May reach HIGH threshold.",
            "lesson": "Waiting time escalation can upgrade low-risk cases — watch for delays.",
            "recommended_action": "Human review recommended — waiting time is extreme for this risk level."
        },
        {
            "case_id": "EDGE-003",
            "title": "Missing Medicine Risk Value",
            "input": {"medicine_risk": None, "waiting_time_minutes": 25, "department": "Ward", "clarification_type": "Dose"},
            "predicted_priority": None,
            "expected_priority": "HUMAN REVIEW REQUIRED",
            "score": None,
            "outcome": "Flagged",
            "evidence": "Medicine risk is missing. System cannot safely calculate priority without this field.",
            "lesson": "Missing risk information must never be assumed as Low. The system must flag it explicitly.",
            "recommended_action": "Do NOT proceed. Send to human pharmacist review immediately. Do not default to Low risk."
        },
        {
            "case_id": "EDGE-004",
            "title": "Probability Near Decision Threshold",
            "input": {"medicine_risk": "Medium", "waiting_time_minutes": 28, "department": "Outpatient", "clarification_type": "Frequency"},
            "predicted_priority": "MEDIUM",
            "expected_priority": "MEDIUM (borderline HIGH)",
            "score": 0.69,
            "outcome": "Borderline",
            "evidence": "Score of 0.69 is just below the HIGH threshold of 0.70. Small changes in inputs could cross the boundary.",
            "lesson": "Cases near the decision boundary are uncertain — threshold should be reviewed periodically.",
            "recommended_action": "Borderline case — human pharmacist review strongly recommended before deprioritising."
        },
        {
            "case_id": "EDGE-005",
            "title": "Conflicting Signals: High Risk + Short Wait + Outpatient",
            "input": {"medicine_risk": "High", "waiting_time_minutes": 6, "department": "Outpatient", "clarification_type": "Dose"},
            "predicted_priority": "HIGH",
            "expected_priority": "HIGH",
            "score": 0.78,
            "outcome": "Correct",
            "evidence": "High medicine risk (weight 40%) and dose severity dominate despite short wait and outpatient setting. Score correctly reaches HIGH.",
            "lesson": "Medicine risk must outweigh department and waiting time factors for safety.",
            "recommended_action": "Accept HIGH priority — medicine risk is the dominant safety signal here."
        }
    ]


# ─── Settings / Thresholds ───────────────────────────────────────────────────

_thresholds = {"high": 0.70, "critical": 0.90}


@router.get("/settings/thresholds")
def get_thresholds(current_user: models.User = Depends(get_current_user)):
    return _thresholds


class ThresholdUpdate(BaseModel):
    high: float
    critical: float


@router.post("/settings/thresholds")
def update_thresholds(body: ThresholdUpdate, current_user: models.User = Depends(get_current_user)):
    if not (0 < body.high < body.critical <= 1.0):
        raise HTTPException(status_code=400, detail="Invalid thresholds: 0 < high < critical ≤ 1.0")
    _thresholds["high"] = body.high
    _thresholds["critical"] = body.critical
    return {"message": "Thresholds updated", "thresholds": _thresholds}


# ─── Model Metrics ───────────────────────────────────────────────────────────

@router.get("/model/metrics")
def get_model_metrics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    exp = db.query(models.ExperimentResult).filter(models.ExperimentResult.user_id == current_user.id).order_by(models.ExperimentResult.created_at.desc()).first()
    total_reviews = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).count()
    overrides = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id, models.ReviewAction.action_type == "Override").count()
    override_rate = round(overrides / total_reviews, 4) if total_reviews > 0 else 0.0
    fn_rate = 0.0
    if exp and (exp.fn + exp.tp) > 0:
        fn_rate = round(exp.fn / (exp.fn + exp.tp), 4)

    return {
        "model_name": exp.model_name if exp else "Not trained",
        "version": "1.0",
        "training_date": exp.created_at.isoformat() if exp else None,
        "dataset_size": exp.dataset_size if exp else 0,
        "precision": exp.precision if exp else None,
        "recall": exp.recall if exp else None,
        "f1": exp.f1 if exp else None,
        "roc_auc": exp.roc_auc if exp else None,
        "false_negative_rate": fn_rate,
        "override_rate": override_rate,
        "high_threshold": _thresholds["high"],
        "critical_threshold": _thresholds["critical"],
        "fn_warning": fn_rate > 0.15
    }
