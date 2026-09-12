import re


STOP_WORDS = {
    "about",
    "after",
    "again",
    "against",
    "also",
    "appropriate",
    "because",
    "before",
    "being",
    "between",
    "could",
    "from",
    "have",
    "into",
    "must",
    "only",
    "other",
    "should",
    "such",
    "than",
    "that",
    "their",
    "there",
    "these",
    "they",
    "this",
    "those",
    "using",
    "with",
    "without",
}


GENERIC_WORDS = {
    "data",
    "information",
    "document",
    "documents",
    "system",
    "systems",
    "organization",
    "organizations",
    "process",
    "processes",
    "user",
    "users",
}


def extract_meaningful_words(text):
    """
    Extract meaningful words from a piece of text.
    """

    words = re.findall(
        r"\b[a-zA-Z]{4,}\b",
        text.lower()
    )

    meaningful_words = []

    for word in words:

        if word in STOP_WORDS:
            continue

        if word in GENERIC_WORDS:
            continue

        meaningful_words.append(word)

    return list(dict.fromkeys(meaningful_words))


def normalize_text(text):
    """
    Normalize text for phrase comparison.
    """

    text = text.lower()

    text = re.sub(
        r"[^a-zA-Z0-9\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def generate_remediation_recommendation(
    requirement_title,
    category,
    severity
):
    """
    Generate a remediation recommendation for a
    missing compliance requirement.
    """

    category_recommendations = {
        "data_privacy": (
            "Implement documented controls for protecting "
            "sensitive and personal data, including access "
            "restrictions, data handling procedures, and "
            "privacy controls."
        ),
        "security": (
            "Implement appropriate security controls such as "
            "access control, authentication, encryption, and "
            "security monitoring."
        ),
        "audit": (
            "Establish documented audit procedures and maintain "
            "audit trails that provide evidence of compliance "
            "activities and reviews."
        ),
        "risk_management": (
            "Perform and document regular risk assessments, "
            "identify relevant threats, and establish controls "
            "to reduce identified risks."
        ),
        "regulatory": (
            "Document the applicable regulatory requirements "
            "and establish procedures and controls to demonstrate "
            "ongoing compliance."
        ),
        "policies": (
            "Create and maintain documented policies and "
            "procedures that clearly define the required "
            "compliance practices."
        )
    }

    recommendation = category_recommendations.get(
        category,
        (
            "Review this requirement and implement documented "
            "controls that provide clear evidence of compliance."
        )
    )

    if severity.lower() == "critical":
        recommendation = (
            "Priority action required. "
            + recommendation
        )

    elif severity.lower() == "high":
        recommendation = (
            "High-priority action recommended. "
            + recommendation
        )

    return recommendation


def check_requirement_against_document(
    document_text: str,
    requirement_title: str,
    requirement_description: str
):
    """
    Check whether a compliance requirement appears
    to be addressed in the document text.

    Strong evidence:
    1. Exact requirement title appears in the document.
    2. At least two meaningful requirement terms
       appear in the document.
    """

    if not document_text:
        return {
            "status": "missing",
            "explanation": "No document text is available for analysis."
        }

    normalized_document = normalize_text(
        document_text
    )

    normalized_title = normalize_text(
        requirement_title
    )

    if normalized_title in normalized_document:

        return {
            "status": "matched",
            "explanation": (
                "The document contains the requirement title "
                "directly, providing strong evidence that the "
                "requirement is addressed."
            )
        }

    requirement_text = (
        requirement_title + " " + requirement_description
    )

    requirement_words = extract_meaningful_words(
        requirement_text
    )

    matched_words = []

    for word in requirement_words:

        if word in normalized_document.split():
            matched_words.append(word)

    matched_words = list(
        dict.fromkeys(matched_words)
    )

    if len(matched_words) >= 2:

        return {
            "status": "matched",
            "explanation": (
                "The document appears to address this "
                "requirement based on multiple meaningful "
                "compliance terms. "
                f"Matched terms: {', '.join(matched_words)}."
            )
        }

    if len(matched_words) == 1:

        return {
            "status": "missing",
            "explanation": (
                "Only one meaningful term was found in the "
                "document, which is not sufficient evidence "
                "to consider this requirement compliant. "
                f"Matched term: {matched_words[0]}."
            )
        }

    return {
        "status": "missing",
        "explanation": (
            "No sufficient evidence for this compliance "
            "requirement was found in the document."
        )
    }


def detect_compliance_gaps(document_text, requirements):
    """
    Compare a document against all compliance requirements
    and identify matched and missing requirements.
    """

    results = []

    for requirement in requirements:

        result = check_requirement_against_document(
            document_text=document_text,
            requirement_title=requirement.title,
            requirement_description=requirement.description
        )

        recommendation = None

        if result["status"] == "missing":
            recommendation = generate_remediation_recommendation(
                requirement_title=requirement.title,
                category=requirement.category,
                severity=requirement.severity
            )

        results.append({
            "requirement_id": requirement.id,
            "title": requirement.title,
            "category": requirement.category,
            "severity": requirement.severity,
            "status": result["status"],
            "explanation": result["explanation"],
            "recommendation": recommendation
        })

    return results