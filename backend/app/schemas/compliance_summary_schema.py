from pydantic import BaseModel


class ComplianceSummaryResponse(BaseModel):
    document_id: int
    document_filename: str
    score: float
    total_requirements: int
    matched_requirements: int
    missing_requirements: int
    overall_status: str