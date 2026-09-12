# ==========================================================
# REGUAI - LOCAL EMBEDDING SERVICE
# ==========================================================

"""
Service responsible for generating text embeddings locally.

Model:
    sentence-transformers/all-MiniLM-L6-v2

Implementation:
    Hugging Face Transformers + PyTorch

The model runs locally after the initial model download.

No API key or paid API is required.
"""

import torch
from transformers import AutoTokenizer
from transformers.models.bert.modeling_bert import BertModel


# ----------------------------------------------------------
# MODEL CONFIGURATION
# ----------------------------------------------------------

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# ----------------------------------------------------------
# MODEL INSTANCES
# ----------------------------------------------------------

_tokenizer = None
_model = None


def get_embedding_model():
    """
    Load the MiniLM model only when required.

    The model remains in memory after the first load so that
    it does not need to be loaded again for every request.
    """

    global _model

    if _model is None:
        _model = BertModel.from_pretrained(
            MODEL_NAME
        )

        _model.eval()

    return _model


def get_tokenizer():
    """
    Load the tokenizer only when required.
    """

    global _tokenizer

    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME
        )

    return _tokenizer


# ----------------------------------------------------------
# MEAN POOLING
# ----------------------------------------------------------

def mean_pooling(
    model_output,
    attention_mask
):
    """
    Perform attention-mask-aware mean pooling.

    This converts the token-level transformer output
    into a single sentence/document embedding.
    """

    token_embeddings = model_output.last_hidden_state

    input_mask_expanded = (
        attention_mask
        .unsqueeze(-1)
        .expand(token_embeddings.size())
        .float()
    )

    sum_embeddings = torch.sum(
        token_embeddings * input_mask_expanded,
        dim=1
    )

    sum_mask = torch.clamp(
        input_mask_expanded.sum(dim=1),
        min=1e-9
    )

    return sum_embeddings / sum_mask


# ----------------------------------------------------------
# SINGLE TEXT EMBEDDING
# ----------------------------------------------------------

def generate_embedding(
    text: str
) -> list[float]:
    """
    Generate a normalized embedding for a single text.

    Parameters
    ----------
    text:
        Text that should be converted into an embedding.

    Returns
    -------
    list[float]
        The generated 384-dimensional embedding vector.
    """

    if not text or not text.strip():
        raise ValueError(
            "Text cannot be empty."
        )

    tokenizer = get_tokenizer()
    model = get_embedding_model()

    encoded_input = tokenizer(
        text.strip(),
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    with torch.no_grad():
        model_output = model(
            **encoded_input
        )

    embedding = mean_pooling(
        model_output,
        encoded_input["attention_mask"]
    )

    embedding = torch.nn.functional.normalize(
        embedding,
        p=2,
        dim=1
    )

    return embedding[0].tolist()


# ----------------------------------------------------------
# MULTIPLE TEXT EMBEDDINGS
# ----------------------------------------------------------

def generate_embeddings(
    texts: list[str]
) -> list[list[float]]:
    """
    Generate normalized embeddings for multiple text strings.

    Parameters
    ----------
    texts:
        List of text strings.

    Returns
    -------
    list[list[float]]
        List of 384-dimensional embedding vectors.
    """

    if not texts:
        return []

    cleaned_texts = [
        text.strip()
        for text in texts
        if text and text.strip()
    ]

    if not cleaned_texts:
        return []

    tokenizer = get_tokenizer()
    model = get_embedding_model()

    encoded_input = tokenizer(
        cleaned_texts,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    with torch.no_grad():
        model_output = model(
            **encoded_input
        )

    embeddings = mean_pooling(
        model_output,
        encoded_input["attention_mask"]
    )

    embeddings = torch.nn.functional.normalize(
        embeddings,
        p=2,
        dim=1
    )

    return embeddings.tolist()


# ----------------------------------------------------------
# EMBED DOCUMENT CHUNKS
# ----------------------------------------------------------

def embed_document_chunks(
    chunks: list[dict]
) -> list[dict]:
    """
    Generate embeddings for document chunks.

    Expected chunk format:

        {
            "chunk_index": 0,
            "text": "...",
            "word_count": 100
        }

    Returned format:

        {
            "chunk_index": 0,
            "text": "...",
            "word_count": 100,
            "embedding": [...]
        }
    """

    if not chunks:
        return []

    valid_chunks = [
        chunk
        for chunk in chunks
        if chunk.get("text")
        and chunk["text"].strip()
    ]

    if not valid_chunks:
        return []

    texts = [
        chunk["text"]
        for chunk in valid_chunks
    ]

    embeddings = generate_embeddings(
        texts
    )

    embedded_chunks = []

    for index, chunk in enumerate(
        valid_chunks
    ):
        embedded_chunk = {
            **chunk,
            "embedding": embeddings[index]
        }

        embedded_chunks.append(
            embedded_chunk
        )

    return embedded_chunks


# ----------------------------------------------------------
# EMBED DOCUMENT TEXT
# ----------------------------------------------------------

def embed_document_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100
) -> list[dict]:
    """
    Split document text into chunks and generate an
    embedding for every chunk.

    Pipeline:

        Document Text
              ↓
        Text Cleaning
              ↓
        Chunking
              ↓
        Tokenization
              ↓
        MiniLM Transformer
              ↓
        Mean Pooling
              ↓
        Normalization
              ↓
        Embedded Chunks
    """

    if not text or not text.strip():
        return []

    from app.services.chunking_service import (
        create_document_chunks
    )

    chunks = create_document_chunks(
        text=text,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    return embed_document_chunks(
        chunks
    )


# ----------------------------------------------------------
# EMBEDDING DIMENSION
# ----------------------------------------------------------

def get_embedding_dimension() -> int:
    """
    Return the dimensionality of the embedding model.
    """

    model = get_embedding_model()

    return model.config.hidden_size


# ----------------------------------------------------------
# EMBEDDING SERVICE STATUS
# ----------------------------------------------------------

def get_embedding_service_info() -> dict:
    """
    Return basic information about the local embedding
    service.
    """

    return {
        "model": MODEL_NAME,
        "provider": "Hugging Face Transformers + PyTorch",
        "local": True,
        "dimension": get_embedding_dimension()
    }