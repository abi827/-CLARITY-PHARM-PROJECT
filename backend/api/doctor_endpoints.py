"""
Doctor / Prescriber API endpoints.

All routes are prefixed with /api/doctor (registered in main.py).
These routes require authentication and enforce role = "Prescriber/Doctor".
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date
import random
import string
import json

from ..database.connection import get_db
from ..database import models
from ..api.auth import get_current_user
from ..services import priority_engine

router = APIRouter(prefix="/doctor", tags=["Doctor"])


# ─── Role guard ─────────────────────────────────────────────────────────────

def require_doctor(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "Prescriber/Doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Doctor/Prescriber role required."
        )
    return current_user


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _gen_rx_id(db: Session) -> str:
    """Generate a unique RX-XXXXX prescription ID."""
    for _ in range(20):
        num = random.randint(10000, 99999)
        rx_id = f"RX-{num}"
        exists = db.query(models.Prescription).filter(
            models.Prescription.prescription_id == rx_id
        ).first()
        if not exists:
            return rx_id
    # fallback with timestamp
    return f"RX-{int(datetime.utcnow().timestamp())}"


def _serialize_prescription(p: models.Prescription) -> dict:
    return {
        "id": p.id,
        "prescription_id": p.prescription_id,
        "doctor_id": p.doctor_id,
        "doctor_name": p.doctor_name,
        "patient_id": p.patient_id,
        "department": p.department,
        "medicine": p.medicine,
        "medicine_risk": p.medicine_risk,
        "dose": p.dose,
        "frequency": p.frequency,
        "route": p.route,
        "duration": p.duration,
        "quantity": p.quantity,
        "instructions": p.instructions,
        "additional_notes": p.additional_notes,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _serialize_clarification(c: models.ClarificationRequest, prescription: Optional[models.Prescription] = None) -> dict:
    p = prescription or c.linked_prescription
    return {
        "id": c.id,
        "clarification_id": c.clarification_id,
        "prescription_id": c.prescription_id,
        "patient_id": c.patient_id,
        "department": c.department,
        "medicine_category": c.medicine_category,
        "medicine_risk": c.medicine_risk,
        "pharmacist_question": c.pharmacist_question,
        "doctor_response": c.doctor_response,
        "status": c.status,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "prescription_db_id": c.prescription_db_id,
        # Extra prescription context if linked
        "medicine": p.medicine if p else c.medicine_category,
        "dose": p.dose if p else None,
    }


def _serialize_notification(n: models.DoctorNotification) -> dict:
    return {
        "id": n.id,
        "notification_type": n.notification_type,
        "title": n.title,
        "message": n.message,
        "prescription_id": n.prescription_id,
        "clarification_id": n.clarification_id,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


# ─── Medicine catalogue (synthetic) ─────────────────────────────────────────

MEDICINE_CATALOGUE = [
    {"name": "Amoxicillin", "risk": "Low"},
    {"name": "Paracetamol", "risk": "Low"},
    {"name": "Ibuprofen", "risk": "Low"},
    {"name": "Metformin", "risk": "Medium"},
    {"name": "Lisinopril", "risk": "Medium"},
    {"name": "Atorvastatin", "risk": "Medium"},
    {"name": "Salbutamol", "risk": "Medium"},
    {"name": "Warfarin", "risk": "High"},
    {"name": "Insulin Glargine", "risk": "High"},
    {"name": "Digoxin", "risk": "High"},
    {"name": "Heparin", "risk": "High"},
    {"name": "Methotrexate", "risk": "Critical"},
    {"name": "Clozapine", "risk": "Critical"},
    {"name": "Lithium", "risk": "Critical"},
    {"name": "Vancomycin", "risk": "Critical"},
]

SYNTHETIC_PATIENT_IDS = [f"PAT-{str(i).zfill(4)}" for i in range(1, 51)]


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
def doctor_dashboard(
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Today's prescriptions
    todays_rx = db.query(models.Prescription).filter(
        models.Prescription.doctor_id == doctor.id,
        models.Prescription.created_at >= today_start
    ).count()

    # All prescriptions for this doctor
    all_rx = db.query(models.Prescription).filter(
        models.Prescription.doctor_id == doctor.id
    )

    sent_to_pharmacy = all_rx.filter(
        models.Prescription.status.in_([
            "Sent to Pharmacy", "Under Review", "Clarification Required",
            "Response Submitted", "Resolved"
        ])
    ).count()

    resolved = all_rx.filter(models.Prescription.status == "Resolved").count()

    # Pending clarifications for this doctor (linked prescriptions with pharmacist question)
    pending_clars = db.query(models.ClarificationRequest).filter(
        models.ClarificationRequest.prescription_db_id.isnot(None),
        models.ClarificationRequest.pharmacist_question.isnot(None),
        models.ClarificationRequest.doctor_response.is_(None),
        models.ClarificationRequest.status != "Resolved"
    ).join(
        models.Prescription,
        models.ClarificationRequest.prescription_db_id == models.Prescription.id
    ).filter(
        models.Prescription.doctor_id == doctor.id
    ).count()

    # Unread notifications
    unread_notifs = db.query(models.DoctorNotification).filter(
        models.DoctorNotification.doctor_id == doctor.id,
        models.DoctorNotification.is_read == False
    ).count()

    return {
        "doctor_name": doctor.name,
        "doctor_email": doctor.email,
        "todays_prescriptions": todays_rx,
        "pending_clarifications": pending_clars,
        "sent_to_pharmacy": sent_to_pharmacy,
        "resolved": resolved,
        "unread_notifications": unread_notifs,
    }


# ─── Medicine catalogue ───────────────────────────────────────────────────────

@router.get("/medicines")
def get_medicines(doctor: models.User = Depends(require_doctor)):
    return MEDICINE_CATALOGUE


@router.get("/patient-ids")
def get_patient_ids(doctor: models.User = Depends(require_doctor)):
    return SYNTHETIC_PATIENT_IDS


# ─── Prescriptions ───────────────────────────────────────────────────────────

class PrescriptionCreate(BaseModel):
    patient_id: str
    department: str
    medicine: str
    medicine_risk: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    duration: Optional[str] = None
    quantity: Optional[str] = None
    instructions: Optional[str] = None
    additional_notes: Optional[str] = None
    target_pharmacist_id: Optional[int] = None
    action: str = "draft"  # "draft" or "send"


@router.post("/prescriptions", status_code=201)
def create_prescription(
    body: PrescriptionCreate,
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    rx_id = _gen_rx_id(db)
    status_val = "Sent to Pharmacy" if body.action == "send" else "Draft"

    p = models.Prescription(
        prescription_id=rx_id,
        doctor_id=doctor.id,
        doctor_name=doctor.name,
        patient_id=body.patient_id,
        department=body.department,
        medicine=body.medicine,
        medicine_risk=body.medicine_risk,
        dose=body.dose,
        frequency=body.frequency,
        route=body.route,
        duration=body.duration,
        quantity=body.quantity,
        instructions=body.instructions,
        additional_notes=body.additional_notes,
        status=status_val,
        target_pharmacist_id=body.target_pharmacist_id,
    )
    db.add(p)

    # Audit log
    db.add(models.AuditLog(
        user_email=doctor.email,
        user_role=doctor.role,
        action="PRESCRIPTION_CREATED" if status_val == "Draft" else "PRESCRIPTION_SENT",
        details=f"{rx_id} for {body.patient_id} | {body.medicine} | {status_val}"
    ))
    db.commit()
    db.refresh(p)

    if status_val == "Sent to Pharmacy" and p.target_pharmacist_id is not None:
        score = priority_engine.baseline_score(p.medicine_risk, 0, p.department, "Other")
        priority_level = priority_engine.score_to_priority(score, 0.70, 0.90)
        evidence = priority_engine.build_evidence_text(p.medicine_risk, 0, p.department, "Other")

        c_id = f"CLAR-{random.randint(10000, 99999)}"
        clar = models.ClarificationRequest(
            user_id=p.target_pharmacist_id,
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
            pharmacist_question=None
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
        db.commit()

    return {
        "message": f"Prescription {'saved as draft' if status_val == 'Draft' else 'sent to pharmacy'} successfully.",
        "prescription": _serialize_prescription(p)
    }


@router.get("/prescriptions")
def list_prescriptions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    q = db.query(models.Prescription).filter(
        models.Prescription.doctor_id == doctor.id
    )
    if status:
        q = q.filter(models.Prescription.status == status)
    items = q.order_by(models.Prescription.created_at.desc()).all()
    return [_serialize_prescription(p) for p in items]


@router.get("/prescriptions/{prescription_id}")
def get_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    p = db.query(models.Prescription).filter(
        models.Prescription.prescription_id == prescription_id,
        models.Prescription.doctor_id == doctor.id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found.")

    # Include associated clarifications
    clars = [_serialize_clarification(c) for c in p.clarifications]
    data = _serialize_prescription(p)
    data["clarifications"] = clars
    return data


@router.patch("/prescriptions/{prescription_id}/send")
def send_prescription_to_pharmacy(
    prescription_id: str,
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    p = db.query(models.Prescription).filter(
        models.Prescription.prescription_id == prescription_id,
        models.Prescription.doctor_id == doctor.id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    if p.status != "Draft":
        raise HTTPException(status_code=400, detail="Only Draft prescriptions can be sent.")
    p.status = "Sent to Pharmacy"
    p.updated_at = datetime.utcnow()
    db.add(models.AuditLog(
        user_email=doctor.email, user_role=doctor.role,
        action="PRESCRIPTION_SENT",
        details=f"{prescription_id} sent to pharmacy"
    ))
    db.commit()

    if p.target_pharmacist_id is not None:
        score = priority_engine.baseline_score(p.medicine_risk, 0, p.department, "Other")
        priority_level = priority_engine.score_to_priority(score, 0.70, 0.90)
        evidence = priority_engine.build_evidence_text(p.medicine_risk, 0, p.department, "Other")

        c_id = f"CLAR-{random.randint(10000, 99999)}"
        clar = models.ClarificationRequest(
            user_id=p.target_pharmacist_id,
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
            pharmacist_question=None
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
        db.commit()

    return {"message": "Prescription sent to pharmacy.", "status": p.status}


# ─── Clarification Requests (Doctor view) ────────────────────────────────────

@router.get("/clarifications")
def list_doctor_clarifications(
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    """
    Return all clarification requests linked to any of this doctor's prescriptions
    that have a pharmacist_question set.
    """
    clars = db.query(models.ClarificationRequest).join(
        models.Prescription,
        models.ClarificationRequest.prescription_db_id == models.Prescription.id
    ).filter(
        models.Prescription.doctor_id == doctor.id,
        models.ClarificationRequest.pharmacist_question.isnot(None)
    ).order_by(models.ClarificationRequest.created_at.desc()).all()

    return [_serialize_clarification(c) for c in clars]


class DoctorResponseBody(BaseModel):
    response_text: str


@router.post("/clarifications/{clarification_id}/respond")
def respond_to_clarification(
    clarification_id: int,
    body: DoctorResponseBody,
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    clar = db.query(models.ClarificationRequest).filter(
        models.ClarificationRequest.id == clarification_id
    ).first()
    if not clar:
        raise HTTPException(status_code=404, detail="Clarification not found.")

    # Verify it belongs to this doctor's prescription
    if clar.prescription_db_id:
        rx = db.query(models.Prescription).filter(
            models.Prescription.id == clar.prescription_db_id
        ).first()
        if not rx or rx.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorised.")

    # Save response on the clarification
    clar.doctor_response = body.response_text
    clar.status = "Response Submitted"

    # Update linked prescription status
    if clar.prescription_db_id:
        rx = db.query(models.Prescription).filter(
            models.Prescription.id == clar.prescription_db_id
        ).first()
        if rx:
            rx.status = "Response Submitted"

    # Create DoctorClarificationResponse record
    dcr = models.DoctorClarificationResponse(
        clarification_request_id=clar.id,
        prescription_id=clar.prescription_db_id,
        doctor_id=doctor.id,
        doctor_name=doctor.name,
        response_text=body.response_text,
    )
    db.add(dcr)

    db.add(models.AuditLog(
        user_email=doctor.email, user_role=doctor.role,
        clarification_id=clar.clarification_id,
        action="DOCTOR_RESPONSE_SUBMITTED",
        details=f"Doctor responded to {clar.clarification_id}"
    ))
    db.commit()

    return {"message": "Response submitted successfully.", "status": "Response Submitted"}


# ─── Notifications ────────────────────────────────────────────────────────────

@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    notifs = db.query(models.DoctorNotification).filter(
        models.DoctorNotification.doctor_id == doctor.id
    ).order_by(models.DoctorNotification.created_at.desc()).all()
    return [_serialize_notification(n) for n in notifs]


@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    n = db.query(models.DoctorNotification).filter(
        models.DoctorNotification.id == notif_id,
        models.DoctorNotification.doctor_id == doctor.id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found.")
    n.is_read = True
    db.commit()
    return {"message": "Marked as read."}


@router.patch("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    doctor: models.User = Depends(require_doctor)
):
    db.query(models.DoctorNotification).filter(
        models.DoctorNotification.doctor_id == doctor.id,
        models.DoctorNotification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}
