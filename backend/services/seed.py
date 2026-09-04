import os
import random
import json
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..database import models
from .priority_engine import baseline_score, score_to_priority, build_evidence_text

def seed_user_data(user_id: int, user_email: str, user_role: str, db: Session):
    print(f"Seeding synthetic demo data for user_id={user_id}...")
    csv_path = os.path.join("data", "synthetic", "clarifications.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        # Give each user a slightly different sample
        df_sample = df.sample(100).reset_index(drop=True)

        for i, row in df_sample.iterrows():
            created_at = datetime.utcnow() - timedelta(minutes=random.randint(5, 480))

            clarification = models.ClarificationRequest(
                user_id=user_id,
                clarification_id=f"U{user_id}-{row['clarification_id']}",
                patient_id=row['patient_id'],
                prescription_id=row['prescription_id'],
                department=row['department'],
                medicine_category=row['medicine_category'],
                medicine_risk=row['medicine_risk'],
                waiting_time_minutes=row['waiting_time_minutes'],
                clarification_type=row['clarification_type'],
                urgency=row['urgency'],
                time_of_day=row['time_of_day'],
                day_of_week=row['day_of_week'],
                status="Pending",
                created_at=created_at
            )
            db.add(clarification)
            db.flush()

            result = baseline_score(
                row['medicine_risk'], row['waiting_time_minutes'],
                row['department'], row['clarification_type']
            )
            score = result['score']
            score = min(1.0, max(0.0, score + random.uniform(-0.05, 0.05)))
            plevel = score_to_priority(score)
            evidence_reason = build_evidence_text(
                row['medicine_risk'], row['waiting_time_minutes'],
                row['department'], row['clarification_type'], score, plevel
            )

            prediction = models.PriorityPrediction(
                clarification_id=clarification.id,
                score=round(score, 4),
                priority_level=plevel,
                evidence_json=json.dumps({
                    "contributions": result['contributions'],
                    "raw": result['raw'],
                    "reason": evidence_reason
                })
            )
            db.add(prediction)

        print(f"Seeded 100 clarifications for user_id={user_id}.")
    else:
        print("WARNING: Synthetic data CSV not found.")

    # Seed some feedback
    demo_feedback = [
        {"q1": 4, "q2": 4, "q3": 5, "q4": 4, "q5": 5, "q6": 4, "comments": "The evidence panel is clear and helps justify the AI recommendation."},
        {"q1": 5, "q2": 3, "q3": 4, "q4": 5, "q5": 4, "q6": 3, "comments": "Would benefit from more granular false-negative explanation."},
        {"q1": 4, "q2": 4, "q3": 4, "q4": 4, "q5": 4, "q6": 5, "comments": "Override tracking and audit log are excellent for governance."}
    ]
    for fb in demo_feedback:
        db.add(models.StakeholderFeedback(
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            q1_queue_clarity=fb["q1"], q2_evidence_clarity=fb["q2"],
            q3_workflow_practical=fb["q3"], q4_reduce_delays=fb["q4"],
            q5_review_points_clear=fb["q5"], q6_false_negatives_clear=fb["q6"],
            comments=fb["comments"], is_synthetic=True
        ))
    db.commit()
    print(f"Seeded synthetic stakeholder feedback for user_id={user_id}.")
