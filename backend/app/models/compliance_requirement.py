# ==========================================================
# REGUAI - COMPLIANCE REQUIREMENT MODEL
# ==========================================================

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text
)

from app.database.database import Base


class ComplianceRequirement(Base):

    __tablename__ = "compliance_requirements"

    # ======================================================
    # PRIMARY KEY
    # ======================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ======================================================
    # REGULATORY FRAMEWORK
    # ======================================================

    framework = Column(
        String,
        nullable=False,
        default="Custom"
    )

    # ======================================================
    # REQUIREMENT TITLE
    # ======================================================

    title = Column(
        String,
        nullable=False
    )

    # ======================================================
    # REQUIREMENT DESCRIPTION
    # ======================================================

    description = Column(
        Text,
        nullable=False
    )

    # ======================================================
    # REQUIREMENT CATEGORY
    # ======================================================

    category = Column(
        String,
        nullable=False
    )

    # ======================================================
    # REQUIREMENT SEVERITY
    # ======================================================

    severity = Column(
        String,
        nullable=False
    )