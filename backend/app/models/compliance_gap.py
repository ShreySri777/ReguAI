from sqlalchemy import Column, Integer, String, Text

from app.database.database import Base


class ComplianceGap(Base):
    __tablename__ = "compliance_gaps"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    document_id = Column(
        Integer,
        nullable=False
    )

    requirement_id = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String,
        nullable=False
    )

    explanation = Column(
        Text,
        nullable=False
    )

    recommendation = Column(
        Text,
        nullable=True
    )