# ==========================================================
# REGUAI - COMPLIANCE EVIDENCE MODEL
# ==========================================================

"""
Database model for storing evidence retrieved during
compliance analysis.

Each record represents one piece of document evidence
associated with a specific compliance requirement.

Each compliance check receives a unique check_run_id.
This allows multiple compliance checks on the same document
to be grouped together while preserving historical evidence.

This allows ReguAI to maintain an auditable history of:

- Which document was analyzed
- Which compliance check run produced the evidence
- Which requirement was evaluated
- What evidence was retrieved
- How strongly the evidence matched
- What decision was made
- When the evidence was generated
"""

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text
)

from app.database.database import Base


class ComplianceEvidence(Base):

    __tablename__ = "compliance_evidence"

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

    requirement_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    evidence_number = Column(
        Integer,
        nullable=False
    )

    evidence_text = Column(
        Text,
        nullable=False
    )

    similarity_score = Column(
        Float,
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

    created_at = Column(
        String,
        nullable=False
    )