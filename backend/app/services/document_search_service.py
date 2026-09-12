# ==========================================================
# REGUAI - DOCUMENT SEARCH SERVICE
# ==========================================================

"""
Service responsible for performing semantic searches
against documents stored in the ReguAI database.

Pipeline:

    Database Document
          ↓
    Extracted Text
          ↓
    Document Chunks
          ↓
    Local Embeddings
          ↓
    Semantic Search
          ↓
    Relevant Evidence
"""


from sqlalchemy.orm import Session

from app.models.document import Document

from app.services.semantic_search_service import (
    search_document_text
)


# ----------------------------------------------------------
# SEARCH A DOCUMENT
# ----------------------------------------------------------

def search_document(
    db: Session,
    document_id: int,
    query: str,
    top_k: int = 3,
    minimum_score: float = 0.0
) -> dict:
    """
    Perform semantic search against a stored document.

    Parameters
    ----------
    db:
        SQLAlchemy database session.

    document_id:
        ID of the document to search.

    query:
        Compliance requirement or search question.

    top_k:
        Maximum number of evidence chunks to return.

    minimum_score:
        Minimum semantic similarity score.

    Returns
    -------
    dict
        Document information and relevant evidence chunks.
    """

    if not query or not query.strip():

        raise ValueError(
            "Query cannot be empty."
        )


    document = db.query(
        Document
    ).filter(
        Document.id == document_id
    ).first()


    if not document:

        raise ValueError(
            f"Document with ID {document_id} was not found."
        )


    if not document.extracted_text:

        return {

            "document_id": document.id,

            "filename": document.filename,

            "query": query,

            "results": []

        }


    results = search_document_text(
        query=query,
        text=document.extracted_text,
        chunk_size=500,
        chunk_overlap=100,
        top_k=top_k,
        minimum_score=minimum_score
    )


    return {

        "document_id": document.id,

        "filename": document.filename,

        "query": query,

        "results": results

    }


# ----------------------------------------------------------
# SEARCH ALL ANALYZED DOCUMENTS
# ----------------------------------------------------------

def search_all_documents(
    db: Session,
    query: str,
    top_k: int = 5,
    minimum_score: float = 0.0
) -> list[dict]:
    """
    Perform semantic search across all documents that
    contain extracted text.

    Results from all documents are combined and ranked
    by similarity score.
    """

    if not query or not query.strip():

        raise ValueError(
            "Query cannot be empty."
        )


    documents = db.query(
        Document
    ).filter(
        Document.extracted_text.isnot(None)
    ).all()


    all_results = []


    for document in documents:

        if not document.extracted_text:
            continue


        document_results = search_document_text(
            query=query,
            text=document.extracted_text,
            chunk_size=500,
            chunk_overlap=100,
            top_k=top_k,
            minimum_score=minimum_score
        )


        for result in document_results:

            all_results.append({

                "document_id": document.id,

                "filename": document.filename,

                "chunk_index": result[
                    "chunk_index"
                ],

                "text": result[
                    "text"
                ],

                "word_count": result[
                    "word_count"
                ],

                "similarity_score": result[
                    "similarity_score"
                ]

            })


    all_results.sort(
        key=lambda item: item[
            "similarity_score"
        ],
        reverse=True
    )


    return all_results[:top_k]