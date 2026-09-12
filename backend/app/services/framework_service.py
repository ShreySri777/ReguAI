# ==========================================================
# REGUAI - FRAMEWORK SERVICE
# ==========================================================

from sqlalchemy.orm import Session

from app.models.compliance_requirement import (
    ComplianceRequirement
)


# ==========================================================
# GET AVAILABLE FRAMEWORKS
# ==========================================================

def get_available_frameworks(
    db: Session
) -> list[str]:
    """
    Return all unique regulatory frameworks currently
    available in the compliance requirements database.
    """

    framework_rows = (
        db.query(
            ComplianceRequirement.framework
        )
        .distinct()
        .order_by(
            ComplianceRequirement.framework.asc()
        )
        .all()
    )

    frameworks = []

    for row in framework_rows:

        framework = row[0]

        if framework:

            frameworks.append(
                framework
            )

    return frameworks