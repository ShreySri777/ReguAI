from sqlalchemy import Column, Integer, String, Text

from app.database.database import Base


class AuditReport(Base):

    __tablename__ = "audit_reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    document_id = Column(
        Integer,
        nullable=False
    )

    report_title = Column(
        String,
        nullable=False
    )

    framework = Column(
        String,
        nullable=False,
        default="Custom"
    )

    generated_at = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        nullable=False
    )

    report_content = Column(
        Text,
        nullable=True
    )