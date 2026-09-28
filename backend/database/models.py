from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Pharmacist")  # Pharmacist, Clinical Reviewer, Pharmacy Supervisor, Prescriber
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    clarifications = relationship("ClarificationRequest", back_populates="user")
    feedback = relationship("StakeholderFeedback", back_populates="user")
    experiments = relationship("ExperimentResult", back_populates="user")


class ClarificationRequest(Base):
    __tablename__ = "clarification_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    clarification_id = Column(String, unique=True, index=True)
    patient_id = Column(String, index=True)
    prescription_id = Column(String, index=True)
    department = Column(String)
    medicine_category = Column(String)
    medicine_risk = Column(String)
    waiting_time_minutes = Column(Integer)
    clarification_type = Column(String)
    urgency = Column(String)
    time_of_day = Column(String)
    day_of_week = Column(String)
    status = Column(String, default="Pending")
    assigned_pharmacist = Column(String, nullable=True)
    current_priority = Column(String, nullable=True)  # overrideable priority
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # NEW: link back to a Doctor's prescription (nullable — existing data unaffected)
    prescription_db_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    medicine_name = Column(String, nullable=True)
    dose = Column(String, nullable=True)
    pharmacist_question = Column(Text, nullable=True)  # Question Pharmacist sends to Doctor
    doctor_response = Column(Text, nullable=True)       # Doctor's answer

    prediction = relationship("PriorityPrediction", back_populates="clarification", uselist=False)
    reviews = relationship("ReviewAction", back_populates="clarification")
    resolution = relationship("ResolutionOutcome", back_populates="clarification", uselist=False)
    user = relationship("User", back_populates="clarifications")
    linked_prescription = relationship("Prescription", back_populates="clarifications", foreign_keys=[prescription_db_id])
    doctor_clarification_responses = relationship("DoctorClarificationResponse", back_populates="clarification_request")


class PriorityPrediction(Base):
    __tablename__ = "priority_predictions"

    id = Column(Integer, primary_key=True, index=True)
    clarification_id = Column(Integer, ForeignKey("clarification_requests.id"))
    score = Column(Float)
    priority_level = Column(String)  # CRITICAL, HIGH, MEDIUM, LOW
    evidence_json = Column(Text)  # Store evidence as JSON string
    
    clarification = relationship("ClarificationRequest", back_populates="prediction")


class ReviewAction(Base):
    __tablename__ = "review_actions"

    id = Column(Integer, primary_key=True, index=True)
    clarification_id = Column(Integer, ForeignKey("clarification_requests.id"))
    pharmacist_id = Column(String)
    action_type = Column(String)  # Accept, Override, Escalate, Request More Information, Resolve
    previous_priority = Column(String)
    new_priority = Column(String)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    clarification = relationship("ClarificationRequest", back_populates="reviews")


class ResolutionOutcome(Base):
    __tablename__ = "resolution_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    clarification_id = Column(Integer, ForeignKey("clarification_requests.id"))
    outcome = Column(String)
    resolution_time_minutes = Column(Integer)
    resolved_by = Column(String)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    clarification = relationship("ClarificationRequest", back_populates="resolution")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_email = Column(String)
    user_role = Column(String)
    clarification_id = Column(String, nullable=True)
    action = Column(String)
    previous_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    details = Column(Text, nullable=True)


class StakeholderFeedback(Base):
    __tablename__ = "stakeholder_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_email = Column(String)
    user_role = Column(String)
    q1_queue_clarity = Column(Integer)   # 1-5
    q2_evidence_clarity = Column(Integer)  # 1-5
    q3_workflow_practical = Column(Integer)  # 1-5
    q4_reduce_delays = Column(Integer)  # 1-5
    q5_review_points_clear = Column(Integer)  # 1-5
    q6_false_negatives_clear = Column(Integer)  # 1-5
    comments = Column(Text, nullable=True)
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="feedback")


class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    model_name = Column(String)
    dataset_size = Column(Integer)
    random_seed = Column(Integer)
    priority_threshold = Column(Float)
    target_early_res_rate = Column(Float)
    baseline_early_res_rate = Column(Float)
    model_early_res_rate = Column(Float)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1 = Column(Float)
    roc_auc = Column(Float, nullable=True)
    tn = Column(Integer)
    fp = Column(Integer)
    fn = Column(Integer)
    tp = Column(Integer)
    metrics_json = Column(Text, nullable=True)  # full metrics breakdown
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="experiments")


# ─── Doctor / Prescriber Models ──────────────────────────────────────────────

class Prescription(Base):
    """A prescription created by a Doctor/Prescriber."""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(String, unique=True, index=True, nullable=False)  # e.g. RX-10023
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_name = Column(String, nullable=False)
    patient_id = Column(String, nullable=False)   # Synthetic, e.g. PAT-0001
    department = Column(String, nullable=False)   # Ward, Operating Room, Outpatient
    medicine = Column(String, nullable=False)
    medicine_risk = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    dose = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    route = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    quantity = Column(String, nullable=True)
    instructions = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    status = Column(String, default="Draft")  # Draft, Sent to Pharmacy, Under Review, Clarification Required, Response Submitted, Resolved
    target_pharmacist_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Which pharmacist to send to
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    doctor = relationship("User", foreign_keys=[doctor_id])
    target_pharmacist = relationship("User", foreign_keys=[target_pharmacist_id])
    clarifications = relationship("ClarificationRequest", back_populates="linked_prescription", foreign_keys="ClarificationRequest.prescription_db_id")
    doctor_responses = relationship("DoctorClarificationResponse", back_populates="prescription")


class DoctorClarificationResponse(Base):
    """A Doctor's response to a Pharmacist's clarification request."""
    __tablename__ = "doctor_clarification_responses"

    id = Column(Integer, primary_key=True, index=True)
    clarification_request_id = Column(Integer, ForeignKey("clarification_requests.id"), nullable=False)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_name = Column(String, nullable=False)
    response_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    clarification_request = relationship("ClarificationRequest", back_populates="doctor_clarification_responses")
    prescription = relationship("Prescription", back_populates="doctor_responses")
    doctor = relationship("User", foreign_keys=[doctor_id])


class DoctorNotification(Base):
    """Notifications pushed to a Doctor."""
    __tablename__ = "doctor_notifications"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notification_type = Column(String, nullable=False)  # CLARIFICATION_REQUEST, RESOLVED, RESPONSE_RECEIVED
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    prescription_id = Column(String, nullable=True)   # RX string id for display
    clarification_id = Column(String, nullable=True)  # CLAR string id for display
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("User", foreign_keys=[doctor_id])
