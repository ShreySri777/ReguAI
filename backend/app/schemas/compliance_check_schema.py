from pydantic import BaseModel

from typing import List

from app.schemas.compliance_summary_schema import (
    ComplianceSummaryResponse
)


# ==========================================================
# RISK RESPONSE
# ==========================================================

class ComplianceRiskResponse(BaseModel):
    requirement_id: int
    title: str
    severity: str
    status: str
    base_risk: float
    risk_score: float
    risk_level: str


# ==========================================================
# RISK SUMMARY RESPONSE
# ==========================================================

class ComplianceRiskSummaryResponse(BaseModel):
    total_requirements: int
    total_risk: float
    average_risk: float
    highest_risk: float
    overall_risk_level: str
    risks: List[
        ComplianceRiskResponse
    ]


# ==========================================================
# EVIDENCE RESPONSE
# ==========================================================

class ComplianceEvidenceResponse(BaseModel):
    evidence_number: int
    text: str
    similarity_score: float


# ==========================================================
# STORED EVIDENCE RESPONSE
# ==========================================================

class StoredComplianceEvidenceResponse(BaseModel):
    id: int
    document_id: int
    requirement_id: int
    check_run_id: str
    evidence_number: int
    evidence_text: str
    similarity_score: float
    status: str
    explanation: str
    created_at: str


# ==========================================================
# EVIDENCE HISTORY RESPONSE
# ==========================================================

class ComplianceEvidenceHistoryResponse(BaseModel):
    document_id: int
    total_evidence: int
    evidence: List[
        StoredComplianceEvidenceResponse
    ]


# ==========================================================
# COMPLIANCE CHECK RESULT
# ==========================================================

class ComplianceCheckResult(BaseModel):
    requirement_id: int
    title: str
    category: str
    severity: str
    status: str
    explanation: str
    evidence: List[
        ComplianceEvidenceResponse
    ]


# ==========================================================
# COMPLIANCE CHECK RESPONSE
# ==========================================================

class ComplianceCheckResponse(BaseModel):
    document_id: int
    filename: str
    framework: str

    score: float

    total_requirements: int
    matched_requirements: int
    missing_requirements: int

    results: List[
        ComplianceCheckResult
    ]

    risk: ComplianceRiskSummaryResponse


# ==========================================================
# COMPLIANCE GAP RESPONSE
# ==========================================================

class ComplianceGapResponse(BaseModel):
    id: int
    document_id: int
    requirement_id: int
    status: str
    explanation: str


# ==========================================================
# COMPLIANCE DASHBOARD RESPONSE
# ==========================================================

class ComplianceDashboardResponse(BaseModel):
    total_documents: int
    average_score: float
    fully_compliant_documents: int
    mostly_compliant_documents: int
    partially_compliant_documents: int
    non_compliant_documents: int
    documents: List[
        ComplianceSummaryResponse
    ]