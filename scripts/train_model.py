import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

DATA_PATH = os.path.join("data", "synthetic", "clarifications.csv")
MODELS_DIR = "models"
EXPERIMENT_RESULTS_PATH = os.path.join(MODELS_DIR, "experiment_results.json")

def load_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Data file {DATA_PATH} not found. Run generate_synthetic_data.py first.")
    return pd.read_csv(DATA_PATH)

def prepare_features(df):
    # Features available at the time of creation (no data leakage)
    features = [
        "department", "medicine_category", "medicine_risk", 
        "waiting_time_minutes", "clarification_type", "urgency"
    ]
    target = "priority_label"
    
    X = df[features]
    y = df[target]
    
    # Identify categorical and numeric columns
    categorical_cols = ["department", "medicine_category", "medicine_risk", "clarification_type", "urgency"]
    numeric_cols = ["waiting_time_minutes"]
    
    # Create preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
        ]
    )
    
    return X, y, preprocessor

def evaluate_model(model, X_test, y_test, df_test):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Calculate basic metrics
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob))
    }
    
    cm = confusion_matrix(y_test, y_pred)
    metrics["tn"] = int(cm[0][0])
    metrics["fp"] = int(cm[0][1])
    metrics["fn"] = int(cm[1][0])
    metrics["tp"] = int(cm[1][1])
    
    # Calculate High-Risk Early Resolution Rate
    # Filter for high-risk medicine cases in the test set
    high_risk_idx = df_test['medicine_risk'] == 'High'
    df_high_risk = df_test[high_risk_idx].copy()
    y_pred_hr = y_pred[high_risk_idx]
    
    total_hr = len(df_high_risk)
    
    if total_hr > 0:
        df_high_risk['predicted_priority'] = y_pred_hr
        # We simulate that if predicted as high priority (1), they are resolved in <= 60 mins
        # If predicted as normal priority (0), they take their original resolution time
        simulated_res_time = np.where(
            df_high_risk['predicted_priority'] == 1,
            np.minimum(df_high_risk['resolution_time_minutes'], 60), 
            df_high_risk['resolution_time_minutes']
        )
        early_resolved = np.sum(simulated_res_time <= 60)
        metrics["high_risk_early_res_rate"] = float(early_resolved / total_hr)
    else:
        metrics["high_risk_early_res_rate"] = 0.0
        
    return metrics

def calculate_baseline(df_test):
    # Rule-based baseline: If High Risk or Waiting > 60 mins or OR
    predictions = []
    for _, row in df_test.iterrows():
        if row['medicine_risk'] == 'High' or row['waiting_time_minutes'] > 60 or row['department'] == 'Operating Room':
            predictions.append(1)
        else:
            predictions.append(0)
    
    y_test = df_test['priority_label']
    y_pred = np.array(predictions)
    
    # Calculate basic metrics
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0))
    }
    
    cm = confusion_matrix(y_test, y_pred)
    metrics["tn"] = int(cm[0][0])
    metrics["fp"] = int(cm[0][1])
    metrics["fn"] = int(cm[1][0])
    metrics["tp"] = int(cm[1][1])
    
    # Calculate High-Risk Early Resolution Rate
    high_risk_idx = df_test['medicine_risk'] == 'High'
    df_high_risk = df_test[high_risk_idx].copy()
    y_pred_hr = y_pred[high_risk_idx]
    
    total_hr = len(df_high_risk)
    if total_hr > 0:
        simulated_res_time = np.where(
            y_pred_hr == 1,
            np.minimum(df_high_risk['resolution_time_minutes'], 60), 
            df_high_risk['resolution_time_minutes']
        )
        early_resolved = np.sum(simulated_res_time <= 60)
        metrics["high_risk_early_res_rate"] = float(early_resolved / total_hr)
    else:
        metrics["high_risk_early_res_rate"] = 0.0
        
    return metrics

def train_and_evaluate():
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    print("Loading data...")
    df = load_data()
    X, y, preprocessor = prepare_features(df)
    
    # We pass indices to train_test_split so we can track the original test dataframe
    indices = np.arange(len(df))
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, indices, test_size=0.2, random_state=42, stratify=y
    )
    
    df_test = df.iloc[idx_test].copy()
    
    results = {}
    
    print("Evaluating Baseline...")
    results["baseline"] = calculate_baseline(df_test)
    
    models = {
        "logistic_regression": LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000),
        "random_forest": RandomForestClassifier(class_weight='balanced', random_state=42, n_estimators=100),
        "gradient_boosting": GradientBoostingClassifier(random_state=42, n_estimators=100)
    }
    
    best_f1 = 0
    best_model_name = ""
    best_pipeline = None
    
    for name, model in models.items():
        print(f"Training {name}...")
        pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', model)])
        pipeline.fit(X_train, y_train)
        
        metrics = evaluate_model(pipeline, X_test, y_test, df_test)
        results[name] = metrics
        
        print(f"  Accuracy: {metrics['accuracy']:.4f}, Recall: {metrics['recall']:.4f}, F1: {metrics['f1']:.4f}")
        
        if metrics['f1'] > best_f1:
            best_f1 = metrics['f1']
            best_model_name = name
            best_pipeline = pipeline

    print(f"\nBest Model: {best_model_name} with F1: {best_f1:.4f}")
    
    # Save the best model
    model_path = os.path.join(MODELS_DIR, "best_model.pkl")
    joblib.dump(best_pipeline, model_path)
    print(f"Saved best model to {model_path}")
    
    # Save results for API
    import json
    with open(EXPERIMENT_RESULTS_PATH, "w") as f:
        json.dump({
            "target_high_risk_res_rate": 0.80, # Requirement
            "best_model": best_model_name,
            "metrics": results
        }, f, indent=4)
        
    print(f"Saved experiment results to {EXPERIMENT_RESULTS_PATH}")

if __name__ == "__main__":
    train_and_evaluate()
