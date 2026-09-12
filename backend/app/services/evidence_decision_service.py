# ==========================================================
# REGUAI - EVIDENCE DECISION SERVICE
# ==========================================================

"""
Service responsible for making an initial compliance decision
from semantically retrieved document evidence.

This is a lightweight local decision layer.

It does NOT use a paid external AI API.

Decision logic:

1. Retrieve relevant evidence.
2. Inspect the best similarity score.
3. Classify the evidence as:
   - matched
   - review
   - missing

The retrieval layer uses focused document chunks so that
compliance decisions are based on more relevant passages.
"""


from app.services.evidence_retrieval_service import (
    retrieve_compliance_evidence,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_TOP_K
)


# ==========================================================
# DECISION THRESHOLDS
# ==========================================================

MATCH_THRESHOLD = 0.70
REVIEW_THRESHOLD = 0.45


# ==========================================================
# CLASSIFY EVIDENCE
# ==========================================================

def classify_evidence(
    similarity_score: float
) -> str:
    """
    Classify evidence based on semantic similarity.

    Returns
    -------
    str
        matched, review, or missing
    """

    if similarity_score >= MATCH_THRESHOLD:

        return "matched"


    if similarity_score >= REVIEW_THRESHOLD:

        return "review"


    return "missing"


# ==========================================================
# BUILD DECISION EXPLANATION
# ==========================================================

def build_decision_explanation(
    status: str,
    best_score: float | None
) -> str:
    """
    Build a human-readable explanation for the
    compliance decision.
    """

    if best_score is None:

        return (
            "No relevant evidence was found in the "
            "document for this requirement."
        )


    score_text = (
        f"{best_score:.3f}"
    )


    if status == "matched":

        return (
            "Relevant evidence was found in the "
            f"document with a semantic similarity score "
            f"of {score_text}."
        )


    if status == "review":

        return (
            "Potentially relevant evidence was found, "
            f"but the similarity score of {score_text} "
            "is not strong enough for an automatic match. "
            "Manual review is recommended."
        )


    return (
        "No sufficiently relevant evidence was found "
        f"for this requirement. The best similarity score "
        f"was {score_text}."
    )


# ==========================================================
# EVALUATE COMPLIANCE REQUIREMENT
# ==========================================================

def evaluate_requirement_evidence(
    document_text: str,
    requirement_title: str,
    requirement_description: str = "",
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    top_k: int = DEFAULT_TOP_K
) -> dict:
    """
    Retrieve and evaluate evidence for one compliance
    requirement.

    The default retrieval configuration comes directly
    from the evidence retrieval service:

        chunk_size = 150
        chunk_overlap = 30
        top_k = 3

    This keeps the decision layer synchronized with
    the focused retrieval layer.
    """

    evidence = retrieve_compliance_evidence(

        document_text=document_text,

        requirement_title=requirement_title,

        requirement_description=requirement_description,

        chunk_size=chunk_size,

        chunk_overlap=chunk_overlap,

        top_k=top_k

    )


    if not evidence:

        return {

            "requirement_title": requirement_title,

            "status": "missing",

            "best_similarity_score": None,

            "explanation": build_decision_explanation(

                status="missing",

                best_score=None

            ),

            "evidence": []

        }


    best_score = max(

        float(item["similarity_score"])

        for item in evidence

    )


    status = classify_evidence(

        best_score

    )


    return {

        "requirement_title": requirement_title,

        "status": status,

        "best_similarity_score": round(

            best_score,

            6

        ),

        "explanation": build_decision_explanation(

            status=status,

            best_score=best_score

        ),

        "evidence": evidence

    }


# ==========================================================
# EVALUATE MULTIPLE REQUIREMENTS
# ==========================================================

def evaluate_document_requirements(
    document_text: str,
    requirements: list[dict],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    top_k: int = DEFAULT_TOP_K
) -> list[dict]:
    """
    Evaluate multiple compliance requirements against
    the same document.

    The retrieval configuration defaults are shared with
    the evidence retrieval service so that the complete
    RAG pipeline consistently uses focused chunks.
    """

    if not document_text or not document_text.strip():

        return []


    results = []


    for requirement in requirements:

        title = (

            requirement.get("title")

            or ""

        ).strip()


        description = (

            requirement.get("description")

            or ""

        ).strip()


        if not title and not description:

            continue


        result = evaluate_requirement_evidence(

            document_text=document_text,

            requirement_title=title,

            requirement_description=description,

            chunk_size=chunk_size,

            chunk_overlap=chunk_overlap,

            top_k=top_k

        )


        result["requirement_id"] = (

            requirement.get("id")

        )


        result["category"] = (

            requirement.get("category")

        )


        result["severity"] = (

            requirement.get("severity")

        )


        results.append(

            result

        )


    return results


# ==========================================================
# GET DECISION SUMMARY
# ==========================================================

def get_decision_summary(
    results: list[dict]
) -> dict:
    """
    Create a summary of evidence-based decisions.
    """

    matched = 0
    review = 0
    missing = 0


    for result in results:

        status = result.get(

            "status"

        )


        if status == "matched":

            matched += 1


        elif status == "review":

            review += 1


        elif status == "missing":

            missing += 1


    total = len(

        results

    )


    return {

        "total_requirements": total,

        "matched": matched,

        "review": review,

        "missing": missing

    }