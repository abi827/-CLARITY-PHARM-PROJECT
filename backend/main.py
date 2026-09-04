from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.connection import init_db, SessionLocal
from .api.endpoints import router as api_router
from .api.auth import router as auth_router
from .api.doctor_endpoints import router as doctor_router
from .database import models
from .services.priority_engine import baseline_score, score_to_priority, build_evidence_text, MEDICINE_RISK_SCORE
import pandas as pd
import os
import random
import json
from datetime import datetime, timedelta

app = FastAPI(title="Clarity-Pharm API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(api_router, prefix="/api")
app.include_router(doctor_router, prefix="/api")


@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        # We no longer seed global data here. Seeding is done per-user on signup.
        pass
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Clarity-Pharm API v1.0 — running"}
