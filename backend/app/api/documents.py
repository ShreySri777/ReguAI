# ==========================================================
# REGUAI - DOCUMENT API
# ==========================================================

import os

from datetime import datetime

from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    Query
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.document import Document

from app.models.compliance_requirement import (
    ComplianceRequirement
)

from app.models.compliance_gap import (
    ComplianceGap
)

from app.models.compliance_evidence import (
    ComplianceEvidence
)

from app.models.compliance_risk import (
    ComplianceRisk
)

from app.models.framework import (
    Framework
)

from app.schemas.document_schema import (
    DocumentResponse,
    DocumentUploadResponse
)

from app.schemas.analysis_schema import (
    AnalysisResponse
)

from app.schemas.compliance_schema import (
    ComplianceRequirementResponse
)

from app.schemas.framework_schema import (
    FrameworkCreate,
    FrameworkResponse
)

from app.schemas.compliance_check_schema import (
    ComplianceCheckResponse,
    ComplianceDashboardResponse,
    ComplianceEvidenceHistoryResponse
)

from app.services.document_service import (
    extract_text_from_pdf
)

from app.services.analysis_service import (
    analyze_document
)

from app.services.score_service import (
    calculate_compliance_score
)

from app.services.evidence_decision_service import (
    evaluate_document_requirements
)

from app.services.risk_service import (
    calculate_compliance_risks
)


router = APIRouter()


UPLOAD_DIRECTORY = "uploads"


os.makedirs(
    UPLOAD_DIRECTORY,
    exist_ok=True
)


# ==========================================================
# GET ALL DOCUMENTS
# ==========================================================

@router.get(
    "/documents",
    response_model=list[DocumentResponse]
)
def get_documents(
    db: Session = Depends(get_db)
):
    """
    Return all uploaded documents.
    """

    documents = (
        db.query(Document)
        .order_by(
            Document.id.desc()
        )
        .all()
    )

    return documents


# ==========================================================
# GET SINGLE DOCUMENT
# ==========================================================

@router.get(
    "/documents/{document_id}",
    response_model=DocumentResponse
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Return details of one uploaded document.
    """

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    return document


# ==========================================================
# UPLOAD DOCUMENT
# ==========================================================

@router.post(
    "/documents/upload",
    response_model=DocumentUploadResponse
)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document and store it.
    """

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file was provided."
        )

    file_extension = os.path.splitext(
        file.filename
    )[1].lower()

    if file_extension != ".pdf":

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_path = os.path.join(
        UPLOAD_DIRECTORY,
        file.filename
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(
            file.file.read()
        )

    document = Document(
        filename=file.filename,
        file_type="pdf",
        file_path=file_path,
        uploaded_at=datetime.now().isoformat(),
        status="uploaded",
        extracted_text=None
    )

    db.add(document)

    db.commit()

    db.refresh(document)

    return {
        "message": "Document uploaded successfully.",
        "document": document
    }


# ==========================================================
# ANALYZE DOCUMENT
# ==========================================================

@router.post(
    "/documents/{document_id}/analyze",
    response_model=AnalysisResponse
)
def analyze_uploaded_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Extract text from the uploaded PDF and analyze it.
    """

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    if not os.path.exists(
        document.file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Document file not found."
        )

    extracted_text = extract_text_from_pdf(
        document.file_path
    )

    analysis_result = analyze_document(
        extracted_text
    )

    document.extracted_text = extracted_text

    document.status = "analyzed"

    db.commit()

    db.refresh(document)

    return {
        "document_id": document.id,
        "filename": document.filename,
        "analysis": analysis_result
    }


# ==========================================================
# CREATE COMPLIANCE REQUIREMENT
# ==========================================================

@router.post(
    "/compliance-requirements",
    response_model=ComplianceRequirementResponse
)
def create_compliance_requirement(
    framework: str = "Custom",
    title: str = "",
    description: str = "",
    category: str = "",
    severity: str = "medium",
    db: Session = Depends(get_db)
):
    """
    Create a compliance requirement.
    The requirement belongs to a regulatory framework.
    """

    framework_name = framework.strip()

    requirement_title = title.strip()

    requirement_description = description.strip()

    requirement_category = category.strip()

    requirement_severity = severity.strip().lower()

    if not framework_name:

        raise HTTPException(
            status_code=400,
            detail="Framework cannot be empty."
        )

    if not requirement_title:

        raise HTTPException(
            status_code=400,
            detail="Requirement title cannot be empty."
        )

    if not requirement_description:

        raise HTTPException(
            status_code=400,
            detail="Requirement description cannot be empty."
        )

    if not requirement_category:

        raise HTTPException(
            status_code=400,
            detail="Requirement category cannot be empty."
        )

    if requirement_severity not in (
        "low",
        "medium",
        "high",
        "critical"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Severity must be one of: "
                "low, medium, high, critical."
            )
        )

    framework_record = (
        db.query(Framework)
        .filter(
            Framework.name == framework_name
        )
        .first()
    )

    if not framework_record:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Framework '{framework_name}' "
                f"does not exist."
            )
        )

    existing_requirement = (
        db.query(
            ComplianceRequirement
        )
        .filter(
            ComplianceRequirement.framework
            == framework_name,

            ComplianceRequirement.title
            == requirement_title
        )
        .first()
    )

    if existing_requirement:

        raise HTTPException(
            status_code=409,
            detail=(
                f"A requirement titled "
                f"'{requirement_title}' already exists "
                f"under framework '{framework_name}'."
            )
        )

    requirement = ComplianceRequirement(
        framework=framework_name,
        title=requirement_title,
        description=requirement_description,
        category=requirement_category,
        severity=requirement_severity
    )

    db.add(requirement)

    db.commit()

    db.refresh(requirement)

    return requirement


# ==========================================================
# GET COMPLIANCE REQUIREMENTS
# ==========================================================

@router.get(
    "/compliance-requirements",
    response_model=list[ComplianceRequirementResponse]
)
def get_compliance_requirements(
    framework: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Return compliance requirements.

    If a framework is provided, only requirements belonging
    to that framework are returned.

    If no framework is provided, all requirements are returned.
    """

    requirements_query = (
        db.query(
            ComplianceRequirement
        )
    )

    if framework:

        framework_name = framework.strip()

        if not framework_name:

            raise HTTPException(
                status_code=400,
                detail="Framework cannot be empty."
            )

        framework_record = (
            db.query(Framework)
            .filter(
                Framework.name == framework_name
            )
            .first()
        )

        if not framework_record:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Framework '{framework_name}' "
                    f"does not exist."
                )
            )

        requirements_query = (
            requirements_query
            .filter(
                ComplianceRequirement.framework
                == framework_name
            )
        )

    requirements = (
        requirements_query
        .order_by(
            ComplianceRequirement.id.asc()
        )
        .all()
    )

    return requirements


# ==========================================================
# UPDATE COMPLIANCE REQUIREMENT
# ==========================================================

@router.put(
    "/compliance-requirements/{requirement_id}",
    response_model=ComplianceRequirementResponse
)
def update_compliance_requirement(
    requirement_id: int,
    framework: str | None = Query(default=None),
    title: str | None = Query(default=None),
    description: str | None = Query(default=None),
    category: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Update an existing compliance requirement.
    """

    requirement = (
        db.query(
            ComplianceRequirement
        )
        .filter(
            ComplianceRequirement.id == requirement_id
        )
        .first()
    )

    if not requirement:

        raise HTTPException(
            status_code=404,
            detail="Compliance requirement not found."
        )

    final_framework = (
        framework.strip()
        if framework is not None
        else requirement.framework
    )

    final_title = (
        title.strip()
        if title is not None
        else requirement.title
    )

    final_description = (
        description.strip()
        if description is not None
        else requirement.description
    )

    final_category = (
        category.strip()
        if category is not None
        else requirement.category
    )

    final_severity = (
        severity.strip().lower()
        if severity is not None
        else requirement.severity
    )

    if not final_framework:

        raise HTTPException(
            status_code=400,
            detail="Framework cannot be empty."
        )

    framework_record = (
        db.query(Framework)
        .filter(
            Framework.name == final_framework
        )
        .first()
    )

    if not framework_record:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Framework '{final_framework}' "
                f"does not exist."
            )
        )

    if not final_title:

        raise HTTPException(
            status_code=400,
            detail="Requirement title cannot be empty."
        )

    if not final_description:

        raise HTTPException(
            status_code=400,
            detail=(
                "Requirement description "
                "cannot be empty."
            )
        )

    if not final_category:

        raise HTTPException(
            status_code=400,
            detail=(
                "Requirement category "
                "cannot be empty."
            )
        )

    if final_severity not in (
        "low",
        "medium",
        "high",
        "critical"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Severity must be one of: "
                "low, medium, high, critical."
            )
        )

    duplicate_requirement = (
        db.query(
            ComplianceRequirement
        )
        .filter(
            ComplianceRequirement.framework
            == final_framework,

            ComplianceRequirement.title
            == final_title,

            ComplianceRequirement.id
            != requirement_id
        )
        .first()
    )

    if duplicate_requirement:

        raise HTTPException(
            status_code=409,
            detail=(
                f"A requirement titled "
                f"'{final_title}' already exists "
                f"under framework '{final_framework}'."
            )
        )

    requirement.framework = final_framework

    requirement.title = final_title

    requirement.description = final_description

    requirement.category = final_category

    requirement.severity = final_severity

    db.commit()

    db.refresh(requirement)

    return requirement


# ==========================================================
# DELETE COMPLIANCE REQUIREMENT
# ==========================================================

@router.delete(
    "/compliance-requirements/{requirement_id}"
)
def delete_compliance_requirement(
    requirement_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete an existing compliance requirement.

    Related compliance gaps, evidence and risk records
    are removed first.
    """

    requirement = (
        db.query(
            ComplianceRequirement
        )
        .filter(
            ComplianceRequirement.id == requirement_id
        )
        .first()
    )

    if not requirement:

        raise HTTPException(
            status_code=404,
            detail="Compliance requirement not found."
        )

    (
        db.query(ComplianceGap)
        .filter(
            ComplianceGap.requirement_id
            == requirement_id
        )
        .delete(
            synchronize_session=False
        )
    )

    (
        db.query(ComplianceEvidence)
        .filter(
            ComplianceEvidence.requirement_id
            == requirement_id
        )
        .delete(
            synchronize_session=False
        )
    )

    (
        db.query(ComplianceRisk)
        .filter(
            ComplianceRisk.requirement_id
            == requirement_id
        )
        .delete(
            synchronize_session=False
        )
    )

    db.delete(
        requirement
    )

    db.commit()

    return {
        "message": (
            "Compliance requirement deleted successfully."
        ),
        "requirement_id": requirement_id
    }


# ==========================================================
# CREATE REGULATORY FRAMEWORK
# ==========================================================

@router.post(
    "/frameworks",
    response_model=FrameworkResponse,
    status_code=201
)
def create_framework(
    framework_data: FrameworkCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new regulatory framework.
    """

    framework_name = framework_data.name.strip()

    if not framework_name:

        raise HTTPException(
            status_code=400,
            detail="Framework name cannot be empty."
        )

    framework_status = (
        framework_data.status.strip().lower()
    )

    if framework_status not in (
        "active",
        "inactive"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Framework status must be "
                "'active' or 'inactive'."
            )
        )

    existing_framework = (
        db.query(Framework)
        .filter(
            Framework.name == framework_name
        )
        .first()
    )

    if existing_framework:

        raise HTTPException(
            status_code=409,
            detail=(
                f"Framework '{framework_name}' "
                f"already exists."
            )
        )

    framework = Framework(
        name=framework_name,
        description=(
            framework_data.description.strip()
            if framework_data.description
            else None
        ),
        status=framework_status
    )

    db.add(
        framework
    )

    db.commit()

    db.refresh(
        framework
    )

    return framework


# ==========================================================
# GET ACTIVE FRAMEWORKS
# ==========================================================

@router.get(
    "/frameworks"
)
def get_frameworks(
    db: Session = Depends(get_db)
):
    """
    Return all active regulatory frameworks.
    """

    frameworks = (
        db.query(
            Framework
        )
        .filter(
            Framework.status == "active"
        )
        .order_by(
            Framework.name.asc()
        )
        .all()
    )

    return {
        "frameworks": [
            framework.name
            for framework in frameworks
        ]
    }


# ==========================================================
# GET ALL FRAMEWORKS
# ==========================================================

@router.get(
    "/frameworks/all",
    response_model=list[FrameworkResponse]
)
def get_all_frameworks(
    db: Session = Depends(get_db)
):
    """
    Return all regulatory frameworks.

    Includes active and inactive frameworks.
    """

    frameworks = (
        db.query(
            Framework
        )
        .order_by(
            Framework.name.asc()
        )
        .all()
    )

    return frameworks


# ==========================================================
# UPDATE FRAMEWORK STATUS
# ==========================================================

@router.patch(
    "/frameworks/{framework_id}/status",
    response_model=FrameworkResponse
)
def update_framework_status(
    framework_id: int,
    status: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Activate or deactivate a regulatory framework.
    """

    framework = (
        db.query(
            Framework
        )
        .filter(
            Framework.id == framework_id
        )
        .first()
    )

    if not framework:

        raise HTTPException(
            status_code=404,
            detail="Framework not found."
        )

    framework_status = (
        status.strip().lower()
    )

    if framework_status not in (
        "active",
        "inactive"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Framework status must be "
                "'active' or 'inactive'."
            )
        )

    framework.status = framework_status

    db.commit()

    db.refresh(
        framework
    )

    return framework


# ==========================================================
# CHECK DOCUMENT COMPLIANCE
# ==========================================================

@router.post(
    "/documents/{document_id}/compliance-check",
    response_model=ComplianceCheckResponse
)
def check_document_compliance(
    document_id: int,
    framework: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Compare a document against compliance requirements
    using semantic evidence retrieval.

    The compliance check produces:

        1. Compliance score
        2. Requirement-level compliance results
        3. Compliance gaps
        4. Evidence history
        5. Risk analysis
        6. Persistent risk history
    """

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    if not document.extracted_text:

        raise HTTPException(
            status_code=400,
            detail="Document does not contain extracted text."
        )

    # ======================================================
    # DETERMINE SELECTED FRAMEWORK
    # ======================================================

    selected_framework = (
        framework.strip()
        if framework
        else "All Frameworks"
    )

    requirements_query = (
        db.query(
            ComplianceRequirement
        )
    )

    if framework:

        framework_name = framework.strip()

        if not framework_name:

            raise HTTPException(
                status_code=400,
                detail="Framework cannot be empty."
            )

        framework_record = (
            db.query(Framework)
            .filter(
                Framework.name == framework_name
            )
            .first()
        )

        if not framework_record:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Framework '{framework_name}' "
                    f"does not exist."
                )
            )

        requirements_query = (
            requirements_query
            .filter(
                ComplianceRequirement.framework
                == framework_name
            )
        )

    requirements = (
        requirements_query
        .order_by(
            ComplianceRequirement.id.asc()
        )
        .all()
    )

    if not requirements:

        if framework:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No compliance requirements "
                    f"are available for framework "
                    f"'{framework}'."
                )
            )

        raise HTTPException(
            status_code=400,
            detail="No compliance requirements are available."
        )

    requirement_data = []

    for requirement in requirements:

        requirement_data.append({
            "id": requirement.id,
            "framework": requirement.framework,
            "title": requirement.title,
            "description": requirement.description,
            "category": requirement.category,
            "severity": requirement.severity
        })

    evidence_results = evaluate_document_requirements(
        document_text=document.extracted_text,
        requirements=requirement_data,
        top_k=3
    )

    results = []

    for result in evidence_results:

        formatted_evidence = []

        raw_evidence = result.get(
            "evidence",
            []
        )

        for index, evidence_item in enumerate(
            raw_evidence,
            start=1
        ):

            formatted_evidence.append({
                "evidence_number": index,
                "text": evidence_item[
                    "text"
                ],
                "similarity_score": round(
                    float(
                        evidence_item[
                            "similarity_score"
                        ]
                    ),
                    6
                )
            })

        results.append({
            "requirement_id": result[
                "requirement_id"
            ],
            "title": result[
                "requirement_title"
            ],
            "category": result[
                "category"
            ],
            "severity": result[
                "severity"
            ],
            "status": result[
                "status"
            ],
            "explanation": result[
                "explanation"
            ],
            "evidence": formatted_evidence
        })

    check_run_id = str(
        uuid4()
    )

    evidence_timestamp = (
        datetime.now().isoformat()
    )

    for result in results:

        for evidence_item in result[
            "evidence"
        ]:

            compliance_evidence = ComplianceEvidence(
                document_id=document.id,
                check_run_id=check_run_id,
                requirement_id=result[
                    "requirement_id"
                ],
                evidence_number=evidence_item[
                    "evidence_number"
                ],
                evidence_text=evidence_item[
                    "text"
                ],
                similarity_score=float(
                    evidence_item[
                        "similarity_score"
                    ]
                ),
                status=result[
                    "status"
                ],
                explanation=result[
                    "explanation"
                ],
                created_at=evidence_timestamp
            )

            db.add(
                compliance_evidence
            )

    # ======================================================
    # CALCULATE COMPLIANCE SCORE
    # ======================================================

    score_results = []

    for result in results:

        score_results.append({
            "requirement_id": result[
                "requirement_id"
            ],
            "status": result[
                "status"
            ],
            "explanation": result[
                "explanation"
            ],
            "severity": result[
                "severity"
            ],
            "category": result[
                "category"
            ]
        })

    score_data = calculate_compliance_score(
        score_results
    )

    # ======================================================
    # CALCULATE COMPLIANCE RISK
    # ======================================================

    risk_results = []

    for result in results:

        risk_results.append({
            "requirement_id": result[
                "requirement_id"
            ],
            "title": result[
                "title"
            ],
            "severity": result[
                "severity"
            ],
            "status": result[
                "status"
            ]
        })

    risk_data = calculate_compliance_risks(
        risk_results
    )

    risk_timestamp = (
        datetime.now().isoformat()
    )

    # ======================================================
    # STORE PERSISTENT RISK HISTORY
    # ======================================================

    for risk in risk_data["risks"]:

        compliance_risk = ComplianceRisk(
            document_id=document.id,
            check_run_id=check_run_id,

            # IMPORTANT:
            # Store the framework used for this
            # compliance check.
            framework=selected_framework,

            requirement_id=risk[
                "requirement_id"
            ],
            title=risk[
                "title"
            ],
            severity=risk[
                "severity"
            ],
            status=risk[
                "status"
            ],
            base_risk=float(
                risk[
                    "base_risk"
                ]
            ),
            risk_score=float(
                risk[
                    "risk_score"
                ]
            ),
            risk_level=risk[
                "risk_level"
            ],
            created_at=risk_timestamp
        )

        db.add(
            compliance_risk
        )

    # ======================================================
    # REPLACE CURRENT COMPLIANCE GAPS
    # ======================================================

    (
        db.query(ComplianceGap)
        .filter(
            ComplianceGap.document_id == document_id
        )
        .delete(
            synchronize_session=False
        )
    )

    for result in results:

        if result["status"] in (
            "missing",
            "review"
        ):

            compliance_gap = ComplianceGap(
                document_id=document.id,
                requirement_id=result[
                    "requirement_id"
                ],
                status=result[
                    "status"
                ],
                explanation=result[
                    "explanation"
                ],
                recommendation=None
            )

            db.add(
                compliance_gap
            )

    document.status = "compliance_checked"

    db.commit()

    return {
        "document_id": document.id,
        "filename": document.filename,
        "framework": selected_framework,
        "score": score_data[
            "score"
        ],
        "total_requirements": score_data[
            "total_requirements"
        ],
        "matched_requirements": score_data[
            "matched_requirements"
        ],
        "missing_requirements": score_data[
            "missing_requirements"
        ],
        "results": results,
        "risk": risk_data
    }


# ==========================================================
# GET STORED COMPLIANCE EVIDENCE
# ==========================================================

@router.get(
    "/documents/{document_id}/compliance-evidence",
    response_model=ComplianceEvidenceHistoryResponse
)
def get_document_compliance_evidence(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Return previously stored compliance evidence
    for a document.
    """

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    evidence_records = (
        db.query(
            ComplianceEvidence
        )
        .filter(
            ComplianceEvidence.document_id == document_id
        )
        .order_by(
            ComplianceEvidence.created_at.desc(),
            ComplianceEvidence.requirement_id.asc(),
            ComplianceEvidence.evidence_number.asc()
        )
        .all()
    )

    evidence = []

    for record in evidence_records:

        evidence.append({
            "id": record.id,
            "document_id": record.document_id,
            "check_run_id": record.check_run_id,
            "requirement_id": record.requirement_id,
            "evidence_number": record.evidence_number,
            "evidence_text": record.evidence_text,
            "similarity_score": record.similarity_score,
            "status": record.status,
            "explanation": record.explanation,
            "created_at": record.created_at
        })

    return {
        "document_id": document_id,
        "total_evidence": len(
            evidence
        ),
        "evidence": evidence
    }


# ==========================================================
# GET STORED COMPLIANCE RISK HISTORY
# ==========================================================

@router.get(
    "/documents/{document_id}/compliance-risks"
)
def get_document_compliance_risks(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Return previously stored compliance risk assessments
    for a document.

    Risk records are preserved across compliance check runs.
    """

    # ======================================================
    # VERIFY DOCUMENT
    # ======================================================

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    # ======================================================
    # GET STORED RISK RECORDS
    # ======================================================

    risk_records = (
        db.query(
            ComplianceRisk
        )
        .filter(
            ComplianceRisk.document_id == document_id
        )
        .order_by(
            ComplianceRisk.created_at.desc(),
            ComplianceRisk.id.desc()
        )
        .all()
    )

    # ======================================================
    # FORMAT RISK HISTORY
    # ======================================================

    risks = []

    for record in risk_records:

        risks.append({
            "id": record.id,
            "document_id": record.document_id,
            "check_run_id": record.check_run_id,

            # Framework used during the check.
            "framework": record.framework,

            "requirement_id": record.requirement_id,
            "title": record.title,
            "severity": record.severity,
            "status": record.status,
            "base_risk": record.base_risk,
            "risk_score": record.risk_score,
            "risk_level": record.risk_level,
            "created_at": record.created_at
        })

    # ======================================================
    # RETURN RISK HISTORY
    # ======================================================

    return {
        "document_id": document_id,
        "document_filename": document.filename,
        "total_risks": len(
            risks
        ),
        "risks": risks
    }


# ==========================================================
# GET DOCUMENT COMPLIANCE SUMMARY
# ==========================================================

@router.get(
    "/documents/{document_id}/compliance-summary"
)
def get_document_compliance_summary(
    document_id: int,
    framework: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Return the compliance summary for one document.
    """

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    if not document.extracted_text:

        raise HTTPException(
            status_code=400,
            detail="Document does not contain extracted text."
        )

    requirements_query = (
        db.query(
            ComplianceRequirement
        )
    )

    if framework:

        framework_name = framework.strip()

        if not framework_name:

            raise HTTPException(
                status_code=400,
                detail="Framework cannot be empty."
            )

        framework_record = (
            db.query(Framework)
            .filter(
                Framework.name == framework_name
            )
            .first()
        )

        if not framework_record:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Framework '{framework_name}' "
                    f"does not exist."
                )
            )

        requirements_query = (
            requirements_query
            .filter(
                ComplianceRequirement.framework
                == framework_name
            )
        )

    requirements = (
        requirements_query
        .order_by(
            ComplianceRequirement.id.asc()
        )
        .all()
    )

    if not requirements:

        if framework:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No compliance requirements "
                    f"are available for framework "
                    f"'{framework}'."
                )
            )

        raise HTTPException(
            status_code=400,
            detail="No compliance requirements are available."
        )

    requirement_data = []

    for requirement in requirements:

        requirement_data.append({
            "id": requirement.id,
            "framework": requirement.framework,
            "title": requirement.title,
            "description": requirement.description,
            "category": requirement.category,
            "severity": requirement.severity
        })

    evidence_results = evaluate_document_requirements(
        document_text=document.extracted_text,
        requirements=requirement_data,
        top_k=3
    )

    score_results = []

    for result in evidence_results:

        score_results.append({
            "requirement_id": result[
                "requirement_id"
            ],
            "status": result[
                "status"
            ],
            "explanation": result[
                "explanation"
            ],
            "severity": result[
                "severity"
            ],
            "category": result[
                "category"
            ]
        })

    score_data = calculate_compliance_score(
        score_results
    )

    score = score_data[
        "score"
    ]

    if score >= 90:

        overall_status = "Fully Compliant"

    elif score >= 70:

        overall_status = "Mostly Compliant"

    elif score >= 40:

        overall_status = "Partially Compliant"

    else:

        overall_status = "Non-Compliant"

    return {
        "document_id": document.id,
        "document_filename": document.filename,
        "framework": framework or "All Frameworks",
        "score": score,
        "total_requirements": score_data[
            "total_requirements"
        ],
        "matched_requirements": score_data[
            "matched_requirements"
        ],
        "missing_requirements": score_data[
            "missing_requirements"
        ],
        "overall_status": overall_status
    }


# ==========================================================
# COMPLIANCE DASHBOARD
# ==========================================================

@router.get(
    "/compliance-dashboard",
    response_model=ComplianceDashboardResponse
)
def get_compliance_dashboard(
    framework: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Return overall compliance statistics
    for the ReguAI dashboard.
    """

    documents = (
        db.query(Document)
        .order_by(
            Document.id.desc()
        )
        .all()
    )

    total_documents = len(
        documents
    )

    document_summaries = []

    scores = []

    fully_compliant_documents = 0

    mostly_compliant_documents = 0

    partially_compliant_documents = 0

    non_compliant_documents = 0

    requirements_query = (
        db.query(
            ComplianceRequirement
        )
    )

    if framework:

        framework_name = framework.strip()

        if not framework_name:

            raise HTTPException(
                status_code=400,
                detail="Framework cannot be empty."
            )

        framework_record = (
            db.query(Framework)
            .filter(
                Framework.name == framework_name
            )
            .first()
        )

        if not framework_record:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Framework '{framework_name}' "
                    f"does not exist."
                )
            )

        requirements_query = (
            requirements_query
            .filter(
                ComplianceRequirement.framework
                == framework_name
            )
        )

    requirements = (
        requirements_query
        .order_by(
            ComplianceRequirement.id.asc()
        )
        .all()
    )

    if framework and not requirements:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No compliance requirements "
                f"are available for framework "
                f"'{framework}'."
            )
        )

    requirement_data = []

    for requirement in requirements:

        requirement_data.append({
            "id": requirement.id,
            "framework": requirement.framework,
            "title": requirement.title,
            "description": requirement.description,
            "category": requirement.category,
            "severity": requirement.severity
        })

    for document in documents:

        score = 0.0

        total_requirements = 0

        matched_requirements = 0

        missing_requirements = 0

        overall_status = "not_analyzed"

        if (
            document.extracted_text
            and requirement_data
        ):

            evidence_results = (
                evaluate_document_requirements(
                    document_text=document.extracted_text,
                    requirements=requirement_data,
                    top_k=3
                )
            )

            score_results = []

            for result in evidence_results:

                score_results.append({
                    "requirement_id": result[
                        "requirement_id"
                    ],
                    "status": result[
                        "status"
                    ],
                    "explanation": result[
                        "explanation"
                    ],
                    "severity": result[
                        "severity"
                    ],
                    "category": result[
                        "category"
                    ]
                })

            score_data = calculate_compliance_score(
                score_results
            )

            score = score_data[
                "score"
            ]

            total_requirements = score_data[
                "total_requirements"
            ]

            matched_requirements = score_data[
                "matched_requirements"
            ]

            missing_requirements = score_data[
                "missing_requirements"
            ]

            scores.append(
                score
            )

            if score >= 90:

                overall_status = (
                    "fully_compliant"
                )

                fully_compliant_documents += 1

            elif score >= 70:

                overall_status = (
                    "mostly_compliant"
                )

                mostly_compliant_documents += 1

            elif score >= 40:

                overall_status = (
                    "partially_compliant"
                )

                partially_compliant_documents += 1

            else:

                overall_status = (
                    "non_compliant"
                )

                non_compliant_documents += 1

        document_summaries.append({
            "document_id": document.id,
            "document_filename": document.filename,
            "document_status": document.status,
            "score": score,
            "total_requirements": total_requirements,
            "matched_requirements": matched_requirements,
            "missing_requirements": missing_requirements,
            "overall_status": overall_status
        })

    if scores:

        average_score = (
            sum(scores) / len(scores)
        )

    else:

        average_score = 0.0

    return {
        "total_documents": total_documents,

        "average_score": round(
            average_score,
            2
        ),

        "fully_compliant_documents": (
            fully_compliant_documents
        ),

        "mostly_compliant_documents": (
            mostly_compliant_documents
        ),

        "partially_compliant_documents": (
            partially_compliant_documents
        ),

        "non_compliant_documents": (
            non_compliant_documents
        ),

        "documents": document_summaries
    }