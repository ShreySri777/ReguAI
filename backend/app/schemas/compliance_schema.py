from pydantic import BaseModel


class ComplianceRequirementResponse(BaseModel):

    id: int

    framework: str

    title: str

    description: str

    category: str

    severity: str