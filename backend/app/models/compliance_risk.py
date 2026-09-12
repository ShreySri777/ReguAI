# ==========================================================
# REGUAI - COMPLIANCE RISK MODEL
# ==========================================================

"""
Database model for storing compliance risk assessments.

Each record represents the risk calculated for one
requirement during one compliance check run.

The check_run_id allows multiple compliance checks for
the same document to be stored independently.

The framework field identifies which regulatory framework
was used during the compliance check.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Index
)

from app.database.database import Base


class ComplianceRisk(Base):
    """
    Stores risk information for a compliance requirement
    during a specific compliance check.
    """

    __tablename__ = "compliance_risks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    document_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    check_run_id = Column(
        String,
        nullable=False,
        index=True
    )

    framework = Column(
        String,
        nullable=True,
        index=True
    )

    requirement_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    severity = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        nullable=False
    )

    base_risk = Column(
        Float,
        nullable=False
    )

    risk_score = Column(
        Float,
        nullable=False
    )

    risk_level = Column(
        String,
        nullable=False
    )

    created_at = Column(
        String,
        nullable=False
    )


# ==========================================================
# INDEXES
# ==========================================================

Index(
    "ix_compliance_risks_document_run",
    ComplianceRisk.document_id,
    ComplianceRisk.check_run_id
)

Index(
    "ix_compliance_risks_requirement_run",
    ComplianceRisk.requirement_id,
    ComplianceRisk.check_run_id
)

Index(
    "ix_compliance_risks_document_framework",
    ComplianceRisk.document_id,
    ComplianceRisk.framework
)