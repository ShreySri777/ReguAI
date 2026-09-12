from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    """
    Response schema for a stored document.
    """

    id: int
    filename: str
    file_type: str
    file_path: str
    uploaded_at: str
    status: str
    extracted_text: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


class DocumentUploadResponse(BaseModel):
    """
    Response returned after uploading a document.
    """

    message: str
    document: DocumentResponse