from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ClarificationBase(BaseModel):
    clarification_id: str
    patient_id: str
    prescription_id: str
    department: str
    medicine_category: str
    medicine_risk: str
    waiting_time_minutes: int
    clarification_type: str
    urgency: str
    time_of_day: str
    day_of_week: str
    status: str
    assigned_pharmacist: Optional[str] = None

class ClarificationResponse(ClarificationBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PriorityPredictionBase(BaseModel):
    score: float
    priority_level: str
    evidence_json: str
    
class PriorityPredictionResponse(PriorityPredictionBase):
    id: int
    clarification_id: int
    
    class Config:
        from_attributes = True

class ReviewActionCreate(BaseModel):
    pharmacist_id: str
    action_type: str
    previous_priority: str
    new_priority: str
    reason: str

class ResolutionOutcomeCreate(BaseModel):
    outcome: str
    resolution_time_minutes: int
    resolved_by: str
