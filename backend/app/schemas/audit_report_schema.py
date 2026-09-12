from pydantic import BaseModel


class AuditReportResponse(BaseModel):

    id: int

    document_id: int

    report_title: str

    framework: str

    generated_at: str

    status: str

    report_content: str | None