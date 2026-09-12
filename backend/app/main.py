# ==========================================================
# REGUAI - APPLICATION ENTRY POINT
# ==========================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# ==========================================================
# API ROUTERS
# ==========================================================

from app.api.documents import router

from app.api.audit_reports import (
    router as audit_report_router
)


# ==========================================================
# DATABASE
# ==========================================================

from app.database.database import (
    Base,
    engine
)


# ==========================================================
# DATABASE MODELS
# ==========================================================

from app.models.document import Document

from app.models.compliance_requirement import (
    ComplianceRequirement
)

from app.models.compliance_gap import (
    ComplianceGap
)

from app.models.audit_report import (
    AuditReport
)

from app.models.compliance_evidence import (
    ComplianceEvidence
)

from app.models.compliance_risk import (
    ComplianceRisk
)


# ==========================================================
# CREATE DATABASE TABLES
# ==========================================================

Base.metadata.create_all(
    bind=engine
)


# ==========================================================
# CREATE FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="ReguAI"
)


# ==========================================================
# CORS CONFIGURATION
# ==========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ==========================================================
# ROOT ENDPOINT
# ==========================================================

@app.get("/")
def root():

    return {
        "message": "ReguAI backend is running!"
    }


# ==========================================================
# REGISTER API ROUTERS
# ==========================================================

app.include_router(
    router
)

app.include_router(
    audit_report_router
)