# ==========================================================
# REGUAI - COMPLIANCE EVIDENCE RETRIEVAL SERVICE
# ==========================================================

"""
Service responsible for retrieving relevant evidence from
a compliance document for a specific compliance requirement.

This service builds on the semantic search functionality
implemented earlier in ReguAI.

The retrieval process uses focused document chunks so that
the embedding model compares a compliance requirement
against smaller, more relevant passages.

Workflow:

1. Receive a compliance requirement.
2. Build a semantic search query from the requirement.
3. Split the document into focused overlapping chunks.
4. Generate local embeddings for the requirement and chunks.
5. Rank the chunks using semantic similarity.
6. Return the most relevant evidence passages.
7. These passages are later used by the RAG pipeline
   to support compliance decisions.
"""


from app.services.semantic_search_service import (
    search_document_text
)


# ==========================================================
# DEFAULT SETTINGS
# ==========================================================

# Smaller chunks provide more focused compliance evidence.
#
# The previous values were:
#
# chunk_size = 500
# chunk_overlap = 100
#
# Large chunks can contain many unrelated sections of a
# document, which can reduce semantic similarity.

DEFAULT_CHUNK_SIZE = 150
DEFAULT_CHUNK_OVERLAP = 30
DEFAULT_TOP_K = 3


# ==========================================================
# BUILD REQUIREMENT QUERY
# ==========================================================

def build_requirement_query(
    title: str,
    description: str = ""
) -> str:
    """
    Build a semantic search query from a compliance
    requirement title and description.
    """

    title = (
        title or ""
    ).strip()

    description = (
        description or ""
    ).strip()


    if not title and not description:

        raise ValueError(
            "Requirement title or description is required."
        )


    if title and description:

        return (
            f"{title}. "
            f"{description}"
        )


    return (
        title or description
    )


# ==========================================================
# RETRIEVE COMPLIANCE EVIDENCE
# ==========================================================

def retrieve_compliance_evidence(
    document_text: str,
    requirement_title: str,
    requirement_description: str = "",
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    top_k: int = DEFAULT_TOP_K
) -> list[dict]:
    """
    Retrieve the most relevant passages from a document
    for a specific compliance requirement.

    Smaller default chunks are intentionally used here
    because compliance evidence is usually contained in
    focused sentences or short paragraphs.
    """

    if not document_text or not document_text.strip():

        return []


    if top_k <= 0:

        raise ValueError(
            "top_k must be greater than 0."
        )


    if chunk_size <= 0:

        raise ValueError(
            "chunk_size must be greater than 0."
        )


    if chunk_overlap < 0:

        raise ValueError(
            "chunk_overlap cannot be negative."
        )


    if chunk_overlap >= chunk_size:

        raise ValueError(
            "chunk_overlap must be smaller than chunk_size."
        )


    query = build_requirement_query(
        title=requirement_title,
        description=requirement_description
    )


    # ======================================================
    # SEMANTIC SEARCH
    # ======================================================
    #
    # search_document_text expects:
    #
    # search_document_text(
    #     query,
    #     document_text,
    #     ...
    # )
    #
    # Therefore the document text is passed as the
    # second positional argument.

    results = search_document_text(
        query,
        document_text,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        top_k=top_k
    )


    # ======================================================
    # FORMAT EVIDENCE
    # ======================================================

    evidence = []


    for result in results:

        evidence.append({

            "text": result["text"],

            "similarity_score": result[
                "similarity_score"
            ]

        })


    return evidence


# ==========================================================
# GET BEST EVIDENCE
# ==========================================================

def get_best_compliance_evidence(
    document_text: str,
    requirement_title: str,
    requirement_description: str = "",
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
) -> dict | None:
    """
    Return the single most relevant evidence passage
    for a compliance requirement.
    """

    evidence = retrieve_compliance_evidence(

        document_text=document_text,

        requirement_title=requirement_title,

        requirement_description=requirement_description,

        chunk_size=chunk_size,

        chunk_overlap=chunk_overlap,

        top_k=1

    )


    if not evidence:

        return None


    return evidence[0]


# ==========================================================
# FORMAT EVIDENCE FOR DISPLAY
# ==========================================================

def format_evidence(
    evidence: list[dict]
) -> list[dict]:
    """
    Format retrieved evidence into a clean structure
    that can later be returned through an API.
    """

    formatted = []


    for index, item in enumerate(
        evidence,
        start=1
    ):

        formatted.append({

            "evidence_number": index,

            "text": item["text"],

            "similarity_score": round(

                float(
                    item["similarity_score"]
                ),

                6

            )

        })


    return formatted