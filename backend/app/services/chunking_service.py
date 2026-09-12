# ==========================================================
# REGUAI - DOCUMENT CHUNKING SERVICE
# ==========================================================

"""
Service responsible for splitting extracted document text
into smaller overlapping chunks.

These chunks will later be used for:

1. Embedding generation
2. Vector database storage
3. Semantic search
4. RAG-based compliance evidence retrieval
"""


# ==========================================================
# DEFAULT CHUNK SETTINGS
# ==========================================================

DEFAULT_CHUNK_SIZE = 500

DEFAULT_CHUNK_OVERLAP = 100


# ==========================================================
# CLEAN TEXT
# ==========================================================

def clean_text(text: str) -> str:
    """
    Clean extracted document text before chunking.

    Removes unnecessary whitespace while preserving
    meaningful paragraph and sentence content.
    """

    if not text:
        return ""

    lines = []

    for line in text.splitlines():

        cleaned_line = " ".join(
            line.strip().split()
        )

        if cleaned_line:

            lines.append(
                cleaned_line
            )

    return "\n".join(lines)


# ==========================================================
# CHUNK DOCUMENT TEXT
# ==========================================================

def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
) -> list[str]:
    """
    Split document text into overlapping word-based chunks.

    Parameters
    ----------
    text:
        Extracted document text.

    chunk_size:
        Maximum number of words in each chunk.

    chunk_overlap:
        Number of words shared between consecutive chunks.

    Returns
    -------
    list[str]
        A list containing the generated text chunks.
    """

    if not text:

        return []

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


    cleaned_text = clean_text(
        text
    )


    if not cleaned_text:

        return []


    words = cleaned_text.split()


    chunks = []


    start = 0


    while start < len(words):

        end = min(
            start + chunk_size,
            len(words)
        )


        chunk_words = words[
            start:end
        ]


        chunk = " ".join(
            chunk_words
        ).strip()


        if chunk:

            chunks.append(
                chunk
            )


        if end >= len(words):

            break


        start = (
            end -
            chunk_overlap
        )


    return chunks


# ==========================================================
# CHUNK DOCUMENT WITH METADATA
# ==========================================================

def create_document_chunks(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
) -> list[dict]:
    """
    Create document chunks along with basic metadata.

    This structure will later make it easier to store
    chunks inside a vector database.
    """

    chunks = chunk_text(
        text=text,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )


    document_chunks = []


    for index, chunk in enumerate(
        chunks
    ):

        document_chunks.append({

            "chunk_index": index,

            "text": chunk,

            "word_count": len(
                chunk.split()
            )

        })


    return document_chunks


# ==========================================================
# GET CHUNKING SUMMARY
# ==========================================================

def get_chunking_summary(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
) -> dict:
    """
    Return useful information about the chunking process.
    """

    chunks = create_document_chunks(
        text=text,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )


    total_words = len(
        clean_text(text).split()
    )


    return {

        "total_words": total_words,

        "total_chunks": len(
            chunks
        ),

        "chunk_size": chunk_size,

        "chunk_overlap": chunk_overlap,

        "chunks": chunks

    }