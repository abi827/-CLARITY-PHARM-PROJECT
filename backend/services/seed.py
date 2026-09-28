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

        MEDICINE_CATALOG = {
            ('Cardiovascular', 'High'): [('Warfarin', '5 mg'), ('Digoxin', '0.25 mg')],
            ('Cardiovascular', 'Medium'): [('Atorvastatin', '40 mg'), ('Amlodipine', '10 mg')],
            ('Cardiovascular', 'Low'): [('Lisinopril', '10 mg'), ('Metoprolol', '25 mg')],
            ('Antibiotic', 'High'): [('Vancomycin', '1 g IV'), ('Gentamicin', '80 mg IV')],
            ('Antibiotic', 'Medium'): [('Ciprofloxacin', '500 mg'), ('Azithromycin', '500 mg')],
            ('Antibiotic', 'Low'): [('Amoxicillin', '500 mg'), ('Cephalexin', '500 mg')],
            ('CNS', 'High'): [('Phenytoin', '100 mg'), ('Lithium', '300 mg')],
            ('CNS', 'Medium'): [('Sertraline', '50 mg'), ('Lorazepam', '1 mg')],
            ('CNS', 'Low'): [('Paroxetine', '20 mg'), ('Escitalopram', '10 mg')],
            ('Analgesic', 'High'): [('Morphine', '10 mg'), ('Fentanyl', '25 mcg/hr')],
            ('Analgesic', 'Medium'): [('Tramadol', '50 mg'), ('Codeine', '30 mg')],
            ('Analgesic', 'Low'): [('Paracetamol', '1000 mg'), ('Ibuprofen', '400 mg')],
            ('Respiratory', 'High'): [('Theophylline', '200 mg'), ('Formoterol', '12 mcg')],
            ('Respiratory', 'Medium'): [('Salbutamol', '100 mcg'), ('Budesonide', '200 mcg')],
            ('Respiratory', 'Low'): [('Cetirizine', '10 mg'), ('Montelukast', '10 mg')],
        }

        for i, row in df_sample.iterrows():
            created_at = datetime.utcnow() - timedelta(minutes=random.randint(5, 480))
            cat_opts = MEDICINE_CATALOG.get((row['medicine_category'], row['medicine_risk']), [('Paracetamol', '500 mg')])
            med_choice = random.choice(cat_opts)

            clarification = models.ClarificationRequest(
                user_id=user_id,
                clarification_id=f"U{user_id}-{row['clarification_id']}",
                patient_id=row['patient_id'],
                prescription_id=row['prescription_id'],
                department=row['department'],
                medicine_category=row['medicine_category'],
                medicine_risk=row['medicine_risk'],
                medicine_name=med_choice[0],
                dose=med_choice[1],
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

    # If Doctor / Prescriber, seed realistic demo prescriptions & notifications
    if user_role in ["Prescriber/Doctor", "Doctor", "Prescriber"]:
        user_name = db.query(models.User.name).filter(models.User.id == user_id).scalar() or "Doctor"
        now = datetime.utcnow()

        # 1. Draft prescription
        rx_draft = models.Prescription(
            prescription_id=f"RX-{random.randint(10000, 99999)}",
            doctor_id=user_id,
            doctor_name=user_name,
            patient_id="PAT-0003",
            department="Outpatient",
            medicine="Paracetamol",
            medicine_risk="Low",
            dose="500 mg",
            frequency="Every 6 hours as needed",
            route="Oral",
            duration="5 days",
            quantity="20 tablets",
            instructions="Take with a full glass of water after food.",
            additional_notes="Patient reporting mild headache.",
            status="Draft",
            created_at=now - timedelta(hours=1)
        )
        db.add(rx_draft)

        # 2. Sent to Pharmacy prescription
        rx_sent = models.Prescription(
            prescription_id=f"RX-{random.randint(10000, 99999)}",
            doctor_id=user_id,
            doctor_name=user_name,
            patient_id="PAT-0008",
            department="Ward",
            medicine="Amoxicillin",
            medicine_risk="Low",
            dose="500 mg",
            frequency="Three times daily",
            route="Oral",
            duration="7 days",
            quantity="21 capsules",
            instructions="Complete full antibiotic course.",
            additional_notes="Post-op infection prophylaxis.",
            status="Sent to Pharmacy",
            created_at=now - timedelta(hours=2)
        )
        db.add(rx_sent)

        # 3. Prescription with Clarification Required
        rx_clar = models.Prescription(
            prescription_id=f"RX-{random.randint(10000, 99999)}",
            doctor_id=user_id,
            doctor_name=user_name,
            patient_id="PAT-0015",
            department="Operating Room",
            medicine="Warfarin",
            medicine_risk="High",
            dose="5 mg",
            frequency="Once daily at 6 PM",
            route="Oral",
            duration="14 days",
            quantity="14 tablets",
            instructions="Take with water at the same time each evening.",
            additional_notes="Cardiac patient post-valve replacement.",
            status="Clarification Required",
            created_at=now - timedelta(hours=3)
        )
        db.add(rx_clar)
        db.flush()

        c_id = f"CLAR-{random.randint(10000, 99999)}"
        clar_req = models.ClarificationRequest(
            user_id=None,
            clarification_id=c_id,
            patient_id=rx_clar.patient_id,
            prescription_id=rx_clar.prescription_id,
            department=rx_clar.department,
            medicine_category=rx_clar.medicine,
            medicine_risk=rx_clar.medicine_risk,
            waiting_time_minutes=35,
            clarification_type="Dose",
            urgency="Urgent",
            status="Pending",
            prescription_db_id=rx_clar.id,
            pharmacist_question="Patient's latest INR is 3.8 (target 2.0-3.0). Please confirm target INR range and whether to hold or reduce tonight's dose.",
            created_at=now - timedelta(minutes=45)
        )
        db.add(clar_req)

        db.add(models.DoctorNotification(
            doctor_id=user_id,
            notification_type="CLARIFICATION_REQUEST",
            title="NEW CLARIFICATION REQUEST",
            message=f"Pharmacy has requested clarification for: {rx_clar.prescription_id}",
            prescription_id=rx_clar.prescription_id,
            clarification_id=c_id,
            is_read=False,
            created_at=now - timedelta(minutes=45)
        ))

        # 4. Approved prescription
        rx_appr = models.Prescription(
            prescription_id=f"RX-{random.randint(10000, 99999)}",
            doctor_id=user_id,
            doctor_name=user_name,
            patient_id="PAT-0022",
            department="Outpatient",
            medicine="Atorvastatin",
            medicine_risk="Medium",
            dose="20 mg",
            frequency="Once daily at night",
            route="Oral",
            duration="30 days",
            quantity="30 tablets",
            instructions="Take once daily at bedtime.",
            additional_notes="Lipid management therapy.",
            status="Approved",
            created_at=now - timedelta(hours=5)
        )
        db.add(rx_appr)

        db.add(models.DoctorNotification(
            doctor_id=user_id,
            notification_type="RESOLVED",
            title="PRESCRIPTION APPROVED",
            message=f"Pharmacy has approved prescription: {rx_appr.prescription_id}",
            prescription_id=rx_appr.prescription_id,
            is_read=True,
            created_at=now - timedelta(hours=4)
        ))

    db.commit()
    print(f"Seeded synthetic demo data for user_id={user_id}.")
