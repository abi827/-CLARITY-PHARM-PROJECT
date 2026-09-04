import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

# Constants
NUM_RECORDS = 10000
OUTPUT_DIR = os.path.join("data", "synthetic")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "clarifications.csv")

DEPARTMENTS = ["Ward", "Operating Room", "Outpatient"]
MEDICINE_RISK = ["Low", "Medium", "High"]
CLARIFICATION_TYPES = [
    "Dose", "Frequency", "Route", "Drug interaction", 
    "Duplicate therapy", "Missing information", "Duration", 
    "Formulation", "Quantity", "Other"
]
RESOLUTION_OUTCOMES = [
    "Resolved quickly", "Resolved after clarification", 
    "Escalated", "Cancelled", "Delayed"
]
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
TIME_OF_DAY = ["Morning", "Afternoon", "Evening", "Night"]

def generate_data(num_records):
    np.random.seed(42)
    random.seed(42)
    
    data = []
    
    for i in range(num_records):
        clarification_id = f"CLAR-{50000 + i}"
        patient_id = f"PAT-{1000 + i}"
        prescription_id = f"RX-{10000 + i}"
        
        # Department and corresponding baseline urgency
        dept_probs = [0.4, 0.1, 0.5] # 40% Ward, 10% OR, 50% Outpatient
        department = np.random.choice(DEPARTMENTS, p=dept_probs)
        
        # Medicine risk
        risk_probs = [0.5, 0.3, 0.2] # 50% Low, 30% Medium, 20% High
        medicine_risk = np.random.choice(MEDICINE_RISK, p=risk_probs)
        
        # Clarification type
        clarification_type = random.choice(CLARIFICATION_TYPES)
        
        # Urgency - correlated with department and risk
        if department == "Operating Room":
            urgency = np.random.choice(["High", "Critical"], p=[0.3, 0.7])
        elif medicine_risk == "High":
            urgency = np.random.choice(["Medium", "High", "Critical"], p=[0.2, 0.6, 0.2])
        else:
            urgency = np.random.choice(["Low", "Medium", "High"], p=[0.6, 0.3, 0.1])
            
        # Waiting time (minutes) - correlated with department and urgency
        if urgency in ["Critical", "High"] or department == "Operating Room":
            waiting_time = int(np.random.gamma(shape=2.0, scale=10.0)) # Shorter wait times expected for high urgency
        else:
            waiting_time = int(np.random.gamma(shape=2.0, scale=30.0)) # Longer wait times for lower urgency
            
        waiting_time = max(1, waiting_time)
        
        time_of_day = random.choice(TIME_OF_DAY)
        day_of_week = random.choice(DAYS_OF_WEEK)
        
        # Medicine category (simplified)
        medicine_category = random.choice(["Analgesic", "Antibiotic", "Cardiovascular", "Respiratory", "CNS", "Other"])
        
        # Response and resolution time
        prescriber_response_time = max(1, int(np.random.normal(loc=waiting_time * 0.8, scale=5)))
        resolution_time_minutes = waiting_time + prescriber_response_time + random.randint(1, 15)
        
        # Resolution outcome
        if resolution_time_minutes < 30:
            resolution_outcome = "Resolved quickly"
        elif resolution_time_minutes > 120:
            resolution_outcome = np.random.choice(["Escalated", "Delayed", "Cancelled"], p=[0.4, 0.5, 0.1])
        else:
            resolution_outcome = "Resolved after clarification"
            
        # Base priority logic (Target variable for ML)
        # 1 = HIGH PRIORITY, 0 = NORMAL PRIORITY
        priority_score = 0
        if medicine_risk == "High": priority_score += 40
        elif medicine_risk == "Medium": priority_score += 15
        
        if waiting_time > 60: priority_score += 30
        elif waiting_time > 30: priority_score += 15
        
        if department == "Operating Room": priority_score += 20
        elif department == "Ward": priority_score += 10
        
        if urgency in ["High", "Critical"]: priority_score += 10
        
        # Introduce some random noise
        priority_score += random.randint(-10, 10)
        
        priority_label = 1 if priority_score >= 60 else 0
        
        data.append({
            "clarification_id": clarification_id,
            "patient_id": patient_id,
            "prescription_id": prescription_id,
            "department": department,
            "medicine_category": medicine_category,
            "medicine_risk": medicine_risk,
            "waiting_time_minutes": waiting_time,
            "clarification_type": clarification_type,
            "urgency": urgency,
            "time_of_day": time_of_day,
            "day_of_week": day_of_week,
            "prescriber_response_time": prescriber_response_time,
            "resolution_time_minutes": resolution_time_minutes,
            "resolution_outcome": resolution_outcome,
            "priority_label": priority_label
        })
        
    return pd.DataFrame(data)

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating {NUM_RECORDS} synthetic records...")
    df = generate_data(NUM_RECORDS)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved synthetic data to {OUTPUT_FILE}")
    
    # Print some stats
    print("\nDataset Stats:")
    print(f"Total records: {len(df)}")
    print(f"High Priority (1): {df['priority_label'].sum()} ({(df['priority_label'].sum() / len(df)) * 100:.1f}%)")
    print(f"Normal Priority (0): {len(df) - df['priority_label'].sum()} ({((len(df) - df['priority_label'].sum()) / len(df)) * 100:.1f}%)")
