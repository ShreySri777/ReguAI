from io import BytesIO
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)


# ==========================================================
# OVERALL STATUS
# ==========================================================

def get_overall_status(score):
    """
    Determine the overall compliance status from the score.
    """

    if score >= 90:
        return "Fully Compliant"

    elif score >= 70:
        return "Mostly Compliant"

    elif score >= 40:
        return "Partially Compliant"

    return "Non-Compliant"


# ==========================================================
# TEXT HELPERS
# ==========================================================

def safe_text(value):
    """
    Safely prepare text for ReportLab Paragraphs.

    ReportLab Paragraph uses XML-style markup, so characters
    such as &, <, and > must be escaped when they are part
    of normal text.
    """

    if value is None:
        return ""

    return escape(str(value))


# ==========================================================
# PARSE REPORT CONTENT
# ==========================================================

def parse_report_content(report_content):
    """
    Extract important information from the generated
    audit report text, including:

    - Document
    - Compliance framework
    - Generated timestamp
    - Compliance score
    - Overall status
    - Requirement counts
    - Requirement analysis
    - Supporting evidence
    - Audit conclusion
    """

    data = {
        "document": "",
        "framework": "",
        "generated_at": "",
        "score": 0.0,
        "overall_status": "",
        "total_requirements": 0,
        "matched_requirements": 0,
        "missing_requirements": 0,
        "requirements": [],
        "conclusion": ""
    }

    lines = report_content.splitlines()

    current_requirement = None
    current_evidence = None

    in_analysis = False
    in_conclusion = False
    in_evidence = False

    for raw_line in lines:

        line = raw_line.strip()

        if not line:
            continue

        # --------------------------------------------------
        # DOCUMENT
        # --------------------------------------------------

        if line.startswith("Document:"):

            data["document"] = (
                line.replace(
                    "Document:",
                    "",
                    1
                ).strip()
            )

        # --------------------------------------------------
        # COMPLIANCE FRAMEWORK
        # --------------------------------------------------

        elif line.startswith("Compliance Framework:"):

            data["framework"] = (
                line.replace(
                    "Compliance Framework:",
                    "",
                    1
                ).strip()
            )

        # --------------------------------------------------
        # GENERATED DATE
        # --------------------------------------------------

        elif line.startswith("Report Generated:"):

            data["generated_at"] = (
                line.replace(
                    "Report Generated:",
                    "",
                    1
                ).strip()
            )

        # --------------------------------------------------
        # SCORE
        # --------------------------------------------------

        elif line.startswith("Compliance Score:"):

            score_text = (
                line.replace(
                    "Compliance Score:",
                    "",
                    1
                )
                .strip()
                .replace("%", "")
            )

            try:

                data["score"] = float(
                    score_text
                )

            except ValueError:

                data["score"] = 0.0

        # --------------------------------------------------
        # OVERALL STATUS
        # --------------------------------------------------

        elif line.startswith("Overall Status:"):

            data["overall_status"] = (
                line.replace(
                    "Overall Status:",
                    "",
                    1
                ).strip()
            )

        # --------------------------------------------------
        # TOTAL REQUIREMENTS
        # --------------------------------------------------

        elif line.startswith("Total Requirements:"):

            try:

                data["total_requirements"] = int(
                    line.replace(
                        "Total Requirements:",
                        "",
                        1
                    ).strip()
                )

            except ValueError:

                pass

        # --------------------------------------------------
        # MATCHED REQUIREMENTS
        # --------------------------------------------------

        elif line.startswith("Matched Requirements:"):

            try:

                data["matched_requirements"] = int(
                    line.replace(
                        "Matched Requirements:",
                        "",
                        1
                    ).strip()
                )

            except ValueError:

                pass

        # --------------------------------------------------
        # MISSING REQUIREMENTS
        # --------------------------------------------------

        elif line.startswith("Missing Requirements:"):

            try:

                data["missing_requirements"] = int(
                    line.replace(
                        "Missing Requirements:",
                        "",
                        1
                    ).strip()
                )

            except ValueError:

                pass

        # --------------------------------------------------
        # REQUIREMENT ANALYSIS
        # --------------------------------------------------

        elif line == "COMPLIANCE REQUIREMENT ANALYSIS":

            in_analysis = True
            in_conclusion = False
            in_evidence = False

        # --------------------------------------------------
        # AUDIT CONCLUSION
        # --------------------------------------------------

        elif line == "AUDIT CONCLUSION":

            in_analysis = False
            in_conclusion = True
            in_evidence = False

            if current_requirement:

                if current_evidence:

                    current_requirement["evidence"].append(
                        current_evidence
                    )

                    current_evidence = None

                data["requirements"].append(
                    current_requirement
                )

                current_requirement = None

        # --------------------------------------------------
        # NEW REQUIREMENT
        # --------------------------------------------------

        elif (
            in_analysis
            and re.match(
                r"^\d+\.\s+",
                line
            )
        ):

            requirement_number, title = line.split(
                ". ",
                1
            )

            if current_requirement:

                if current_evidence:

                    current_requirement["evidence"].append(
                        current_evidence
                    )

                    current_evidence = None

                data["requirements"].append(
                    current_requirement
                )

            current_requirement = {

                "title":
                    title.strip(),

                "category":
                    "",

                "severity":
                    "",

                "status":
                    "",

                "explanation":
                    "",

                "recommendation":
                    "",

                "evidence":
                    []

            }

            in_evidence = False

        # --------------------------------------------------
        # REQUIREMENT DETAILS
        # --------------------------------------------------

        elif in_analysis and current_requirement:

            # ----------------------------------------------
            # SUPPORTING EVIDENCE
            # ----------------------------------------------

            if line == "SUPPORTING EVIDENCE":

                in_evidence = True

                if current_evidence:

                    current_requirement["evidence"].append(
                        current_evidence
                    )

                    current_evidence = None

            # ----------------------------------------------
            # EVIDENCE NUMBER
            # ----------------------------------------------

            elif (
                in_evidence
                and re.match(
                    r"^Evidence\s+\d+$",
                    line
                )
            ):

                if current_evidence:

                    current_requirement["evidence"].append(
                        current_evidence
                    )

                evidence_number = (
                    line.replace(
                        "Evidence",
                        "",
                        1
                    ).strip()
                )

                current_evidence = {

                    "evidence_number":
                        int(evidence_number),

                    "similarity_score":
                        0.0,

                    "text":
                        ""

                }

            # ----------------------------------------------
            # SIMILARITY SCORE
            # ----------------------------------------------

            elif (
                in_evidence
                and line.startswith(
                    "Similarity Score:"
                )
            ):

                if current_evidence:

                    score_text = (
                        line.replace(
                            "Similarity Score:",
                            "",
                            1
                        )
                        .strip()
                        .replace("%", "")
                    )

                    try:

                        current_evidence[
                            "similarity_score"
                        ] = float(score_text)

                    except ValueError:

                        pass

            # ----------------------------------------------
            # EVIDENCE PASSAGE
            # ----------------------------------------------

            elif (
                in_evidence
                and line.startswith(
                    "Evidence Passage:"
                )
            ):

                if current_evidence:

                    current_evidence["text"] = (
                        line.replace(
                            "Evidence Passage:",
                            "",
                            1
                        ).strip()
                    )

            # ----------------------------------------------
            # CONTINUED EVIDENCE TEXT
            # ----------------------------------------------

            elif (
                in_evidence
                and current_evidence
                and not line.startswith(
                    "Evidence "
                )
                and not line.startswith(
                    "Similarity Score:"
                )
            ):

                current_evidence["text"] += (
                    " " + line
                )

            # ----------------------------------------------
            # REQUIREMENT METADATA
            # ----------------------------------------------

            elif not in_evidence:

                if line.startswith("Category:"):

                    current_requirement["category"] = (
                        line.replace(
                            "Category:",
                            "",
                            1
                        ).strip()
                    )

                elif line.startswith("Severity:"):

                    current_requirement["severity"] = (
                        line.replace(
                            "Severity:",
                            "",
                            1
                        ).strip()
                    )

                elif line.startswith("Status:"):

                    current_requirement["status"] = (
                        line.replace(
                            "Status:",
                            "",
                            1
                        ).strip()
                    )

                elif line.startswith("Explanation:"):

                    current_requirement["explanation"] = (
                        line.replace(
                            "Explanation:",
                            "",
                            1
                        ).strip()
                    )

                elif line.startswith("Recommendation:"):

                    current_requirement["recommendation"] = (
                        line.replace(
                            "Recommendation:",
                            "",
                            1
                        ).strip()
                    )

        # --------------------------------------------------
        # AUDIT CONCLUSION CONTENT
        # --------------------------------------------------

        elif in_conclusion:

            if not line.startswith(
                "EVIDENCE TRACEABILITY"
            ) and not line.startswith(
                "This report was generated"
            ):

                data["conclusion"] += (
                    line + " "
                )

    # ======================================================
    # FINAL REQUIREMENT
    # ======================================================

    if current_requirement:

        if current_evidence:

            current_requirement["evidence"].append(
                current_evidence
            )

        data["requirements"].append(
            current_requirement
        )

    # ======================================================
    # CLEAN CONCLUSION
    # ======================================================

    data["conclusion"] = (
        data["conclusion"]
        .replace(
            "EVIDENCE TRACEABILITY",
            ""
        )
        .strip()
    )

    # ======================================================
    # FALLBACK OVERALL STATUS
    # ======================================================

    if not data["overall_status"]:

        data["overall_status"] = (
            get_overall_status(
                data["score"]
            )
        )

    return data


# ==========================================================
# GENERATE PDF
# ==========================================================

def generate_audit_report_pdf(
    report_content: str
):
    """
    Generate a professional PDF audit report
    from the generated audit report content.

    The PDF includes the selected compliance framework
    as part of the document information section.
    """

    data = parse_report_content(
        report_content
    )

    pdf_buffer = BytesIO()

    # ======================================================
    # PDF DOCUMENT
    # ======================================================

    document = SimpleDocTemplate(

        pdf_buffer,

        pagesize=A4,

        rightMargin=
            18 * mm,

        leftMargin=
            18 * mm,

        topMargin=
            18 * mm,

        bottomMargin=
            18 * mm

    )

    styles = getSampleStyleSheet()

    # ======================================================
    # STYLES
    # ======================================================

    title_style = ParagraphStyle(

        "ReguAITitle",

        parent=
            styles["Title"],

        fontSize=
            20,

        leading=
            24,

        alignment=
            TA_CENTER,

        spaceAfter=
            8

    )

    subtitle_style = ParagraphStyle(

        "ReguAISubtitle",

        parent=
            styles["Normal"],

        fontSize=
            9,

        leading=
            12,

        alignment=
            TA_CENTER,

        spaceAfter=
            18

    )

    heading_style = ParagraphStyle(

        "ReguAIHeading",

        parent=
            styles["Heading2"],

        fontSize=
            13,

        leading=
            16,

        spaceBefore=
            10,

        spaceAfter=
            8

    )

    body_style = ParagraphStyle(

        "ReguAIBody",

        parent=
            styles["BodyText"],

        fontSize=
            9,

        leading=
            13,

        spaceAfter=
            5

    )

    small_style = ParagraphStyle(

        "ReguAISmall",

        parent=
            styles["BodyText"],

        fontSize=
            8,

        leading=
            11

    )

    evidence_heading_style = ParagraphStyle(

        "ReguAIEvidenceHeading",

        parent=
            styles["Heading4"],

        fontSize=
            9,

        leading=
            12,

        spaceBefore=
            5,

        spaceAfter=
            4

    )

    evidence_text_style = ParagraphStyle(

        "ReguAIEvidenceText",

        parent=
            styles["BodyText"],

        fontSize=
            8,

        leading=
            11,

        leftIndent=
            5,

        rightIndent=
            5,

        spaceAfter=
            7

    )

    score_style = ParagraphStyle(

        "ReguAIScore",

        parent=
            styles["Title"],

        fontSize=
            24,

        leading=
            28,

        alignment=
            TA_CENTER

    )

    status_style = ParagraphStyle(

        "ReguAIStatus",

        parent=
            styles["Heading3"],

        fontSize=
            11,

        leading=
            14,

        alignment=
            TA_CENTER

    )

    framework_style = ParagraphStyle(

        "ReguAIFramework",

        parent=
            styles["BodyText"],

        fontSize=
            9,

        leading=
            13

    )

    story = []

    # ======================================================
    # REPORT HEADER
    # ======================================================

    story.append(
        Paragraph(
            "REGUAI",
            title_style
        )
    )

    story.append(
        Paragraph(
            "COMPLIANCE AUDIT REPORT",
            title_style
        )
    )

    story.append(
        Paragraph(
            "AI-Powered Compliance & Regulatory Management",
            subtitle_style
        )
    )

    # ======================================================
    # DOCUMENT INFORMATION
    # ======================================================

    story.append(
        Paragraph(
            "1. DOCUMENT INFORMATION",
            heading_style
        )
    )

    document_data = [

        [

            Paragraph(
                "<b>Document</b>",
                body_style
            ),

            Paragraph(
                safe_text(
                    data["document"] or "N/A"
                ),
                body_style
            )

        ],

        [

            Paragraph(
                "<b>Compliance Framework</b>",
                body_style
            ),

            Paragraph(
                safe_text(
                    data["framework"] or "N/A"
                ),
                framework_style
            )

        ],

        [

            Paragraph(
                "<b>Report Generated</b>",
                body_style
            ),

            Paragraph(
                safe_text(
                    data["generated_at"] or "N/A"
                ),
                body_style
            )

        ]

    ]

    document_table = Table(

        document_data,

        colWidths=[

            45 * mm,

            125 * mm

        ]

    )

    document_table.setStyle(

        TableStyle([

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),

            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.lightgrey
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            )

        ])

    )

    story.append(
        document_table
    )

    story.append(
        Spacer(
            1,
            12
        )
    )

    # ======================================================
    # COMPLIANCE SUMMARY
    # ======================================================

    story.append(
        Paragraph(
            "2. COMPLIANCE SUMMARY",
            heading_style
        )
    )

    score_summary = [

        [

            Paragraph(
                "<b>COMPLIANCE SCORE</b>",
                body_style
            ),

            Paragraph(
                "<b>OVERALL STATUS</b>",
                body_style
            )

        ],

        [

            Paragraph(
                f"{data['score']:.2f}%",
                score_style
            ),

            Paragraph(
                safe_text(
                    data["overall_status"]
                ),
                status_style
            )

        ]

    ]

    score_table = Table(

        score_summary,

        colWidths=[

            85 * mm,

            85 * mm

        ],

        rowHeights=[

            10 * mm,

            22 * mm

        ]

    )

    score_table.setStyle(

        TableStyle([

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.7,
                colors.grey
            ),

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.lightgrey
            ),

            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            )

        ])

    )

    story.append(
        score_table
    )

    story.append(
        Spacer(
            1,
            10
        )
    )

    # ======================================================
    # SUMMARY COUNTS
    # ======================================================

    summary_data = [

        [

            Paragraph(
                "<b>Total Requirements</b>",
                small_style
            ),

            Paragraph(
                "<b>Matched</b>",
                small_style
            ),

            Paragraph(
                "<b>Missing</b>",
                small_style
            )

        ],

        [

            str(
                data["total_requirements"]
            ),

            str(
                data["matched_requirements"]
            ),

            str(
                data["missing_requirements"]
            )

        ]

    ]

    summary_table = Table(

        summary_data,

        colWidths=[

            56 * mm,

            56 * mm,

            56 * mm

        ]

    )

    summary_table.setStyle(

        TableStyle([

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.lightgrey
            ),

            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),

            (
                "FONTSIZE",
                (0, 1),
                (-1, 1),
                14
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            )

        ])

    )

    story.append(
        summary_table
    )

    story.append(
        Spacer(
            1,
            12
        )
    )

    # ======================================================
    # REQUIREMENT ANALYSIS
    # ======================================================

    story.append(
        Paragraph(
            "3. COMPLIANCE REQUIREMENT ANALYSIS",
            heading_style
        )
    )

    if not data["requirements"]:

        story.append(
            Paragraph(
                "No compliance requirements were available "
                "for analysis.",
                body_style
            )
        )

    else:

        for index, requirement in enumerate(
            data["requirements"],
            start=1
        ):

            requirement_block = []

            # --------------------------------------------------
            # REQUIREMENT TITLE
            # --------------------------------------------------

            requirement_block.append(

                Paragraph(

                    f"{index}. "
                    f"{safe_text(requirement['title'])}",

                    ParagraphStyle(

                        f"RequirementTitle{index}",

                        parent=
                            styles["Heading3"],

                        fontSize=
                            10,

                        leading=
                            13,

                        spaceBefore=
                            7,

                        spaceAfter=
                            5

                    )

                )

            )

            # --------------------------------------------------
            # REQUIREMENT METADATA
            # --------------------------------------------------

            requirement_data = [

                [

                    Paragraph(
                        "<b>Category</b>",
                        small_style
                    ),

                    Paragraph(
                        safe_text(
                            requirement["category"]
                            or "N/A"
                        ),
                        small_style
                    ),

                    Paragraph(
                        "<b>Severity</b>",
                        small_style
                    ),

                    Paragraph(
                        safe_text(
                            requirement["severity"]
                            or "N/A"
                        ),
                        small_style
                    )

                ],

                [

                    Paragraph(
                        "<b>Status</b>",
                        small_style
                    ),

                    Paragraph(
                        safe_text(
                            requirement["status"]
                            or "N/A"
                        ),
                        small_style
                    ),

                    "",

                    ""

                ]

            ]

            requirement_table = Table(

                requirement_data,

                colWidths=[

                    25 * mm,

                    60 * mm,

                    25 * mm,

                    60 * mm

                ]

            )

            requirement_table.setStyle(

                TableStyle([

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey
                    ),

                    (
                        "BACKGROUND",
                        (0, 0),
                        (0, -1),
                        colors.lightgrey
                    ),

                    (
                        "BACKGROUND",
                        (2, 0),
                        (2, -1),
                        colors.lightgrey
                    ),

                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP"
                    ),

                    (
                        "SPAN",
                        (1, 1),
                        (3, 1)
                    ),

                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        5
                    ),

                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        5
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        5
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        5
                    )

                ])

            )

            requirement_block.append(
                requirement_table
            )

            requirement_block.append(
                Spacer(
                    1,
                    5
                )
            )

            # --------------------------------------------------
            # EXPLANATION
            # --------------------------------------------------

            requirement_block.append(

                Paragraph(

                    f"<b>Explanation:</b> "
                    f"{safe_text(
                        requirement['explanation']
                        or 'N/A'
                    )}",

                    body_style

                )

            )

            # --------------------------------------------------
            # RECOMMENDATION
            # --------------------------------------------------

            if requirement["recommendation"]:

                requirement_block.append(

                    Paragraph(

                        f"<b>Recommendation:</b> "
                        f"{safe_text(
                            requirement['recommendation']
                        )}",

                        body_style

                    )

                )

            # --------------------------------------------------
            # SUPPORTING EVIDENCE
            # --------------------------------------------------

            if requirement["evidence"]:

                requirement_block.append(
                    Spacer(
                        1,
                        4
                    )
                )

                requirement_block.append(

                    Paragraph(
                        "<b>SUPPORTING EVIDENCE</b>",
                        evidence_heading_style
                    )

                )

                for evidence in requirement["evidence"]:

                    evidence_number = (
                        evidence.get(
                            "evidence_number",
                            0
                        )
                    )

                    similarity_score = (
                        evidence.get(
                            "similarity_score",
                            0.0
                        )
                    )

                    evidence_text = (
                        evidence.get(
                            "text",
                            ""
                        )
                    )

                    evidence_block = []

                    evidence_block.append(

                        Paragraph(

                            f"<b>Evidence "
                            f"{evidence_number}</b>",

                            evidence_heading_style

                        )

                    )

                    evidence_block.append(

                        Paragraph(

                            f"<b>Similarity Score:</b> "
                            f"{similarity_score:.1f}%",

                            small_style

                        )

                    )

                    evidence_block.append(

                        Paragraph(

                            f"<b>Evidence Passage:</b> "
                            f"{safe_text(evidence_text)}",

                            evidence_text_style

                        )

                    )

                    evidence_table = Table(

                        [

                            [

                                evidence_block

                            ]

                        ],

                        colWidths=[

                            170 * mm

                        ]

                    )

                    evidence_table.setStyle(

                        TableStyle([

                            (
                                "BOX",
                                (0, 0),
                                (-1, -1),
                                0.4,
                                colors.grey
                            ),

                            (
                                "BACKGROUND",
                                (0, 0),
                                (-1, -1),
                                colors.whitesmoke
                            ),

                            (
                                "LEFTPADDING",
                                (0, 0),
                                (-1, -1),
                                7
                            ),

                            (
                                "RIGHTPADDING",
                                (0, 0),
                                (-1, -1),
                                7
                            ),

                            (
                                "TOPPADDING",
                                (0, 0),
                                (-1, -1),
                                6
                            ),

                            (
                                "BOTTOMPADDING",
                                (0, 0),
                                (-1, -1),
                                6
                            )

                        ])

                    )

                    requirement_block.append(
                        evidence_table
                    )

                    requirement_block.append(
                        Spacer(
                            1,
                            5
                        )
                    )

            # --------------------------------------------------
            # ADD REQUIREMENT TO STORY
            # --------------------------------------------------

            story.extend(
                requirement_block
            )

    # ======================================================
    # AUDIT CONCLUSION
    # ======================================================

    story.append(
        Spacer(
            1,
            8
        )
    )

    story.append(
        Paragraph(
            "4. AUDIT CONCLUSION",
            heading_style
        )
    )

    conclusion = data["conclusion"]

    if not conclusion:

        conclusion = (
            "No additional audit conclusion was provided."
        )

    story.append(

        Paragraph(

            safe_text(
                conclusion
            ),

            body_style

        )

    )

    # ======================================================
    # EVIDENCE TRACEABILITY
    # ======================================================

    story.append(
        Spacer(
            1,
            8
        )
    )

    story.append(
        Paragraph(
            "EVIDENCE TRACEABILITY",
            heading_style
        )
    )

    story.append(

        Paragraph(

            "Supporting evidence passages were retrieved "
            "using semantic similarity analysis from the "
            "document. Similarity scores indicate the "
            "relevance of each retrieved passage to its "
            "associated requirement.",

            body_style

        )

    )

    # ======================================================
    # FOOTER MESSAGE
    # ======================================================

    story.append(
        Spacer(
            1,
            15
        )
    )

    story.append(

        Paragraph(

            "This report was generated by ReguAI.",

            subtitle_style

        )

    )

    # ======================================================
    # BUILD PDF
    # ======================================================

    document.build(
        story
    )

    pdf_buffer.seek(0)

    return pdf_buffer