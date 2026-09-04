import re
import os

filepath = r"c:\Users\ADMIN\Downloads\Ralle project\backend\api\endpoints.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. get_clarifications
content = content.replace(
    "q = db.query(models.ClarificationRequest)\n",
    "q = db.query(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id)\n"
)

# 2. get_clarification, review_clarification, resolve_clarification
content = content.replace(
    "item = db.query(models.ClarificationRequest).filter(models.ClarificationRequest.id == id).first()",
    "item = db.query(models.ClarificationRequest).filter(models.ClarificationRequest.id == id, models.ClarificationRequest.user_id == current_user.id).first()"
)

# 3. get_dashboard
content = content.replace(
    'total_open = db.query(models.ClarificationRequest).filter(',
    'total_open = db.query(models.ClarificationRequest).filter(\n        models.ClarificationRequest.user_id == current_user.id,'
)
content = content.replace(
    'high_priority = db.query(models.ClarificationRequest).join(\n        models.PriorityPrediction, isouter=True).filter(',
    'high_priority = db.query(models.ClarificationRequest).join(\n        models.PriorityPrediction, isouter=True).filter(\n        models.ClarificationRequest.user_id == current_user.id,'
)
content = content.replace(
    'high_risk_pending = db.query(models.ClarificationRequest).filter(',
    'high_risk_pending = db.query(models.ClarificationRequest).filter(\n        models.ClarificationRequest.user_id == current_user.id,'
)
content = content.replace(
    'avg_wait = db.query(func.avg(models.ClarificationRequest.waiting_time_minutes)).filter(',
    'avg_wait = db.query(func.avg(models.ClarificationRequest.waiting_time_minutes)).filter(\n        models.ClarificationRequest.user_id == current_user.id,'
)
content = content.replace(
    'resolved = db.query(models.ResolutionOutcome.resolution_time_minutes).all()',
    'resolved = db.query(models.ResolutionOutcome.resolution_time_minutes).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).all()'
)
content = content.replace(
    'hr_resolved = db.query(models.ResolutionOutcome).join(\n        models.ClarificationRequest,\n        models.ResolutionOutcome.clarification_id == models.ClarificationRequest.id\n    ).filter(models.ClarificationRequest.medicine_risk == "High").all()',
    'hr_resolved = db.query(models.ResolutionOutcome).join(\n        models.ClarificationRequest,\n        models.ResolutionOutcome.clarification_id == models.ClarificationRequest.id\n    ).filter(models.ClarificationRequest.user_id == current_user.id, models.ClarificationRequest.medicine_risk == "High").all()'
)
content = content.replace(
    'dist = db.query(\n        models.PriorityPrediction.priority_level,\n        func.count(models.PriorityPrediction.id)\n    ).group_by(models.PriorityPrediction.priority_level).all()',
    'dist = db.query(\n        models.PriorityPrediction.priority_level,\n        func.count(models.PriorityPrediction.id)\n    ).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).group_by(models.PriorityPrediction.priority_level).all()'
)

# 4. get_analytics
content = content.replace(
    'by_dept = db.query(models.ClarificationRequest.department, func.count()).group_by(',
    'by_dept = db.query(models.ClarificationRequest.department, func.count()).filter(models.ClarificationRequest.user_id == current_user.id).group_by('
)
content = content.replace(
    'by_risk = db.query(models.ClarificationRequest.medicine_risk, func.count()).group_by(',
    'by_risk = db.query(models.ClarificationRequest.medicine_risk, func.count()).filter(models.ClarificationRequest.user_id == current_user.id).group_by('
)
content = content.replace(
    'by_priority = db.query(models.PriorityPrediction.priority_level, func.count()).group_by(',
    'by_priority = db.query(models.PriorityPrediction.priority_level, func.count()).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).group_by('
)
content = content.replace(
    'by_type = db.query(models.ClarificationRequest.clarification_type, func.count()).group_by(',
    'by_type = db.query(models.ClarificationRequest.clarification_type, func.count()).filter(models.ClarificationRequest.user_id == current_user.id).group_by('
)
content = content.replace(
    'total_reviews = db.query(models.ReviewAction).count()',
    'total_reviews = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).count()'
)
content = content.replace(
    'overrides = db.query(models.ReviewAction).filter(models.ReviewAction.action_type == "Override").count()',
    'overrides = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id, models.ReviewAction.action_type == "Override").count()'
)

# 5. run_experiment
content = content.replace(
    'exp = models.ExperimentResult(\n        model_name=best_name,',
    'exp = models.ExperimentResult(\n        user_id=current_user.id,\n        model_name=best_name,'
)

# 6. get_latest_experiment
content = content.replace(
    'exp = db.query(models.ExperimentResult).order_by(models.ExperimentResult.created_at.desc()).first()',
    'exp = db.query(models.ExperimentResult).filter(models.ExperimentResult.user_id == current_user.id).order_by(models.ExperimentResult.created_at.desc()).first()'
)

# 7. get_audit_log
content = content.replace(
    'logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(200).all()',
    'logs = db.query(models.AuditLog).filter(models.AuditLog.user_email == current_user.email).order_by(models.AuditLog.timestamp.desc()).limit(200).all()'
)

# 8. submit_feedback
content = content.replace(
    'fb = models.StakeholderFeedback(\n        user_email=current_user.email, user_role=current_user.role,',
    'fb = models.StakeholderFeedback(\n        user_id=current_user.id,\n        user_email=current_user.email, user_role=current_user.role,'
)

# 9. get_feedback_summary
content = content.replace(
    'rows = db.query(models.StakeholderFeedback).all()',
    'rows = db.query(models.StakeholderFeedback).filter(models.StakeholderFeedback.user_id == current_user.id).all()'
)

# 10. get_model_metrics
content = content.replace(
    'exp = db.query(models.ExperimentResult).order_by(models.ExperimentResult.created_at.desc()).first()',
    'exp = db.query(models.ExperimentResult).filter(models.ExperimentResult.user_id == current_user.id).order_by(models.ExperimentResult.created_at.desc()).first()'
)
content = content.replace(
    'total_reviews = db.query(models.ReviewAction).count()',
    'total_reviews = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id).count()'
)
content = content.replace(
    'overrides = db.query(models.ReviewAction).filter(models.ReviewAction.action_type == "Override").count()',
    'overrides = db.query(models.ReviewAction).join(models.ClarificationRequest).filter(models.ClarificationRequest.user_id == current_user.id, models.ReviewAction.action_type == "Override").count()'
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated endpoints.py successfully")
