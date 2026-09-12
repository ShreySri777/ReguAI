# ==========================================================
# REGUAI - AUDIT REPORT API
# ==========================================================

"""
API routes responsible for:

- Generating audit reports
- Retrieving audit reports
- Downloading audit reports as PDFs
- Returning compliance summaries
- Returning compliance gaps

Audit reports use the same evidence-based compliance
analysis pipeline used by the main compliance workflow.
"""


from datetime import datetime


from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)


from fastapi.responses import (
    StreamingResponse
)


from sqlalchemy.orm import Session


from app.database.database import (
    get_db
)


from app.models.document import (
    Document
)


from app.models.compliance_requirement import (
    ComplianceRequirement
)


from app.models.audit_report import (
    AuditReport
)


from app.models.compliance_evidence import (
    ComplianceEvidence
)


from app.schemas.audit_report_schema import (
    AuditReportResponse
)


from app.schemas.compliance_summary_schema import (
    ComplianceSummaryResponse
)


from app.services.evidence_decision_service import (
    evaluate_document_requirements
)


from app.services.score_service import (
    calculate_compliance_score
)


from app.services.audit_report_service import (
    generate_audit_report_content
)


from app.services.pdf_service import (
    generate_audit_report_pdf
)


router = APIRouter()


# ==========================================================
# GENERATE AUDIT REPORT
# ==========================================================

@router.post(
    "/documents/{document_id}/audit-report",
    response_model=AuditReportResponse
)
def generate_audit_report(
    document_id: int,
    framework: str | None = Query(
        default=None
    ),
    db: Session = Depends(get_db)
):
    """
    Generate and store an evidence-based audit report
    for a document.

    The report combines:

    1. Compliance analysis results
    2. Compliance requirement metadata
    3. Persisted evidence history
    4. Selected compliance framework
    """

    # ======================================================
    # FIND DOCUMENT
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
    # VERIFY EXTRACTED TEXT
    # ======================================================

    if not document.extracted_text:

        raise HTTPException(
            status_code=400,
            detail="Document does not contain extracted text."
        )


    # ======================================================
    # LOAD REQUIREMENTS
    # ======================================================

    requirements_query = (
        db.query(
            ComplianceRequirement
        )
    )


    # ======================================================
    # FILTER REQUIREMENTS BY FRAMEWORK
    # ======================================================

    if framework:

        requirements_query = (
            requirements_query
            .filter(
                ComplianceRequirement.framework
                == framework
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


    # ======================================================
    # DETERMINE REPORT FRAMEWORK
    # ======================================================

    report_framework = (
        framework
        if framework
        else "All Frameworks"
    )


    # ======================================================
    # PREPARE REQUIREMENT DATA
    # ======================================================

    requirement_data = []


    for requirement in requirements:

        requirement_data.append({

            "id":
                requirement.id,

            "title":
                requirement.title,

            "description":
                requirement.description,

            "category":
                requirement.category,

            "severity":
                requirement.severity,

            "framework":
                requirement.framework

        })


    # ======================================================
    # RUN EVIDENCE-BASED COMPLIANCE ANALYSIS
    # ======================================================

    analysis_results = (
        evaluate_document_requirements(
            document_text=document.extracted_text,
            requirements=requirement_data
        )
    )


    # ======================================================
    # LOAD STORED EVIDENCE
    # ======================================================

    stored_evidence = (
        db.query(
            ComplianceEvidence
        )
        .filter(
            ComplianceEvidence.document_id
            == document_id
        )
        .order_by(
            ComplianceEvidence.requirement_id.asc(),
            ComplianceEvidence.created_at.desc(),
            ComplianceEvidence.evidence_number.asc()
        )
        .all()
    )


    # ======================================================
    # GROUP STORED EVIDENCE BY REQUIREMENT
    # ======================================================

    evidence_by_requirement = {}


    for evidence_item in stored_evidence:

        requirement_id = (
            evidence_item.requirement_id
        )


        if requirement_id not in evidence_by_requirement:

            evidence_by_requirement[
                requirement_id
            ] = []


        evidence_by_requirement[
            requirement_id
        ].append({

            "evidence_number":
                evidence_item.evidence_number,

            "text":
                evidence_item.evidence_text,

            "similarity_score":
                float(
                    evidence_item.similarity_score
                )

        })


    # ======================================================
    # CREATE REQUIREMENT LOOKUP
    # ======================================================

    requirement_by_id = {}


    for requirement in requirements:

        requirement_by_id[
            requirement.id
        ] = requirement


    # ======================================================
    # BUILD FINAL AUDIT RESULTS
    # ======================================================

    results = []


    for analysis_result in analysis_results:

        requirement_id = (
            analysis_result.get(
                "requirement_id"
            )
        )


        requirement = (
            requirement_by_id.get(
                requirement_id
            )
        )


        if requirement:

            title = requirement.title

            category = requirement.category

            severity = requirement.severity

        else:

            title = analysis_result.get(
                "requirement_title",
                analysis_result.get(
                    "title",
                    "Unknown Requirement"
                )
            )

            category = analysis_result.get(
                "category",
                "Unknown"
            )

            severity = analysis_result.get(
                "severity",
                "Unknown"
            )


        # --------------------------------------------------
        # GET STORED EVIDENCE
        # --------------------------------------------------

        evidence = evidence_by_requirement.get(
            requirement_id,
            []
        )


        # --------------------------------------------------
        # BUILD RESULT
        # --------------------------------------------------

        results.append({

            "requirement_id":
                requirement_id,

            "title":
                title,

            "category":
                category,

            "severity":
                severity,

            "status":
                analysis_result.get(
                    "status",
                    "unknown"
                ),

            "explanation":
                analysis_result.get(
                    "explanation",
                    "No explanation available."
                ),

            "evidence":
                evidence

        })


    # ======================================================
    # FALLBACK FOR STORED EVIDENCE
    # ======================================================

    existing_requirement_ids = {

        result.get(
            "requirement_id"
        )

        for result in results

    }


    for requirement in requirements:

        if requirement.id in existing_requirement_ids:

            continue


        evidence = evidence_by_requirement.get(
            requirement.id,
            []
        )


        if not evidence:

            continue


        results.append({

            "requirement_id":
                requirement.id,

            "title":
                requirement.title,

            "category":
                requirement.category,

            "severity":
                requirement.severity,

            "status":
                "review",

            "explanation":
                "Supporting evidence was retrieved "
                "during a previous compliance analysis "
                "and requires manual review.",

            "evidence":
                evidence

        })


    # ======================================================
    # CALCULATE COMPLIANCE SCORE
    # ======================================================

    score_data = (
        calculate_compliance_score(
            results
        )
    )


    # ======================================================
    # GENERATE TEXT REPORT
    # ======================================================

    report_content = (
        generate_audit_report_content(

            filename=
                document.filename,

            framework=
                report_framework,

            score=
                score_data[
                    "score"
                ],

            total_requirements=
                score_data[
                    "total_requirements"
                ],

            matched_requirements=
                score_data[
                    "matched_requirements"
                ],

            missing_requirements=
                score_data[
                    "missing_requirements"
                ],

            results=
                results

        )
    )


    # ======================================================
    # CREATE DATABASE RECORD
    # ======================================================

    audit_report = AuditReport(

        document_id=
            document.id,

        report_title=(
            f"Compliance Audit Report - "
            f"{document.filename}"
        ),

        framework=
            report_framework,

        generated_at=
            datetime.now().isoformat(),

        status=
            "generated",

        report_content=
            report_content

    )


    db.add(
        audit_report
    )


    db.commit()


    db.refresh(
        audit_report
    )


    return audit_report


# ==========================================================
# GET LATEST AUDIT REPORT
# ==========================================================

@router.get(
    "/documents/{document_id}/audit-report",
    response_model=AuditReportResponse
)
def get_audit_report(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve the latest generated audit report
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


    audit_report = (
        db.query(AuditReport)
        .filter(
            AuditReport.document_id
            == document_id
        )
        .order_by(
            AuditReport.id.desc()
        )
        .first()
    )


    if not audit_report:

        raise HTTPException(
            status_code=404,
            detail=(
                "No audit report has been generated "
                "for this document."
            )
        )


    return audit_report


# ==========================================================
# GET ALL AUDIT REPORTS
# ==========================================================

@router.get(
    "/documents/{document_id}/audit-reports",
    response_model=list[AuditReportResponse]
)
def get_audit_reports(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve all generated audit reports
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


    audit_reports = (
        db.query(AuditReport)
        .filter(
            AuditReport.document_id
            == document_id
        )
        .order_by(
            AuditReport.id.desc()
        )
        .all()
    )


    return audit_reports


# ==========================================================
# DOWNLOAD AUDIT REPORT PDF
# ==========================================================

@router.get(
    "/documents/{document_id}/audit-report/pdf"
)
def download_audit_report_pdf(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate and return the latest audit report
    as a PDF file.
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


    audit_report = (
        db.query(AuditReport)
        .filter(
            AuditReport.document_id
            == document_id
        )
        .order_by(
            AuditReport.id.desc()
        )
        .first()
    )


    if not audit_report:

        raise HTTPException(
            status_code=404,
            detail=(
                "No audit report has been generated "
                "for this document."
            )
        )


    if not audit_report.report_content:

        raise HTTPException(
            status_code=400,
            detail=(
                "Audit report does not contain "
                "any content."
            )
        )


    # ======================================================
    # GENERATE PDF
    # ======================================================

    pdf_buffer = (
        generate_audit_report_pdf(
            report_content=
                audit_report.report_content
        )
    )


    filename = (
        f"ReguAI_Audit_Report_"
        f"{document.id}.pdf"
    )


    return StreamingResponse(

        pdf_buffer,

        media_type=
            "application/pdf",

        headers={

            "Content-Disposition":
                (
                    f'attachment; '
                    f'filename="{filename}"'
                )

        }

    )


# ==========================================================
# COMPLIANCE SUMMARY
# ==========================================================

# NOTE:
# The active compliance-summary API endpoint is now defined
# in documents.py because it supports framework filtering.
#
# This legacy function is intentionally retained so that its
# existing logic is not lost, but it is no longer registered
# as an API route.

def get_compliance_summary(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Legacy compliance summary logic.

    The active API endpoint is defined in documents.py.
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
            detail=(
                "Document does not contain "
                "extracted text."
            )
        )


    requirements = (
        db.query(
            ComplianceRequirement
        )
        .order_by(
            ComplianceRequirement.id.asc()
        )
        .all()
    )


    if not requirements:

        raise HTTPException(
            status_code=400,
            detail=(
                "No compliance requirements "
                "are available."
            )
        )


    results = evaluate_document_requirements(

        document_text=
            document.extracted_text,

        requirements=[

            {

                "id":
                    requirement.id,

                "title":
                    requirement.title,

                "description":
                    requirement.description,

                "category":
                    requirement.category,

                "severity":
                    requirement.severity

            }

            for requirement in requirements

        ]

    )


    score_data = (
        calculate_compliance_score(
            results
        )
    )


    score = score_data[
        "score"
    ]


    if score >= 90:

        overall_status = (
            "Fully Compliant"
        )

    elif score >= 70:

        overall_status = (
            "Mostly Compliant"
        )

    elif score >= 40:

        overall_status = (
            "Partially Compliant"
        )

    else:

        overall_status = (
            "Non-Compliant"
        )


    return {

        "document_id":
            document.id,

        "document_filename":
            document.filename,

        "score":
            score,

        "total_requirements":
            score_data[
                "total_requirements"
            ],

        "matched_requirements":
            score_data[
                "matched_requirements"
            ],

        "missing_requirements":
            score_data[
                "missing_requirements"
            ],

        "overall_status":
            overall_status

    }


# ==========================================================
# COMPLIANCE GAPS
# ==========================================================

@router.get(
    "/documents/{document_id}/compliance-gaps"
)
def get_compliance_gaps(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Return detailed compliance gap analysis
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


    if not document.extracted_text:

        raise HTTPException(
            status_code=400,
            detail=(
                "Document does not contain "
                "extracted text."
            )
        )


    requirements = (
        db.query(
            ComplianceRequirement
        )
        .order_by(
            ComplianceRequirement.id.asc()
        )
        .all()
    )


    if not requirements:

        raise HTTPException(
            status_code=400,
            detail=(
                "No compliance requirements "
                "are available."
            )
        )


    results = evaluate_document_requirements(

        document_text=
            document.extracted_text,

        requirements=[

            {

                "id":
                    requirement.id,

                "title":
                    requirement.title,

                "description":
                    requirement.description,

                "category":
                    requirement.category,

                "severity":
                    requirement.severity

            }

            for requirement in requirements

        ]

    )


    gaps = []


    for result in results:

        if result["status"] in (
            "missing",
            "review"
        ):

            requirement_id = result.get(
                "requirement_id"
            )


            requirement = (
                db.query(
                    ComplianceRequirement
                )
                .filter(
                    ComplianceRequirement.id
                    == requirement_id
                )
                .first()
            )


            title = (
                requirement.title
                if requirement
                else result.get(
                    "requirement_title",
                    result.get(
                        "title",
                        "Unknown Requirement"
                    )
                )
            )


            gaps.append({

                "requirement_id":
                    requirement_id,

                "title":
                    title,

                "category":
                    result.get(
                        "category",
                        "Unknown"
                    ),

                "severity":
                    result.get(
                        "severity",
                        "Unknown"
                    ),

                "status":
                    result.get(
                        "status",
                        "unknown"
                    ),

                "explanation":
                    result.get(
                        "explanation",
                        "No explanation available."
                    ),

                "recommendation":
                    result.get(
                        "recommendation"
                    )

            })


    return {

        "document_id":
            document.id,

        "document_filename":
            document.filename,

        "total_gaps":
            len(gaps),

        "gaps":
            gaps

    }