COMPLIANCE_CATEGORIES = {
    "data_privacy": [
        "privacy",
        "data protection",
        "personal data",
        "gdpr",
        "consent"
    ],
    "security": [
        "security",
        "cybersecurity",
        "access control",
        "authentication",
        "encryption"
    ],
    "audit": [
        "audit",
        "auditing",
        "audit trail",
        "internal audit"
    ],
    "risk_management": [
        "risk",
        "risk assessment",
        "risk management",
        "threat"
    ],
    "regulatory": [
        "regulation",
        "regulatory",
        "compliance",
        "requirement",
        "standard"
    ],
    "policies": [
        "policy",
        "policies",
        "procedure",
        "guideline"
    ]
}


def analyze_document(text: str):
    """
    Analyze extracted document text and identify
    compliance-related keywords and categories.
    """

    if not text or not text.strip():
        return {
            "status": "failed",
            "message": "No document text was provided.",
            "text_length": 0,
            "compliance_keywords_found": [],
            "compliance_categories": [],
            "category_details": {},
            "preview": ""
        }

    cleaned_text = text.strip()
    text_lower = cleaned_text.lower()

    keywords_found = []
    categories_found = []
    category_details = {}

    for category, keywords in COMPLIANCE_CATEGORIES.items():

        matched_keywords = []

        for keyword in keywords:
            if keyword in text_lower:
                keywords_found.append(keyword)
                matched_keywords.append(keyword)

        if matched_keywords:
            categories_found.append(category)
            category_details[category] = matched_keywords

    return {
        "status": "success",
        "message": "Document analyzed successfully.",
        "text_length": len(cleaned_text),
        "compliance_keywords_found": keywords_found,
        "compliance_categories": categories_found,
        "category_details": category_details,
        "preview": cleaned_text[:500]
    }