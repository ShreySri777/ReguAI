import { useEffect, useMemo, useState } from "react";

import { NavLink, useParams } from "react-router-dom";

import "./DocumentDetails.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function DocumentDetails() {
  const { documentId } = useParams();

  const [document, setDocument] = useState(null);
  const [summary, setSummary] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [evidenceHistory, setEvidenceHistory] = useState([]);

  // ==========================================================
  // PERSISTED RISK HISTORY
  // ==========================================================

  const [riskHistory, setRiskHistory] = useState([]);
  const [riskHistoryLoading, setRiskHistoryLoading] =
    useState(false);
  const [riskHistoryError, setRiskHistoryError] =
    useState("");

  // ==========================================================
  // PERSISTED AUDIT HISTORY
  // ==========================================================

  const [auditHistory, setAuditHistory] = useState([]);
  const [auditHistoryLoading, setAuditHistoryLoading] =
    useState(false);
  const [auditHistoryError, setAuditHistoryError] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [error, setError] = useState("");

  const [expandedRun, setExpandedRun] = useState(null);
  const [expandedEvidence, setExpandedEvidence] = useState({});

  // ==========================================================
  // LOAD RISK HISTORY
  // ==========================================================

  const fetchRiskHistory = async () => {
    try {
      setRiskHistoryLoading(true);
      setRiskHistoryError("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/compliance-risks`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setRiskHistory([]);
          return;
        }

        throw new Error(
          "Unable to load compliance risk history."
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setRiskHistory(data);
      } else if (Array.isArray(data.risks)) {
        setRiskHistory(data.risks);
      } else if (Array.isArray(data.risk_history)) {
        setRiskHistory(data.risk_history);
      } else if (Array.isArray(data.records)) {
        setRiskHistory(data.records);
      } else {
        setRiskHistory([]);
      }
    } catch (err) {
      console.error(err);

      setRiskHistoryError(
        err.message ||
          "Unable to load compliance risk history."
      );

      setRiskHistory([]);
    } finally {
      setRiskHistoryLoading(false);
    }
  };

  // ==========================================================
  // LOAD AUDIT HISTORY
  // ==========================================================

  const fetchAuditHistory = async () => {
    try {
      setAuditHistoryLoading(true);
      setAuditHistoryError("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/audit-reports`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setAuditHistory([]);
          return;
        }

        throw new Error(
          "Unable to load audit report history."
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setAuditHistory(data);
      } else if (Array.isArray(data.reports)) {
        setAuditHistory(data.reports);
      } else if (Array.isArray(data.audit_reports)) {
        setAuditHistory(data.audit_reports);
      } else {
        setAuditHistory([]);
      }
    } catch (err) {
      console.error(err);

      setAuditHistoryError(
        err.message ||
          "Unable to load audit report history."
      );

      setAuditHistory([]);
    } finally {
      setAuditHistoryLoading(false);
    }
  };

  // ==========================================================
  // LOAD DOCUMENT DETAILS
  // ==========================================================

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const documentResponse = await fetch(
        `${API_BASE_URL}/documents/${documentId}`
      );

      if (!documentResponse.ok) {
        throw new Error(
          "Unable to load document information."
        );
      }

      const documentData =
        await documentResponse.json();

      setDocument(documentData);

      // ------------------------------------------------------
      // LOAD COMPLIANCE SUMMARY
      // ------------------------------------------------------

      try {
        const summaryResponse = await fetch(
          `${API_BASE_URL}/documents/${documentId}/compliance-summary`
        );

        if (summaryResponse.ok) {
          const summaryData =
            await summaryResponse.json();

          setSummary(summaryData);
        } else {
          setSummary(null);
        }
      } catch {
        setSummary(null);
      }

      // ------------------------------------------------------
      // LOAD COMPLIANCE GAPS
      // ------------------------------------------------------

      try {
        const gapsResponse = await fetch(
          `${API_BASE_URL}/documents/${documentId}/compliance-gaps`
        );

        if (gapsResponse.ok) {
          const gapsData =
            await gapsResponse.json();

          if (Array.isArray(gapsData)) {
            setGaps(gapsData);
          } else if (Array.isArray(gapsData.gaps)) {
            setGaps(gapsData.gaps);
          } else {
            setGaps([]);
          }
        } else {
          setGaps([]);
        }
      } catch {
        setGaps([]);
      }

      // ------------------------------------------------------
      // LOAD EVIDENCE HISTORY
      // ------------------------------------------------------

      try {
        const evidenceResponse = await fetch(
          `${API_BASE_URL}/documents/${documentId}/compliance-evidence`
        );

        if (evidenceResponse.ok) {
          const evidenceData =
            await evidenceResponse.json();

          if (
            Array.isArray(evidenceData.evidence)
          ) {
            setEvidenceHistory(
              evidenceData.evidence
            );
          } else {
            setEvidenceHistory([]);
          }
        } else {
          setEvidenceHistory([]);
        }
      } catch {
        setEvidenceHistory([]);
      }

      // ------------------------------------------------------
      // LOAD PERSISTED RISK HISTORY
      // ------------------------------------------------------

      await fetchRiskHistory();

      // ------------------------------------------------------
      // LOAD PERSISTED AUDIT HISTORY
      // ------------------------------------------------------

      await fetchAuditHistory();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load document details. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentDetails();
  }, [documentId]);

  // ==========================================================
  // GROUP EVIDENCE BY COMPLIANCE RUN
  // ==========================================================

  const complianceRuns = useMemo(() => {
    const runs = {};

    evidenceHistory.forEach((evidence) => {
      const runId =
        evidence.check_run_id || "legacy-run";

      if (!runs[runId]) {
        runs[runId] = {
          check_run_id: runId,
          evidence: [],
          created_at:
            evidence.created_at || null
        };
      }

      runs[runId].evidence.push(evidence);

      if (
        evidence.created_at &&
        (!runs[runId].created_at ||
          new Date(evidence.created_at) >
            new Date(
              runs[runId].created_at
            ))
      ) {
        runs[runId].created_at =
          evidence.created_at;
      }
    });

    return Object.values(runs).sort(
      (a, b) => {
        const dateA = a.created_at
          ? new Date(
              a.created_at
            ).getTime()
          : 0;

        const dateB = b.created_at
          ? new Date(
              b.created_at
            ).getTime()
          : 0;

        return dateB - dateA;
      }
    );
  }, [evidenceHistory]);

  // ==========================================================
  // RUN STATISTICS
  // ==========================================================

  const getRunStatistics = (run) => {
    const matched =
      run.evidence.filter(
        (item) =>
          item.status?.toLowerCase() ===
          "matched"
      ).length;

    const review =
      run.evidence.filter(
        (item) =>
          item.status?.toLowerCase() ===
          "review"
      ).length;

    const missing =
      run.evidence.filter(
        (item) =>
          item.status?.toLowerCase() ===
          "missing"
      ).length;

    const requirements = new Set(
      run.evidence.map(
        (item) =>
          item.requirement_id
      )
    ).size;

    return {
      matched,
      review,
      missing,
      requirements
    };
  };

  // ==========================================================
  // RUN STATUS
  // ==========================================================

  const getRunStatus = (run) => {
    const statistics =
      getRunStatistics(run);

    if (statistics.missing > 0) {
      return {
        text: "Issues Found",
        className: "status-danger"
      };
    }

    if (statistics.review > 0) {
      return {
        text: "Manual Review",
        className: "status-warning"
      };
    }

    if (statistics.matched > 0) {
      return {
        text: "Matched",
        className: "status-success"
      };
    }

    return {
      text: "Analyzed",
      className: "status-neutral"
    };
  };

  // ==========================================================
  // RUN RISK SUMMARY
  // ==========================================================

  const riskSummary = useMemo(() => {
    if (!riskHistory.length) {
      return {
        total: 0,
        totalRisk: 0,
        averageRisk: 0,
        highestRisk: 0,
        overallRiskLevel: "minimal"
      };
    }

    const totalRisk = riskHistory.reduce(
      (sum, item) =>
        sum +
        Number(
          item.risk_score || 0
        ),
      0
    );

    const highestRisk =
      Math.max(
        ...riskHistory.map(
          (item) =>
            Number(
              item.risk_score || 0
            )
        )
      );

    let overallRiskLevel =
      riskHistory[0]
        ?.overall_risk_level ||
      "";

    if (!overallRiskLevel) {
      if (highestRisk >= 75) {
        overallRiskLevel =
          "critical";
      } else if (
        highestRisk >= 50
      ) {
        overallRiskLevel =
          "high";
      } else if (
        highestRisk >= 25
      ) {
        overallRiskLevel =
          "medium";
      } else if (
        highestRisk > 0
      ) {
        overallRiskLevel =
          "low";
      } else {
        overallRiskLevel =
          "minimal";
      }
    }

    return {
      total: riskHistory.length,
      totalRisk:
        Number(totalRisk.toFixed(2)),
      averageRisk:
        Number(
          (
            totalRisk /
            riskHistory.length
          ).toFixed(2)
        ),
      highestRisk,
      overallRiskLevel
    };
  }, [riskHistory]);

  // ==========================================================
  // RISK LEVEL HELPERS
  // ==========================================================

  const getRiskLevelClass = (level) => {
    switch (
      level?.toLowerCase()
    ) {
      case "critical":
        return "status-danger";

      case "high":
        return "status-danger";

      case "medium":
        return "status-warning";

      case "low":
        return "status-info";

      case "minimal":
        return "status-success";

      default:
        return "status-neutral";
    }
  };

  const getRiskLevelText = (level) => {
    switch (
      level?.toLowerCase()
    ) {
      case "critical":
        return "Critical";

      case "high":
        return "High";

      case "medium":
        return "Medium";

      case "low":
        return "Low";

      case "minimal":
        return "Minimal";

      default:
        return level || "Unknown";
    }
  };

  // ==========================================================
  // ANALYZE DOCUMENT
  // ==========================================================

  const handleAnalyze = async () => {
    try {
      setActionLoading("analyze");
      setActionMessage("");
      setActionError("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/analyze`,
        {
          method: "POST"
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to analyze the document."
        );
      }

      setActionMessage(
        "Document analyzed successfully."
      );

      await fetchDocumentDetails();
    } catch (err) {
      console.error(err);

      setActionError(
        err.message ||
          "Unable to analyze the document."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================================
  // RUN COMPLIANCE CHECK
  // ==========================================================

  const handleComplianceCheck =
    async () => {
      try {
        setActionLoading(
          "compliance"
        );
        setActionMessage("");
        setActionError("");

        const response =
          await fetch(
            `${API_BASE_URL}/documents/${documentId}/compliance-check`,
            {
              method: "POST"
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to run compliance check."
          );
        }

        setActionMessage(
          "Compliance check completed successfully."
        );

        await fetchDocumentDetails();
      } catch (err) {
        console.error(err);

        setActionError(
          err.message ||
            "Unable to run compliance check."
        );
      } finally {
        setActionLoading("");
      }
    };

  // ==========================================================
  // GENERATE AUDIT REPORT
  // ==========================================================

  const handleGenerateReport =
    async () => {
      try {
        setActionLoading(
          "report"
        );
        setActionMessage("");
        setActionError("");

        const response =
          await fetch(
            `${API_BASE_URL}/documents/${documentId}/audit-report`,
            {
              method: "POST"
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to generate audit report."
          );
        }

        setActionMessage(
          "Audit report generated successfully."
        );

        // Refresh persisted audit history
        await fetchAuditHistory();
      } catch (err) {
        console.error(err);

        setActionError(
          err.message ||
            "Unable to generate audit report."
        );
      } finally {
        setActionLoading("");
      }
    };

  // ==========================================================
  // DOWNLOAD PDF REPORT
  // ==========================================================

  const handleDownloadReport =
    () => {
      window.open(
        `${API_BASE_URL}/documents/${documentId}/audit-report/pdf`,
        "_blank"
      );
    };

  // ==========================================================
  // DOWNLOAD SPECIFIC AUDIT REPORT
  // ==========================================================

  const handleDownloadAuditReport =
    (reportId) => {
      // The backend currently exposes the document-level
      // PDF endpoint, so use it for the selected document.
      window.open(
        `${API_BASE_URL}/documents/${documentId}/audit-report/pdf`,
        "_blank"
      );
    };

  // ==========================================================
  // STATUS HELPERS
  // ==========================================================

  const getStatusText = (status) => {
    switch (status) {
      case "uploaded":
        return "Uploaded";

      case "analyzed":
        return "Analyzed";

      case "compliance_checked":
        return "Compliance Checked";

      default:
        return status || "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "uploaded":
        return "status-warning";

      case "analyzed":
        return "status-info";

      case "compliance_checked":
        return "status-success";

      default:
        return "status-neutral";
    }
  };

  const getOverallStatusClass =
    (status) => {
      switch (status) {
        case "Fully Compliant":
          return "status-success";

        case "Mostly Compliant":
          return "status-info";

        case "Partially Compliant":
          return "status-warning";

        case "Non-Compliant":
          return "status-danger";

        default:
          return "status-neutral";
      }
    };

  const getSeverityClass =
    (severity) => {
      switch (
        severity?.toLowerCase()
      ) {
        case "critical":
          return "severity-critical";

        case "high":
          return "severity-high";

        case "medium":
          return "severity-medium";

        case "low":
          return "severity-low";

        default:
          return "severity-medium";
      }
    };

  // ==========================================================
  // EVIDENCE STATUS HELPERS
  // ==========================================================

  const getEvidenceStatusClass =
    (status) => {
      switch (
        status?.toLowerCase()
      ) {
        case "matched":
          return "status-success";

        case "review":
          return "status-warning";

        case "missing":
          return "status-danger";

        default:
          return "status-neutral";
      }
    };

  const getEvidenceStatusText =
    (status) => {
      switch (
        status?.toLowerCase()
      ) {
        case "matched":
          return "Matched";

        case "review":
          return "Manual Review";

        case "missing":
          return "Missing";

        default:
          return (
            status || "Unknown"
          );
      }
    };

  // ==========================================================
  // TOGGLE EVIDENCE
  // ==========================================================

  const toggleEvidence =
    (evidenceId) => {
      setExpandedEvidence(
        (previous) => ({
          ...previous,
          [evidenceId]:
            !previous[evidenceId]
        })
      );
    };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <div className="details-page">
        <div className="page-loading">
          <div className="loading-spinner"></div>

          <p>
            Loading document details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (error || !document) {
    return (
      <div className="details-page">
        <div className="document-error">
          <div className="error-icon">
            ⚠
          </div>

          <h3>
            Unable to load document
          </h3>

          <p>
            {error ||
              "Document not found."}
          </p>

          <NavLink
            to="/documents"
            className="primary-button"
          >
            ← Back to Documents
          </NavLink>
        </div>
      </div>
    );
  }

  // ==========================================================
  // DOCUMENT DATA
  // ==========================================================

  const score =
    summary?.score ?? 0;

  const totalRequirements =
    summary?.total_requirements ??
    0;

  const matchedRequirements =
    summary?.matched_requirements ??
    0;

  const missingRequirements =
    summary?.missing_requirements ??
    gaps.length;

  const overallStatus =
    summary?.overall_status ||
    "Not Checked";

  const isUploaded =
    document.status ===
    "uploaded";

  const isAnalyzed =
    document.status ===
    "analyzed";

  const isComplianceChecked =
    document.status ===
    "compliance_checked";

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div className="details-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <NavLink to="/documents">
              Documents
            </NavLink>

            <span>
              /
            </span>

            <span>
              Document Details
            </span>
          </div>

          <h1>
            Document Details
          </h1>

          <p>
            Review and manage the compliance workflow
            for this document.
          </p>
        </div>

        <NavLink
          to="/documents"
          className="secondary-button"
        >
          ← Back to Documents
        </NavLink>
      </div>

      {/* =====================================================
          ACTION MESSAGES
      ===================================================== */}

      {actionMessage && (
        <div className="success-message">
          ✓ {actionMessage}
        </div>
      )}

      {actionError && (
        <div className="error-message">
          ⚠ {actionError}
        </div>
      )}

      {/* =====================================================
          DOCUMENT HEADER
      ===================================================== */}

      <section className="dashboard-card document-details-header">
        <div className="details-document-main">
          <div className="details-document-icon">
            📄
          </div>

          <div>
            <h2>
              {document.filename}
            </h2>

            <p>
              Document #{document.id}
            </p>
          </div>
        </div>

        <span
          className={`document-status ${getStatusClass(
            document.status
          )}`}
        >
          {getStatusText(
            document.status
          )}
        </span>
      </section>

      {/* =====================================================
          DOCUMENT WORKFLOW
      ===================================================== */}

      <section className="dashboard-card">
        <div className="section-header">
          <div>
            <h2>
              Document Workflow
            </h2>

            <p>
              Process this document through the ReguAI
              compliance pipeline.
            </p>
          </div>
        </div>

        <div className="workflow-actions">

          <div className="workflow-action">
            <div className="workflow-action-icon">
              🔍
            </div>

            <div className="workflow-action-content">
              <h3>
                Analyze Document
              </h3>

              <p>
                Extract text from the PDF and analyze
                its compliance-related content.
              </p>

              <button
                className="primary-button"
                onClick={handleAnalyze}
                disabled={
                  actionLoading !== "" ||
                  !isUploaded
                }
              >
                {actionLoading ===
                "analyze"
                  ? "Analyzing..."
                  : isUploaded
                    ? "Analyze Document"
                    : "Already Analyzed"}
              </button>
            </div>
          </div>

          <div className="workflow-action">
            <div className="workflow-action-icon">
              ✓
            </div>

            <div className="workflow-action-content">
              <h3>
                Compliance Check
              </h3>

              <p>
                Compare the extracted document against
                the configured compliance requirements.
              </p>

              <button
                className="primary-button"
                onClick={
                  handleComplianceCheck
                }
                disabled={
                  actionLoading !== "" ||
                  (
                    !isAnalyzed &&
                    !isComplianceChecked
                  )
                }
              >
                {actionLoading ===
                "compliance"
                  ? "Checking..."
                  : isComplianceChecked
                    ? "Run Again"
                    : "Run Compliance Check"}
              </button>
            </div>
          </div>

          <div className="workflow-action">
            <div className="workflow-action-icon">
              📊
            </div>

            <div className="workflow-action-content">
              <h3>
                Audit Report
              </h3>

              <p>
                Generate a professional audit report
                from the compliance assessment.
              </p>

              <button
                className="primary-button"
                onClick={
                  handleGenerateReport
                }
                disabled={
                  actionLoading !== "" ||
                  !isComplianceChecked
                }
              >
                {actionLoading ===
                "report"
                  ? "Generating..."
                  : "Generate Audit Report"}
              </button>
            </div>
          </div>
        </div>

        {isComplianceChecked && (
          <div className="workflow-download">
            <div>
              <strong>
                Audit report available
              </strong>

              <span>
                Download the generated PDF report.
              </span>
            </div>

            <button
              className="secondary-button"
              onClick={
                handleDownloadReport
              }
            >
              📥 Download PDF Report
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          DOCUMENT INFORMATION
      ===================================================== */}

      <section className="dashboard-card">
        <div className="section-header">
          <div>
            <h2>
              Document Information
            </h2>

            <p>
              Basic information about this compliance
              document.
            </p>
          </div>
        </div>

        <div className="details-info-grid">
          <div className="details-info-item">
            <span>
              File Name
            </span>

            <strong>
              {document.filename}
            </strong>
          </div>

          <div className="details-info-item">
            <span>
              Document ID
            </span>

            <strong>
              #{document.id}
            </strong>
          </div>

          <div className="details-info-item">
            <span>
              File Type
            </span>

            <strong>
              {document.file_type?.toUpperCase() ||
                "PDF"}
            </strong>
          </div>

          <div className="details-info-item">
            <span>
              Uploaded
            </span>

            <strong>
              {document.uploaded_at
                ? new Date(
                    document.uploaded_at
                  ).toLocaleString()
                : "Unknown"}
            </strong>
          </div>

          <div className="details-info-item">
            <span>
              Processing Status
            </span>

            <strong>
              {getStatusText(
                document.status
              )}
            </strong>
          </div>

          <div className="details-info-item">
            <span>
              Extracted Text
            </span>

            <strong>
              {document.extracted_text
                ? `${document.extracted_text.length.toLocaleString()} characters`
                : "Not available"}
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          COMPLIANCE SUMMARY
      ===================================================== */}

      <section className="dashboard-card">
        <div className="section-header">
          <div>
            <h2>
              Compliance Summary
            </h2>

            <p>
              Compliance performance for this document.
            </p>
          </div>

          <span
            className={`document-status ${getOverallStatusClass(
              overallStatus
            )}`}
          >
            {overallStatus}
          </span>
        </div>

        <div className="details-compliance-grid">
          <div className="details-score-card">
            <div className="details-score-circle">
              <strong>
                {score.toFixed(1)}%
              </strong>

              <span>
                Compliance Score
              </span>
            </div>
          </div>

          <div className="details-summary-stat">
            <div className="summary-stat-icon blue">
              📋
            </div>

            <div>
              <span>
                Total Requirements
              </span>

              <strong>
                {totalRequirements}
              </strong>
            </div>
          </div>

          <div className="details-summary-stat">
            <div className="summary-stat-icon green">
              ✓
            </div>

            <div>
              <span>
                Matched
              </span>

              <strong>
                {matchedRequirements}
              </strong>
            </div>
          </div>

          <div className="details-summary-stat">
            <div className="summary-stat-icon orange">
              ⚠
            </div>

            <div>
              <span>
                Missing
              </span>

              <strong>
                {missingRequirements}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          COMPLIANCE GAPS
      ===================================================== */}

      <section className="dashboard-card">
        <div className="section-header">
          <div>
            <h2>
              Compliance Gaps
            </h2>

            <p>
              Requirements that were not satisfied by
              this document.
            </p>
          </div>

          <span className="live-badge">
            {gaps.length} GAPS
          </span>
        </div>

        {gaps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No compliance gaps detected
            </h3>

            <p>
              This document currently has no stored
              compliance gaps.
            </p>
          </div>
        ) : (
          <div className="details-gaps-list">
            {gaps.map(
              (gap, index) => (
                <div
                  className="details-gap-card"
                  key={
                    gap.id ||
                    index
                  }
                >
                  <div className="details-gap-header">
                    <div>
                      <span className="gap-number">
                        Gap{" "}
                        {index + 1}
                      </span>

                      <h3>
                        Requirement #
                        {
                          gap.requirement_id
                        }
                      </h3>
                    </div>

                    <span
                      className={`severity-badge ${getSeverityClass(
                        gap.severity
                      )}`}
                    >
                      {gap.severity ||
                        "Missing"}
                    </span>
                  </div>

                  <div className="details-gap-content">
                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {gap.status ||
                          "Missing"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Explanation
                      </span>

                      <p>
                        {gap.explanation ||
                          "No explanation available."}
                      </p>
                    </div>

                    {gap.recommendation && (
                      <div>
                        <span>
                          Recommendation
                        </span>

                        <p>
                          {
                            gap.recommendation
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          COMPLIANCE HISTORY
      ===================================================== */}

      <section className="dashboard-card">

        <div className="section-header">
          <div>
            <h2>
              Compliance History
            </h2>

            <p>
              Previous compliance checks preserved for
              audit traceability.
            </p>
          </div>

          <span className="live-badge">
            {complianceRuns.length} RUNS
          </span>
        </div>

        {complianceRuns.length ===
        0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🕒
            </div>

            <h3>
              No compliance history available
            </h3>

            <p>
              Run a compliance check to create the first
              history record.
            </p>
          </div>
        ) : (
          <div
            className="details-history-list"
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: "12px"
            }}
          >

            {complianceRuns.map(
              (
                run,
                runIndex
              ) => {
                const statistics =
                  getRunStatistics(
                    run
                  );

                const runStatus =
                  getRunStatus(
                    run
                  );

                const isExpanded =
                  expandedRun ===
                  run.check_run_id;

                const isLatest =
                  runIndex === 0;

                return (
                  <div
                    key={
                      run.check_run_id
                    }
                    className="compliance-history-run"
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      borderRadius:
                        "12px",
                      overflow:
                        "hidden",
                      background:
                        "#ffffff"
                    }}
                  >

                    {/* RUN HEADER */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRun(
                          isExpanded
                            ? null
                            : run.check_run_id
                        )
                      }
                      style={{
                        width:
                          "100%",
                        border:
                          "none",
                        background:
                          "#ffffff",
                        cursor:
                          "pointer",
                        padding:
                          "16px 18px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        textAlign:
                          "left"
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "12px",
                          minWidth:
                            0
                        }}
                      >

                        <div
                          style={{
                            width:
                              "38px",
                            height:
                              "38px",
                            borderRadius:
                              "10px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              isLatest
                                ? "#eff6ff"
                                : "#f8fafc",
                            flexShrink:
                              0,
                            fontSize:
                              "17px"
                          }}
                        >
                          {isLatest
                            ? "⚡"
                            : "🕒"}
                        </div>

                        <div
                          style={{
                            minWidth:
                              0
                          }}
                        >

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                              flexWrap:
                                "wrap"
                            }}
                          >

                            <h3
                              style={{
                                margin: 0,
                                fontSize:
                                  "15px",
                                fontWeight:
                                  600,
                                color:
                                  "#111827"
                              }}
                            >
                              Compliance Check #
                              {complianceRuns.length -
                                runIndex}
                            </h3>

                            {isLatest && (
                              <span
                                style={{
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    600,
                                  padding:
                                    "3px 7px",
                                  borderRadius:
                                    "999px",
                                  background:
                                    "#eff6ff",
                                  color:
                                    "#2563eb"
                                }}
                              >
                                Latest
                              </span>
                            )}

                          </div>

                          <p
                            style={{
                              margin:
                                "4px 0 0",
                              fontSize:
                                "12px",
                              color:
                                "#6b7280"
                            }}
                          >
                            {run.created_at
                              ? new Date(
                                  run.created_at
                                ).toLocaleString()
                              : "Unknown date"}
                          </p>

                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "10px",
                          flexShrink:
                            0
                        }}
                      >

                        <span
                          className={`document-status ${runStatus.className}`}
                        >
                          {runStatus.text}
                        </span>

                        <span
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#6b7280"
                          }}
                        >
                          {isExpanded
                            ? "▲"
                            : "▼"}
                        </span>

                      </div>

                    </button>

                    {/* COMPACT RUN SUMMARY */}

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(5, minmax(0, 1fr))",
                        borderTop:
                          "1px solid #f1f5f9",
                        background:
                          "#fafafa"
                      }}
                    >

                      <div
                        style={{
                          padding:
                            "11px 14px",
                          borderRight:
                            "1px solid #f1f5f9"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.04em"
                          }}
                        >
                          Requirements
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "14px",
                            color:
                              "#111827"
                          }}
                        >
                          {
                            statistics.requirements
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          padding:
                            "11px 14px",
                          borderRight:
                            "1px solid #f1f5f9"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.04em"
                          }}
                        >
                          Evidence
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "14px",
                            color:
                              "#111827"
                          }}
                        >
                          {
                            run.evidence.length
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          padding:
                            "11px 14px",
                          borderRight:
                            "1px solid #f1f5f9"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.04em"
                          }}
                        >
                          Matched
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "14px",
                            color:
                              "#16a34a"
                          }}
                        >
                          {
                            statistics.matched
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          padding:
                            "11px 14px",
                          borderRight:
                            "1px solid #f1f5f9"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.04em"
                          }}
                        >
                          Review
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "14px",
                            color:
                              "#d97706"
                          }}
                        >
                          {
                            statistics.review
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          padding:
                            "11px 14px"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.04em"
                          }}
                        >
                          Missing
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "14px",
                            color:
                              "#dc2626"
                          }}
                        >
                          {
                            statistics.missing
                          }
                        </strong>
                      </div>

                    </div>

                    {/* EXPANDED DETAILS */}

                    {isExpanded && (
                      <div
                        style={{
                          padding:
                            "16px",
                          borderTop:
                            "1px solid #e5e7eb",
                          background:
                            "#ffffff"
                        }}
                      >

                        {/* RUN ID */}

                        <div
                          style={{
                            display:
                              "flex",
                            flexDirection:
                              "column",
                            gap: "5px",
                            marginBottom:
                              "14px"
                          }}
                        >

                          <span
                            style={{
                              fontSize:
                                "11px",
                              fontWeight:
                                600,
                              color:
                                "#6b7280",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.04em"
                            }}
                          >
                            Check Run ID
                          </span>

                          <code
                            style={{
                              display:
                                "block",
                              padding:
                                "9px 11px",
                              background:
                                "#f8fafc",
                              border:
                                "1px solid #e5e7eb",
                              borderRadius:
                                "7px",
                              fontSize:
                                "11px",
                              color:
                                "#475569",
                              overflowX:
                                "auto"
                            }}
                          >
                            {
                              run.check_run_id
                            }
                          </code>

                        </div>

                        {/* EVIDENCE */}

                        <div
                          style={{
                            display:
                              "flex",
                            flexDirection:
                              "column",
                            gap: "8px"
                          }}
                        >

                          {run.evidence.map(
                            (
                              evidence,
                              evidenceIndex
                            ) => {
                              const similarity =
                                Number(
                                  evidence.similarity_score ||
                                    0
                                );

                              const evidenceKey =
                                evidence.id ||
                                `${run.check_run_id}-${evidenceIndex}`;

                              const isEvidenceExpanded =
                                Boolean(
                                  expandedEvidence[
                                    evidenceKey
                                  ]
                                );

                              return (
                                <div
                                  key={
                                    evidenceKey
                                  }
                                  style={{
                                    border:
                                      "1px solid #e5e7eb",
                                    borderRadius:
                                      "9px",
                                    overflow:
                                      "hidden",
                                    background:
                                      "#ffffff"
                                  }}
                                >

                                  <div
                                    style={{
                                      padding:
                                        "12px 14px",
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "space-between",
                                      gap:
                                        "12px"
                                    }}
                                  >

                                    <div
                                      style={{
                                        minWidth:
                                          0
                                      }}
                                    >

                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          gap:
                                            "8px",
                                          flexWrap:
                                            "wrap"
                                        }}
                                      >

                                        <strong
                                          style={{
                                            fontSize:
                                              "13px",
                                            color:
                                              "#111827"
                                          }}
                                        >
                                          Evidence{" "}
                                          {evidence.evidence_number ||
                                            evidenceIndex +
                                              1}
                                        </strong>

                                        <span
                                          style={{
                                            fontSize:
                                              "12px",
                                            color:
                                              "#6b7280"
                                          }}
                                        >
                                          Requirement #
                                          {
                                            evidence.requirement_id
                                          }
                                        </span>

                                      </div>

                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          gap:
                                            "14px",
                                          marginTop:
                                            "5px"
                                        }}
                                      >

                                        <span
                                          style={{
                                            fontSize:
                                              "11px",
                                            color:
                                              "#6b7280"
                                          }}
                                        >
                                          Similarity{" "}
                                          <strong
                                            style={{
                                              color:
                                                "#374151"
                                            }}
                                          >
                                            {(
                                              similarity *
                                              100
                                            ).toFixed(
                                              1
                                            )}
                                            %
                                          </strong>
                                        </span>

                                        <span
                                          style={{
                                            fontSize:
                                              "11px",
                                            color:
                                              "#9ca3af"
                                          }}
                                        >
                                          {evidence.created_at
                                            ? new Date(
                                                evidence.created_at
                                              ).toLocaleString()
                                            : "Unknown"}
                                        </span>

                                      </div>

                                    </div>

                                    <span
                                      className={`document-status ${getEvidenceStatusClass(
                                        evidence.status
                                      )}`}
                                    >
                                      {getEvidenceStatusText(
                                        evidence.status
                                      )}
                                    </span>

                                  </div>

                                  <div
                                    style={{
                                      padding:
                                        "0 14px 12px"
                                    }}
                                  >

                                    <div
                                      style={{
                                        marginBottom:
                                          "10px"
                                      }}
                                    >

                                      <span
                                        style={{
                                          display:
                                            "block",
                                          fontSize:
                                            "10px",
                                          fontWeight:
                                            600,
                                          color:
                                            "#9ca3af",
                                          textTransform:
                                            "uppercase",
                                          letterSpacing:
                                            "0.04em",
                                          marginBottom:
                                            "4px"
                                        }}
                                      >
                                        Explanation
                                      </span>

                                      <p
                                        style={{
                                          margin:
                                            0,
                                          fontSize:
                                            "12px",
                                          lineHeight:
                                            1.5,
                                          color:
                                            "#4b5563"
                                        }}
                                      >
                                        {evidence.explanation ||
                                          "No explanation available."}
                                      </p>

                                    </div>

                                    {/* COLLAPSIBLE PASSAGE */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleEvidence(
                                          evidenceKey
                                        )
                                      }
                                      style={{
                                        border:
                                          "none",
                                        background:
                                          "#f8fafc",
                                        borderRadius:
                                          "7px",
                                        width:
                                          "100%",
                                        padding:
                                          "9px 11px",
                                        cursor:
                                          "pointer",
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        justifyContent:
                                          "space-between",
                                        color:
                                          "#475569",
                                        fontSize:
                                          "11px",
                                        fontWeight:
                                          600
                                      }}
                                    >

                                      <span>
                                        Evidence Passage
                                      </span>

                                      <span>
                                        {isEvidenceExpanded
                                          ? "Hide"
                                          : "Show"}
                                      </span>

                                    </button>

                                    {isEvidenceExpanded && (
                                      <div
                                        style={{
                                          marginTop:
                                            "7px",
                                          maxHeight:
                                            "180px",
                                          overflowY:
                                            "auto",
                                          padding:
                                            "10px",
                                          background:
                                            "#f8fafc",
                                          border:
                                            "1px solid #e5e7eb",
                                          borderRadius:
                                            "7px"
                                        }}
                                      >
                                        <pre
                                          style={{
                                            whiteSpace:
                                              "pre-wrap",
                                            wordBreak:
                                              "break-word",
                                            margin:
                                              0,
                                            fontSize:
                                              "11px",
                                            lineHeight:
                                              1.55,
                                            color:
                                              "#475569",
                                            fontFamily:
                                              "inherit"
                                          }}
                                        >
                                          {
                                            evidence.evidence_text
                                          }
                                        </pre>
                                      </div>
                                    )}

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}
      </section>

      {/* =====================================================
          COMPLIANCE RISK ASSESSMENT
      ===================================================== */}

      <section className="dashboard-card">

        <div className="section-header">
          <div>
            <h2>
              ⚠️ Risk Assessment
            </h2>

            <p>
              Persistent compliance risk calculated from
              requirement severity and compliance status.
            </p>
          </div>

          <span
            className={`document-status ${getRiskLevelClass(
              riskSummary.overallRiskLevel
            )}`}
          >
            {getRiskLevelText(
              riskSummary.overallRiskLevel
            )}
          </span>
        </div>

        {riskHistoryLoading ? (
          <div className="empty-state">
            <div className="empty-icon">
              ⏳
            </div>

            <h3>
              Loading risk assessment...
            </h3>

            <p>
              Retrieving the persisted compliance risk
              records for this document.
            </p>
          </div>
        ) : riskHistoryError ? (
          <div className="empty-state">
            <div className="empty-icon">
              ⚠
            </div>

            <h3>
              Unable to load risk assessment
            </h3>

            <p>
              {riskHistoryError}
            </p>
          </div>
        ) : riskHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🛡️
            </div>

            <h3>
              No risk assessment available
            </h3>

            <p>
              Run a compliance check to calculate and
              store compliance risks for this document.
            </p>
          </div>
        ) : (
          <>
            {/* RISK SUMMARY */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "16px"
              }}
            >

              <div
                className="details-summary-stat"
              >
                <div className="summary-stat-icon blue">
                  📊
                </div>

                <div>
                  <span>
                    Risk Records
                  </span>

                  <strong>
                    {riskSummary.total}
                  </strong>
                </div>
              </div>

              <div
                className="details-summary-stat"
              >
                <div className="summary-stat-icon orange">
                  ⚠
                </div>

                <div>
                  <span>
                    Total Risk
                  </span>

                  <strong>
                    {riskSummary.totalRisk}
                  </strong>
                </div>
              </div>

              <div
                className="details-summary-stat"
              >
                <div className="summary-stat-icon orange">
                  ◐
                </div>

                <div>
                  <span>
                    Average Risk
                  </span>

                  <strong>
                    {riskSummary.averageRisk}
                  </strong>
                </div>
              </div>

              <div
                className="details-summary-stat"
              >
                <div className="summary-stat-icon orange">
                  🔥
                </div>

                <div>
                  <span>
                    Highest Risk
                  </span>

                  <strong>
                    {riskSummary.highestRisk}
                  </strong>
                </div>
              </div>

            </div>

            {/* INDIVIDUAL RISK RECORDS */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >

              {riskHistory.map(
                (risk, index) => (
                  <div
                    key={
                      risk.id ||
                      `${risk.requirement_id}-${risk.check_run_id}-${index}`
                    }
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      borderRadius:
                        "10px",
                      padding:
                        "14px 16px",
                      background:
                        "#ffffff"
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        marginBottom:
                          "10px"
                      }}
                    >

                      <div>
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.04em"
                          }}
                        >
                          Requirement #
                          {
                            risk.requirement_id
                          }
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "14px",
                            color:
                              "#111827"
                          }}
                        >
                          {risk.title ||
                            "Compliance Requirement"}
                        </strong>
                      </div>

                      <span
                        className={`document-status ${getRiskLevelClass(
                          risk.risk_level
                        )}`}
                      >
                        {getRiskLevelText(
                          risk.risk_level
                        )}
                      </span>

                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(4, minmax(0, 1fr))",
                        gap: "10px"
                      }}
                    >

                      <div
                        style={{
                          padding:
                            "9px 10px",
                          background:
                            "#f8fafc",
                          borderRadius:
                            "7px"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af"
                          }}
                        >
                          Severity
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "12px",
                            textTransform:
                              "capitalize"
                          }}
                        >
                          {risk.severity ||
                            "Medium"}
                        </strong>
                      </div>

                      <div
                        style={{
                          padding:
                            "9px 10px",
                          background:
                            "#f8fafc",
                          borderRadius:
                            "7px"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af"
                          }}
                        >
                          Status
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "12px",
                            textTransform:
                              "capitalize"
                          }}
                        >
                          {risk.status ||
                            "Missing"}
                        </strong>
                      </div>

                      <div
                        style={{
                          padding:
                            "9px 10px",
                          background:
                            "#f8fafc",
                          borderRadius:
                            "7px"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af"
                          }}
                        >
                          Base Risk
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "12px"
                          }}
                        >
                          {risk.base_risk ??
                            0}
                        </strong>
                      </div>

                      <div
                        style={{
                          padding:
                            "9px 10px",
                          background:
                            "#f8fafc",
                          borderRadius:
                            "7px"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9ca3af"
                          }}
                        >
                          Risk Score
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            fontSize:
                              "12px"
                          }}
                        >
                          {risk.risk_score ??
                            0}
                        </strong>
                      </div>

                    </div>

                    {risk.framework && (
                      <div
                        style={{
                          marginTop:
                            "9px",
                          fontSize:
                            "11px",
                          color:
                            "#6b7280"
                        }}
                      >
                        Framework:{" "}
                        <strong>
                          {risk.framework}
                        </strong>
                      </div>
                    )}

                    {risk.check_run_id && (
                      <div
                        style={{
                          marginTop:
                            "5px",
                          fontSize:
                            "10px",
                          color:
                            "#9ca3af"
                        }}
                      >
                        Check Run:{" "}
                        {risk.check_run_id}
                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          </>
        )}
      </section>

      {/* =====================================================
          AUDIT HISTORY
      ===================================================== */}

      <section className="dashboard-card">

        <div className="section-header">
          <div>
            <h2>
              📋 Audit History
            </h2>

            <p>
              Previously generated audit reports preserved
              for this document.
            </p>
          </div>

          <span className="live-badge">
            {auditHistory.length} REPORTS
          </span>
        </div>

        {auditHistoryLoading ? (
          <div className="empty-state">
            <div className="empty-icon">
              ⏳
            </div>

            <h3>
              Loading audit history...
            </h3>

            <p>
              Retrieving previously generated audit reports.
            </p>
          </div>
        ) : auditHistoryError ? (
          <div className="empty-state">
            <div className="empty-icon">
              ⚠
            </div>

            <h3>
              Unable to load audit history
            </h3>

            <p>
              {auditHistoryError}
            </p>
          </div>
        ) : auditHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📋
            </div>

            <h3>
              No audit reports available
            </h3>

            <p>
              Generate an audit report from the Document
              Workflow to create the first report.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: "10px"
            }}
          >

            {auditHistory.map(
              (report, index) => (
                <div
                  key={
                    report.id ||
                    report.report_id ||
                    index
                  }
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "10px",
                    padding:
                      "14px 16px",
                    background:
                      "#ffffff"
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "12px"
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                        minWidth: 0
                      }}
                    >

                      <div
                        style={{
                          width:
                            "38px",
                          height:
                            "38px",
                          borderRadius:
                            "10px",
                          background:
                            "#eff6ff",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          flexShrink:
                            0
                        }}
                      >
                        📄
                      </div>

                      <div
                        style={{
                          minWidth:
                            0
                        }}
                      >

                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "14px",
                            color:
                              "#111827"
                          }}
                        >
                          Audit Report #
                          {auditHistory.length -
                            index}
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            marginTop:
                              "4px",
                            fontSize:
                              "11px",
                            color:
                              "#6b7280"
                          }}
                        >
                          {report.generated_at
                            ? new Date(
                                report.generated_at
                              ).toLocaleString()
                            : report.created_at
                              ? new Date(
                                  report.created_at
                                ).toLocaleString()
                              : "Generated date unavailable"}
                        </span>

                      </div>

                    </div>

                    <span
                      className="document-status status-success"
                    >
                      {report.status ||
                        "Generated"}
                    </span>

                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: "10px",
                      marginTop:
                        "12px"
                    }}
                  >

                    <div
                      style={{
                        padding:
                          "9px 10px",
                        background:
                          "#f8fafc",
                        borderRadius:
                          "7px"
                      }}
                    >
                      <span
                        style={{
                          display:
                            "block",
                          fontSize:
                            "10px",
                          color:
                            "#9ca3af",
                          textTransform:
                            "uppercase"
                        }}
                      >
                        Framework
                      </span>

                      <strong
                        style={{
                          display:
                            "block",
                          marginTop:
                            "3px",
                          fontSize:
                            "12px",
                          color:
                            "#374151"
                        }}
                      >
                        {report.framework ||
                          report.framework_name ||
                          "All Frameworks"}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding:
                          "9px 10px",
                        background:
                          "#f8fafc",
                        borderRadius:
                          "7px"
                      }}
                    >
                      <span
                        style={{
                          display:
                            "block",
                          fontSize:
                            "10px",
                          color:
                            "#9ca3af",
                          textTransform:
                            "uppercase"
                        }}
                      >
                        Report ID
                      </span>

                      <strong
                        style={{
                          display:
                            "block",
                          marginTop:
                            "3px",
                          fontSize:
                            "12px",
                          color:
                            "#374151"
                        }}
                      >
                        {report.id ||
                          report.report_id ||
                          "N/A"}
                      </strong>
                    </div>

                  </div>

                  <div
                    style={{
                      marginTop:
                        "12px",
                      display:
                        "flex",
                      justifyContent:
                        "flex-end"
                    }}
                  >
                    <button
                      className="secondary-button"
                      onClick={() =>
                        handleDownloadAuditReport(
                          report.id ||
                            report.report_id
                        )
                      }
                    >
                      📥 Download PDF
                    </button>
                  </div>

                </div>
              )
            )}

          </div>
        )}
      </section>

      {/* =====================================================
          EXTRACTED TEXT
      ===================================================== */}

      <section className="dashboard-card">
        <div className="section-header">
          <div>
            <h2>
              Extracted Text
            </h2>

            <p>
              Text extracted from the uploaded document.
            </p>
          </div>
        </div>

        {document.extracted_text ? (
          <div className="extracted-text-container">
            <pre>
              {document.extracted_text}
            </pre>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              📝
            </div>

            <h3>
              No extracted text available
            </h3>

            <p>
              Analyze the document to extract its text.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}

export default DocumentDetails;