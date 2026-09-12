# ==========================================================
# REGUAI - COMPLIANCE RISK SERVICE
# ==========================================================

"""
Service responsible for calculating compliance risk.

Risk is calculated using:

    1. Requirement severity
    2. Compliance result status

Severity determines the base risk.

Status determines how much of that risk remains:

    matched -> 0%
    review  -> 50%
    missing -> 100%

The service is intentionally independent from the API layer
so it can be reused by compliance checks, dashboards,
reports, and future AI risk-analysis features.
"""


# ==========================================================
# RISK CONFIGURATION
# ==========================================================

SEVERITY_RISK_WEIGHTS = {
    "low": 25,
    "medium": 50,
    "high": 75,
    "critical": 100,
}


STATUS_RISK_MULTIPLIERS = {
    "matched": 0.0,
    "review": 0.5,
    "missing": 1.0,
}


# ==========================================================
# RISK LEVEL THRESHOLDS
# ==========================================================

def get_risk_level(risk_score: float) -> str:
    """
    Convert a numerical risk score into a readable risk level.
    """

    if risk_score >= 75:
        return "critical"

    if risk_score >= 50:
        return "high"

    if risk_score >= 25:
        return "medium"

    if risk_score > 0:
        return "low"

    return "minimal"


# ==========================================================
# NORMALIZATION HELPERS
# ==========================================================

def normalize_severity(severity: str) -> str:
    """
    Normalize requirement severity.
    """

    if not severity:
        return "medium"

    normalized = severity.strip().lower()

    if normalized not in SEVERITY_RISK_WEIGHTS:
        raise ValueError(
            f"Invalid severity: {severity}"
        )

    return normalized


def normalize_status(status: str) -> str:
    """
    Normalize compliance result status.
    """

    if not status:
        return "missing"

    normalized = status.strip().lower()

    if normalized not in STATUS_RISK_MULTIPLIERS:
        raise ValueError(
            f"Invalid compliance status: {status}"
        )

    return normalized


# ==========================================================
# SINGLE REQUIREMENT RISK
# ==========================================================

def calculate_requirement_risk(
    severity: str,
    status: str
) -> dict:
    """
    Calculate risk for one compliance requirement.
    """

    normalized_severity = normalize_severity(
        severity
    )

    normalized_status = normalize_status(
        status
    )

    base_risk = SEVERITY_RISK_WEIGHTS[
        normalized_severity
    ]

    multiplier = STATUS_RISK_MULTIPLIERS[
        normalized_status
    ]

    risk_score = round(
        base_risk * multiplier,
        2
    )

    risk_level = get_risk_level(
        risk_score
    )

    return {
        "severity": normalized_severity,
        "status": normalized_status,
        "base_risk": base_risk,
        "risk_score": risk_score,
        "risk_level": risk_level,
    }


# ==========================================================
# MULTIPLE REQUIREMENT RISKS
# ==========================================================

def calculate_compliance_risks(
    requirements: list[dict]
) -> dict:
    """
    Calculate risk across multiple compliance results.

    Each requirement dictionary should contain:

        requirement_id
        title
        severity
        status

    The result contains individual risks and
    aggregate risk information.
    """

    if not requirements:
        return {
            "total_requirements": 0,
            "total_risk": 0,
            "average_risk": 0,
            "highest_risk": 0,
            "overall_risk_level": "minimal",
            "risks": [],
        }

    risks = []

    for requirement in requirements:

        risk = calculate_requirement_risk(
            severity=requirement.get(
                "severity",
                "medium"
            ),
            status=requirement.get(
                "status",
                "missing"
            ),
        )

        risk_record = {
            "requirement_id": requirement.get(
                "requirement_id"
            ),
            "title": requirement.get(
                "title",
                "Unknown Requirement"
            ),
            **risk,
        }

        risks.append(
            risk_record
        )

    total_risk = round(
        sum(
            risk["risk_score"]
            for risk in risks
        ),
        2
    )

    average_risk = round(
        total_risk / len(risks),
        2
    )

    highest_risk = max(
        risk["risk_score"]
        for risk in risks
    )

    overall_risk_level = get_risk_level(
        highest_risk
    )

    risks.sort(
        key=lambda item: item["risk_score"],
        reverse=True
    )

    return {
        "total_requirements": len(risks),
        "total_risk": total_risk,
        "average_risk": average_risk,
        "highest_risk": highest_risk,
        "overall_risk_level": overall_risk_level,
        "risks": risks,
    }


# ==========================================================
# PRIORITY SORTING
# ==========================================================

def prioritize_compliance_risks(
    requirements: list[dict]
) -> list[dict]:
    """
    Return compliance requirements ordered from
    highest risk to lowest risk.
    """

    result = calculate_compliance_risks(
        requirements
    )

    return result["risks"]