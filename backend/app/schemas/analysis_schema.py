from pydantic import BaseModel


class AnalysisResponse(BaseModel):
    """
    Response schema for document analysis.
    """

    document_id: int

    filename: str

    analysis: dict