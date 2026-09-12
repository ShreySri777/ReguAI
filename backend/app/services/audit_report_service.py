# ==========================================================
# REGUAI - AUDIT REPORT SERVICE
# ==========================================================

"""
Service responsible for generating the textual content
of ReguAI compliance audit reports.

The report includes:

- Document information
- Compliance framework
- Compliance summary
- Requirement analysis
- Compliance decisions
- Explanations
- Recommendations
- Supporting RAG evidence
- Evidence similarity scores
- Audit conclusion
"""


from datetime import datetime


def generate_audit_report_content(
    filename: str,
    framework: str,
    score: float,
    total_requirements: int,
    matched_requirements: int,
    missing_requirements: int,
    results: list
):
    """
    Generate the textual content of a compliance audit report.

    Each requirement may contain supporting evidence
    retrieved through the ReguAI RAG pipeline.

    The report also records the compliance framework
    used for the assessment.
    """

    # ======================================================
    # DETERMINE OVERALL STATUS
    # ======================================================

    if score >= 90:

        overall_status = "Fully Compliant"

    elif score >= 70:

        overall_status = "Mostly Compliant"

    elif score >= 40:

        overall_status = "Partially Compliant"

    else:

        overall_status = "Non-Compliant"


    # ======================================================
    # REPORT CONTENT
    # ======================================================

    report_lines = []


    # ======================================================
    # REPORT HEADER
    # ======================================================

    report_lines.append(
        "REGUAI COMPLIANCE AUDIT REPORT"
    )

    report_lines.append(
        "=" * 50
    )

    report_lines.append("")


    # ======================================================
    # DOCUMENT INFORMATION
    # ======================================================

    report_lines.append(
        "DOCUMENT INFORMATION"
    )

    report_lines.append(
        "-" * 50
    )

    report_lines.append(
        f"Document: {filename}"
    )

    report_lines.append(
        f"Compliance Framework: {framework}"
    )

    report_lines.append(
        f"Report Generated: "
        f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    report_lines.append("")


    # ======================================================
    # COMPLIANCE SUMMARY
    # ======================================================

    report_lines.append(
        "COMPLIANCE SUMMARY"
    )

    report_lines.append(
        "-" * 50
    )

    report_lines.append(
        f"Compliance Score: {score}%"
    )

    report_lines.append(
        f"Overall Status: {overall_status}"
    )

    report_lines.append(
        f"Total Requirements: {total_requirements}"
    )

    report_lines.append(
        f"Matched Requirements: {matched_requirements}"
    )

    report_lines.append(
        f"Missing Requirements: {missing_requirements}"
    )

    report_lines.append("")


    # ======================================================
    # REQUIREMENT ANALYSIS
    # ======================================================

    report_lines.append(
        "COMPLIANCE REQUIREMENT ANALYSIS"
    )

    report_lines.append(
        "-" * 50
    )


    if not results:

        report_lines.append(
            "No compliance requirements were available "
            "for analysis."
        )

    else:

        for index, result in enumerate(
            results,
            start=1
        ):

            # --------------------------------------------------
            # REQUIREMENT TITLE
            # --------------------------------------------------

            report_lines.append(
                f"{index}. "
                f"{result.get(
                    'title',
                    'Unknown Requirement'
                )}"
            )


            # --------------------------------------------------
            # REQUIREMENT METADATA
            # --------------------------------------------------

            report_lines.append(
                f"   Category: "
                f"{result.get(
                    'category',
                    'Unknown'
                )}"
            )

            report_lines.append(
                f"   Severity: "
                f"{result.get(
                    'severity',
                    'Unknown'
                )}"
            )

            report_lines.append(
                f"   Status: "
                f"{result.get(
                    'status',
                    'Unknown'
                )}"
            )


            # --------------------------------------------------
            # EXPLANATION
            # --------------------------------------------------

            report_lines.append(
                f"   Explanation: "
                f"{result.get(
                    'explanation',
                    'No explanation available.'
                )}"
            )


            # --------------------------------------------------
            # RECOMMENDATION
            # --------------------------------------------------

            recommendation = result.get(
                "recommendation"
            )

            if recommendation:

                report_lines.append(
                    f"   Recommendation: "
                    f"{recommendation}"
                )


            # --------------------------------------------------
            # SUPPORTING EVIDENCE
            # --------------------------------------------------

            evidence = result.get(
                "evidence",
                []
            )


            if evidence:

                report_lines.append("")

                report_lines.append(
                    "   SUPPORTING EVIDENCE"
                )

                report_lines.append(
                    "   -------------------"
                )


                for evidence_index, evidence_item in enumerate(
                    evidence,
                    start=1
                ):

                    evidence_text = (
                        evidence_item.get(
                            "text",
                            evidence_item.get(
                                "evidence_text",
                                "No evidence text available."
                            )
                        )
                    )


                    similarity_score = float(
                        evidence_item.get(
                            "similarity_score",
                            0
                        )
                    )


                    # ------------------------------------------
                    # EVIDENCE NUMBER
                    # ------------------------------------------

                    report_lines.append(
                        f"   Evidence {evidence_index}"
                    )


                    # ------------------------------------------
                    # SIMILARITY SCORE
                    # ------------------------------------------

                    report_lines.append(
                        f"   Similarity Score: "
                        f"{similarity_score * 100:.1f}%"
                    )


                    # ------------------------------------------
                    # EVIDENCE PASSAGE
                    # ------------------------------------------

                    report_lines.append(
                        "   Evidence Passage:"
                    )


                    # Keep evidence readable inside the
                    # textual report.
                    evidence_lines = (
                        evidence_text
                        .replace("\r\n", "\n")
                        .replace("\r", "\n")
                        .split("\n")
                    )


                    for evidence_line in evidence_lines:

                        cleaned_line = evidence_line.strip()

                        if cleaned_line:

                            report_lines.append(
                                f"   {cleaned_line}"
                            )


                    report_lines.append("")


            else:

                report_lines.append("")

                report_lines.append(
                    "   SUPPORTING EVIDENCE"
                )

                report_lines.append(
                    "   -------------------"
                )

                report_lines.append(
                    "   No supporting evidence was retrieved."
                )


            # --------------------------------------------------
            # SEPARATOR
            # --------------------------------------------------

            report_lines.append("")


    # ======================================================
    # AUDIT CONCLUSION
    # ======================================================

    report_lines.append(
        "AUDIT CONCLUSION"
    )

    report_lines.append(
        "-" * 50
    )


    if overall_status == "Fully Compliant":

        report_lines.append(
            "The document satisfies the assessed compliance "
            "requirements with a high compliance score."
        )

    elif overall_status == "Mostly Compliant":

        report_lines.append(
            "The document addresses most of the assessed "
            "compliance requirements, but some gaps remain."
        )

    elif overall_status == "Partially Compliant":

        report_lines.append(
            "The document addresses some of the assessed "
            "compliance requirements, but significant gaps remain."
        )

    else:

        report_lines.append(
            "The document does not provide sufficient evidence "
            "for the majority of the assessed compliance "
            "requirements."
        )


    report_lines.append("")


    # ======================================================
    # EVIDENCE TRACEABILITY NOTE
    # ======================================================

    report_lines.append(
        "EVIDENCE TRACEABILITY"
    )

    report_lines.append(
        "-" * 50
    )

    report_lines.append(
        "Supporting evidence passages were retrieved using "
        "semantic similarity analysis from the document."
    )

    report_lines.append(
        "Similarity scores indicate the relevance of each "
        "retrieved passage to its associated requirement."
    )

    report_lines.append("")


    # ======================================================
    # FOOTER
    # ======================================================

    report_lines.append(
        "This report was generated by ReguAI."
    )


    return "\n".join(
        report_lines
    )