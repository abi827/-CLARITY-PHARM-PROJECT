import json
import math
import numpy as np
import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix)

DATA_PATH = os.path.join("data", "synthetic", "clarifications.csv")
MODELS_DIR = "models"
BEST_MODEL_PATH = os.path.join(MODELS_DIR, "best_model.pkl")

MEDICINE_RISK_SCORE = {"Low": 0.25, "Medium": 0.60, "High": 1.00, "Critical": 1.50}
DEPT_URGENCY_SCORE = {"Operating Room": 1.00, "Ward": 0.65, "Outpatient": 0.30}
CLARIFICATION_SEVERITY = {
    "Drug interaction": 1.00, "Dose": 0.90, "Duplicate therapy": 0.85,
    "Route": 0.75, "Frequency": 0.70, "Missing information": 0.65,
    "Duration": 0.55, "Formulation": 0.50, "Quantity": 0.35, "Other": 0.30,
    "Prescription Verification": 0.40, "Prescription Approved": 0.40
}
WEIGHTS = {"medicine_risk": 0.40, "waiting_time": 0.30, "department": 0.20, "clarification": 0.10}


def score_to_priority(score: any, threshold_high: float = 0.70, threshold_critical: float = 0.90) -> str:
    if isinstance(score, dict):
        score = score.get("score", 0.0)
    if not isinstance(score, (int, float)):
        try:
            score = float(score)
        except (ValueError, TypeError):
            score = 0.0
    if score >= threshold_critical:
        return "CRITICAL"
    elif score >= threshold_high:
        return "HIGH"
    elif score >= 0.40:
        return "MEDIUM"
    else:
        return "LOW"


def baseline_score(medicine_risk: str, waiting_time: int, department: str,
                   clarification_type: str, max_wait: int = 120) -> dict:
    risk_score = MEDICINE_RISK_SCORE.get(medicine_risk, 0.5)
    wait_norm = min(waiting_time / max_wait, 1.0)
    dept_score = DEPT_URGENCY_SCORE.get(department, 0.30)
    clar_score = CLARIFICATION_SEVERITY.get(clarification_type, 0.40)

    total = (WEIGHTS["medicine_risk"] * risk_score +
             WEIGHTS["waiting_time"] * wait_norm +
             WEIGHTS["department"] * dept_score +
             WEIGHTS["clarification"] * clar_score)

    return {
        "score": round(total, 4),
        "contributions": {
            "medicine_risk": round(WEIGHTS["medicine_risk"] * risk_score, 4),
            "waiting_time": round(WEIGHTS["waiting_time"] * wait_norm, 4),
            "department": round(WEIGHTS["department"] * dept_score, 4),
            "clarification_type": round(WEIGHTS["clarification"] * clar_score, 4)
        },
        "raw": {
            "medicine_risk_score": risk_score,
            "waiting_time_normalized": round(wait_norm, 4),
            "department_urgency_score": dept_score,
            "clarification_severity_score": clar_score
        }
    }


def ml_score(medicine_risk: str, waiting_time: int, department: str,
             clarification_type: str, medicine_category: str = "Other",
             urgency: str = "Medium") -> dict:
    model = load_model()
    if model is None:
        return baseline_score(medicine_risk, waiting_time, department, clarification_type)

    X = pd.DataFrame([{
        "department": department,
        "medicine_category": medicine_category,
        "medicine_risk": medicine_risk,
        "waiting_time_minutes": waiting_time,
        "clarification_type": clarification_type,
        "urgency": urgency
    }])

    proba = model.predict_proba(X)[0][1]

    bl = baseline_score(medicine_risk, waiting_time, department, clarification_type)
    return {
        "score": round(float(proba), 4),
        "contributions": bl["contributions"],
        "raw": bl["raw"],
        "model": "gradient_boosting"
    }


def load_model():
    if os.path.exists(BEST_MODEL_PATH):
        try:
            return joblib.load(BEST_MODEL_PATH)
        except Exception:
            return None
    return None


def build_evidence_text(medicine_risk: str, waiting_time: int, department: str,
                        clarification_type: str, score: any = None, priority: str = None) -> str:
    if priority is None:
        if score is None:
            res = baseline_score(medicine_risk, waiting_time, department, clarification_type)
            score = res.get("score", 0.0)
        priority = score_to_priority(score)

    parts = []
    if medicine_risk == "Critical":
        parts.append("critical-risk medication")
    elif medicine_risk == "High":
        parts.append("high medicine risk")
    elif medicine_risk == "Medium":
        parts.append("medium medicine risk")
    if waiting_time >= 45:
        parts.append(f"a long waiting time ({waiting_time} minutes)")
    elif waiting_time >= 20:
        parts.append(f"a moderate waiting time ({waiting_time} minutes)")
    if department == "Operating Room":
        parts.append("an Operating Room workflow")
    elif department == "Ward":
        parts.append("a Ward workflow")
    severity = CLARIFICATION_SEVERITY.get(clarification_type, 0.4)
    if severity >= 0.80:
        parts.append(f"a high-severity clarification type ({clarification_type})")
    if not parts:
        parts.append("the combination of clinical factors")
    reason = f"This clarification received priority {priority} because it involves " + ", ".join(parts) + "."
    return reason


def run_full_experiment(dataset_size: int = 10000, random_seed: int = 42,
                        priority_threshold: float = 0.70, target_res_rate: float = 0.80,
                        early_res_minutes: int = 60):
    if not os.path.exists(DATA_PATH):
        return None

    df = pd.read_csv(DATA_PATH)
    if len(df) > dataset_size:
        df = df.sample(dataset_size, random_state=random_seed)

    features = ["department", "medicine_category", "medicine_risk",
                "waiting_time_minutes", "clarification_type", "urgency"]
    target = "priority_label"
    X, y = df[features], df[target]
    cat_cols = ["department", "medicine_category", "medicine_risk", "clarification_type", "urgency"]
    num_cols = ["waiting_time_minutes"]
    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)
    ])

    idx = np.arange(len(df))
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, idx, test_size=0.2, random_state=random_seed, stratify=y)
    df_test = df.iloc[idx_test].copy()

    def early_res_rate(df_sub, y_pred_arr):
        hr_mask = df_sub["medicine_risk"] == "High"
        df_hr = df_sub[hr_mask].copy()
        if len(df_hr) == 0:
            return 0.0
        pred_hr = y_pred_arr[hr_mask]
        sim_time = np.where(pred_hr == 1,
                            np.minimum(df_hr["resolution_time_minutes"].values, early_res_minutes),
                            df_hr["resolution_time_minutes"].values)
        return float(np.sum(sim_time <= early_res_minutes) / len(df_hr))

    # Baseline
    bl_preds = []
    for _, row in df_test.iterrows():
        sc = baseline_score(row["medicine_risk"], row["waiting_time_minutes"],
                            row["department"], row["clarification_type"])["score"]
        bl_preds.append(1 if sc >= priority_threshold else 0)
    bl_preds = np.array(bl_preds)
    bl_err = early_res_rate(df_test, bl_preds)
    bl_cm = confusion_matrix(y_test, bl_preds)

    results = {
        "baseline": {
            "name": "Rule-Based Baseline",
            "accuracy": float(accuracy_score(y_test, bl_preds)),
            "precision": float(precision_score(y_test, bl_preds, zero_division=0)),
            "recall": float(recall_score(y_test, bl_preds, zero_division=0)),
            "f1": float(f1_score(y_test, bl_preds, zero_division=0)),
            "tn": int(bl_cm[0][0]), "fp": int(bl_cm[0][1]),
            "fn": int(bl_cm[1][0]), "tp": int(bl_cm[1][1]),
            "high_risk_early_res_rate": bl_err,
            "roc_auc": None
        }
    }

    ml_models = {
        "logistic_regression": LogisticRegression(class_weight="balanced", random_state=random_seed, max_iter=1000),
        "random_forest": RandomForestClassifier(class_weight="balanced", random_state=random_seed, n_estimators=100),
        "gradient_boosting": GradientBoostingClassifier(random_state=random_seed, n_estimators=100)
    }

    best_f1 = -1
    best_model_name = "baseline"
    best_pipeline = None

    for name, model_obj in ml_models.items():
        pipe = Pipeline([("preprocessor", preprocessor), ("classifier", model_obj)])
        pipe.fit(X_train, y_train)
        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test)[:, 1]
        cm = confusion_matrix(y_test, y_pred)
        err = early_res_rate(df_test, y_pred)
        f1 = float(f1_score(y_test, y_pred, zero_division=0))

        results[name] = {
            "name": name.replace("_", " ").title(),
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, zero_division=0)),
            "f1": f1,
            "roc_auc": float(roc_auc_score(y_test, y_prob)),
            "tn": int(cm[0][0]), "fp": int(cm[0][1]),
            "fn": int(cm[1][0]), "tp": int(cm[1][1]),
            "high_risk_early_res_rate": err
        }
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_pipeline = pipe

    if best_pipeline:
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(best_pipeline, BEST_MODEL_PATH)

    # Find FP and FN examples from best ML model
    best_preds = None
    if best_model_name in ml_models:
        best_preds = best_pipeline.predict(X_test)

    fp_examples = []
    fn_examples = []
    if best_preds is not None:
        df_test_copy = df_test.copy()
        df_test_copy["y_true"] = y_test.values
        df_test_copy["y_pred"] = best_preds
        fps = df_test_copy[(df_test_copy["y_pred"] == 1) & (df_test_copy["y_true"] == 0)].head(3)
        fns = df_test_copy[(df_test_copy["y_pred"] == 0) & (df_test_copy["y_true"] == 1)].head(3)
        for _, row in fps.iterrows():
            fp_examples.append({
                "clarification_id": row["clarification_id"],
                "predicted": "HIGH", "actual": "NORMAL",
                "department": row["department"], "medicine_risk": row["medicine_risk"],
                "waiting_time_minutes": int(row["waiting_time_minutes"]),
                "clarification_type": row["clarification_type"],
                "reason": f"Waiting time of {int(row['waiting_time_minutes'])} minutes and department factors caused over-prioritisation of a {row['medicine_risk'].lower()}-risk {row['department'].lower()} clarification.",
                "lesson": "Waiting time can dominate the priority signal for lower-risk cases."
            })
        for _, row in fns.iterrows():
            fn_examples.append({
                "clarification_id": row["clarification_id"],
                "predicted": "NORMAL", "actual": "HIGH",
                "department": row["department"], "medicine_risk": row["medicine_risk"],
                "waiting_time_minutes": int(row["waiting_time_minutes"]),
                "clarification_type": row["clarification_type"],
                "reason": f"Despite {row['medicine_risk'].lower()} medicine risk, the short waiting time ({int(row['waiting_time_minutes'])} min) reduced the overall score below the threshold.",
                "lesson": "Medicine risk must not be overshadowed by a short waiting time."
            })

    best_model_rate = results.get(best_model_name, {}).get("high_risk_early_res_rate", bl_err)

    return {
        "dataset_size": dataset_size,
        "random_seed": random_seed,
        "priority_threshold": priority_threshold,
        "target_early_res_rate": target_res_rate,
        "best_model": best_model_name,
        "best_model_display": best_model_name.replace("_", " ").title(),
        "baseline_early_res_rate": bl_err,
        "model_early_res_rate": best_model_rate,
        "improvement_pp": round((best_model_rate - bl_err) * 100, 2),
        "metrics": results,
        "fp_examples": fp_examples,
        "fn_examples": fn_examples
    }
