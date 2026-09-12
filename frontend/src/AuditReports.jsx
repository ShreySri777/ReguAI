import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function AuditReports() {
  const [documents, setDocuments] = useState([]);
  const [frameworks, setFrameworks] = useState([]);

  const [selectedDocumentId, setSelectedDocumentId] =
    useState("");

  const [selectedFramework, setSelectedFramework] =
    useState("");

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] =
    useState(null);

  const [summary, setSummary] = useState(null);

  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [loadingFrameworks, setLoadingFrameworks] =
    useState(true);

  const [loadingReports, setLoadingReports] =
    useState(false);

  const [loadingSummary, setLoadingSummary] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // LOAD DOCUMENTS
  // ==========================================================

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/documents`
      );

      if (!response.ok) {
        throw new Error("Unable to load documents.");
      }

      const data = await response.json();

      setDocuments(Array.isArray(data) ? data : []);

      const analyzedDocuments = Array.isArray(data)
        ? data.filter(
            (document) =>
              document.status === "analyzed" ||
              document.status === "compliance_checked"
          )
        : [];

      if (
        analyzedDocuments.length > 0 &&
        !selectedDocumentId
      ) {
        setSelectedDocumentId(
          String(analyzedDocuments[0].id)
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the ReguAI backend."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  // ==========================================================
  // LOAD ACTIVE FRAMEWORKS
  // ==========================================================

  const fetchFrameworks = async () => {
    try {
      setLoadingFrameworks(true);

      const response = await fetch(
        `${API_BASE_URL}/frameworks`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load compliance frameworks."
        );
      }

      const data = await response.json();

      const availableFrameworks =
        Array.isArray(data?.frameworks)
          ? data.frameworks
          : [];

      setFrameworks(availableFrameworks);

      setSelectedFramework((currentFramework) => {
        if (
          currentFramework &&
          availableFrameworks.includes(currentFramework)
        ) {
          return currentFramework;
        }

        return availableFrameworks.length > 0
          ? availableFrameworks[0]
          : "";
      });
    } catch (err) {
      console.error(err);

      setFrameworks([]);
      setSelectedFramework("");

      setError(
        "Unable to load compliance frameworks."
      );
    } finally {
      setLoadingFrameworks(false);
    }
  };

  // ==========================================================
  // LOAD REPORTS
  // ==========================================================

  const fetchReports = async (
    documentId,
    framework
  ) => {
    if (!documentId) {
      setReports([]);
      setSelectedReport(null);
      return;
    }

    try {
      setLoadingReports(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/audit-reports`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load audit reports."
        );
      }

      const data = await response.json();

      const allReports = Array.isArray(data)
        ? data
        : Array.isArray(data?.reports)
        ? data.reports
        : [];

      const filteredReports = allReports.filter(
        (report) =>
          !framework ||
          report.framework === framework
      );

      setReports(filteredReports);

      if (filteredReports.length > 0) {
        setSelectedReport(filteredReports[0]);
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error(err);

      setReports([]);
      setSelectedReport(null);

      setError(
        "Unable to load audit reports for this document."
      );
    } finally {
      setLoadingReports(false);
    }
  };

  // ==========================================================
  // LOAD COMPLIANCE SUMMARY
  // ==========================================================

  const fetchSummary = async (
    documentId,
    framework
  ) => {
    if (!documentId) {
      setSummary(null);
      return;
    }

    try {
      setLoadingSummary(true);

      const frameworkQuery = framework
        ? `?framework=${encodeURIComponent(
            framework
          )}`
        : "";

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/compliance-summary${frameworkQuery}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load compliance summary."
        );
      }

      const data = await response.json();

      setSummary(data);
    } catch (err) {
      console.error(err);

      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchDocuments();
    fetchFrameworks();
  }, []);

  // ==========================================================
  // LOAD DATA WHEN DOCUMENT / FRAMEWORK CHANGES
  // ==========================================================

  useEffect(() => {
    if (
      selectedDocumentId &&
      selectedFramework
    ) {
      fetchReports(
        selectedDocumentId,
        selectedFramework
      );

      fetchSummary(
        selectedDocumentId,
        selectedFramework
      );
    }
  }, [
    selectedDocumentId,
    selectedFramework
  ]);

  // ==========================================================
  // GENERATE FRAMEWORK-SPECIFIC REPORT
  // ==========================================================

  const generateReport = async () => {
    if (!selectedDocumentId) {
      setError(
        "Please select a document first."
      );
      return;
    }

    if (!selectedFramework) {
      setError(
        "Please select a compliance framework."
      );
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const frameworkQuery =
        `?framework=${encodeURIComponent(
          selectedFramework
        )}`;

      const response = await fetch(
        `${API_BASE_URL}/documents/${selectedDocumentId}/audit-report${frameworkQuery}`,
        {
          method: "POST"
        }
      );

      if (!response.ok) {
        let message =
          "Unable to generate the audit report.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      const data = await response.json();

      setSuccess(
        `Audit report generated successfully for ${selectedFramework}.`
      );

      setSelectedReport(data);

      await fetchReports(
        selectedDocumentId,
        selectedFramework
      );

      setSelectedReport(data);

      await fetchSummary(
        selectedDocumentId,
        selectedFramework
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to generate the audit report."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==========================================================
  // DOWNLOAD FRAMEWORK-SPECIFIC PDF
  // ==========================================================

  const downloadPdf = () => {
    if (
      !selectedDocumentId ||
      !selectedFramework
    ) {
      return;
    }

    const frameworkQuery =
      `?framework=${encodeURIComponent(
        selectedFramework
      )}`;

    window.open(
      `${API_BASE_URL}/documents/${selectedDocumentId}/audit-report/pdf${frameworkQuery}`,
      "_blank"
    );
  };

  // ==========================================================
  // SELECTED DOCUMENT
  // ==========================================================

  const selectedDocument = documents.find(
    (document) =>
      String(document.id) ===
      String(selectedDocumentId)
  );

  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  const getStatusClass = (status) => {
    const normalizedStatus =
      String(status || "").toLowerCase();

    if (
      normalizedStatus.includes("completed") ||
      normalizedStatus.includes("generated") ||
      normalizedStatus.includes("success")
    ) {
      return "audit-modern-status-success";
    }

    if (
      normalizedStatus.includes("pending")
    ) {
      return "audit-modern-status-warning";
    }

    if (
      normalizedStatus.includes("failed") ||
      normalizedStatus.includes("error")
    ) {
      return "audit-modern-status-error";
    }

    return "audit-modern-status-neutral";
  };

  // ==========================================================
  // OVERALL STATUS
  // ==========================================================

  const getOverallStatusClass = (status) => {
    switch (status) {
      case "Fully Compliant":
        return "audit-modern-overall-success";

      case "Mostly Compliant":
        return "audit-modern-overall-info";

      case "Partially Compliant":
        return "audit-modern-overall-warning";

      case "Non-Compliant":
        return "audit-modern-overall-error";

      default:
        return "audit-modern-overall-neutral";
    }
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Unknown";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  // ==========================================================
  // CURRENT FRAMEWORK
  // ==========================================================

  const displayedFramework =
    selectedReport?.framework ||
    selectedFramework ||
    "No Framework";

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <style>{`
        .audit-modern-page {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding-bottom: 50px;
        }

        .audit-modern-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 28px;
        }

        .audit-modern-breadcrumb {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .audit-modern-header h1 {
          margin: 0 0 8px;
          font-size: 30px;
          line-height: 1.2;
          color: #0f172a;
        }

        .audit-modern-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .audit-modern-framework-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 999px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .audit-modern-message {
          padding: 13px 16px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 14px;
          font-weight: 600;
        }

        .audit-modern-success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }

        .audit-modern-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .audit-modern-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .audit-modern-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 20px;
        }

        .audit-modern-card-header h2 {
          margin: 0 0 6px;
          font-size: 18px;
          color: #0f172a;
        }

        .audit-modern-card-header p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .audit-modern-scope-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr) auto;
          gap: 16px;
          align-items: end;
        }

        .audit-modern-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .audit-modern-field label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
        }

        .audit-modern-field select {
          width: 100%;
          min-height: 42px;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          outline: none;
        }

        .audit-modern-field select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
        }

        .audit-modern-primary {
          min-height: 42px;
          padding: 10px 17px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .audit-modern-primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .audit-modern-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .audit-modern-summary-layout {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
          gap: 20px;
        }

        .audit-modern-score {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 190px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .audit-modern-score-circle {
          width: 135px;
          height: 135px;
          border-radius: 50%;
          border: 9px solid #dbeafe;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: white;
        }

        .audit-modern-score-circle strong {
          font-size: 28px;
          color: #1d4ed8;
        }

        .audit-modern-score-circle span {
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
          text-align: center;
        }

        .audit-modern-status-panel {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .audit-modern-status-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .audit-modern-overall {
          font-size: 23px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .audit-modern-overall-success {
          color: #059669;
        }

        .audit-modern-overall-info {
          color: #2563eb;
        }

        .audit-modern-overall-warning {
          color: #d97706;
        }

        .audit-modern-overall-error {
          color: #dc2626;
        }

        .audit-modern-overall-neutral {
          color: #475569;
        }

        .audit-modern-status-panel p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .audit-modern-framework-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          font-size: 13px;
        }

        .audit-modern-framework-line span {
          color: #64748b;
        }

        .audit-modern-framework-line strong {
          color: #1d4ed8;
        }

        .audit-modern-progress {
          margin-top: 20px;
        }

        .audit-modern-progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .audit-modern-progress-header strong {
          color: #0f172a;
        }

        .audit-modern-progress-track {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }

        .audit-modern-progress-fill {
          height: 100%;
          background: #2563eb;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .audit-modern-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 20px;
        }

        .audit-modern-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
        }

        .audit-modern-stat-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f1f5f9;
          font-size: 17px;
        }

        .audit-modern-stat-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .audit-modern-stat-content strong {
          font-size: 20px;
          color: #0f172a;
        }

        .audit-modern-stat-content span {
          color: #64748b;
          font-size: 11px;
        }

        .audit-modern-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .audit-modern-count {
          padding: 6px 10px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
        }

        .audit-modern-report-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .audit-modern-report-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.15s ease,
            background 0.15s ease;
        }

        .audit-modern-report-item:hover {
          border-color: #93c5fd;
          background: #f8fbff;
        }

        .audit-modern-report-item.selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .audit-modern-report-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f1f5f9;
          flex-shrink: 0;
          font-size: 18px;
        }

        .audit-modern-report-content {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .audit-modern-report-content strong {
          color: #0f172a;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .audit-modern-report-content span {
          color: #475569;
          font-size: 11px;
        }

        .audit-modern-report-content small {
          color: #94a3b8;
          font-size: 10px;
        }

        .audit-modern-status {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .audit-modern-status-success {
          background: #ecfdf5;
          color: #047857;
        }

        .audit-modern-status-warning {
          background: #fffbeb;
          color: #b45309;
        }

        .audit-modern-status-error {
          background: #fef2f2;
          color: #b91c1c;
        }

        .audit-modern-status-neutral {
          background: #f1f5f9;
          color: #475569;
        }

        .audit-modern-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 18px;
        }

        .audit-modern-preview-title {
          min-width: 0;
        }

        .audit-modern-preview-title h3 {
          margin: 0 0 5px;
          color: #0f172a;
          font-size: 18px;
          overflow-wrap: anywhere;
        }

        .audit-modern-preview-title p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
        }

        .audit-modern-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .audit-modern-meta {
          min-width: 0;
          padding: 14px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .audit-modern-meta span {
          display: block;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .audit-modern-meta strong {
          display: block;
          color: #0f172a;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .audit-modern-meta.framework strong {
          color: #1d4ed8;
        }

        .audit-modern-report-content {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          overflow: hidden;
        }

        .audit-modern-report-content-header {
          padding: 11px 14px;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
        }

        .audit-modern-report-content pre {
          margin: 0;
          padding: 18px;
          max-height: 620px;
          overflow: auto;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
          color: #334155;
          font-family: "Consolas", "Courier New", monospace;
          font-size: 11px;
          line-height: 1.65;
        }

        .audit-modern-empty {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .audit-modern-empty-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .audit-modern-empty h3 {
          margin: 0 0 6px;
          color: #334155;
          font-size: 16px;
        }

        .audit-modern-empty p {
          margin: 0;
          font-size: 13px;
        }

        .audit-modern-loading {
          padding: 25px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .audit-modern-scope-grid {
            grid-template-columns: 1fr;
          }

          .audit-modern-summary-layout {
            grid-template-columns: 1fr;
          }

          .audit-modern-meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .audit-modern-stat-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .audit-modern-page {
            padding: 0 10px 40px;
          }

          .audit-modern-header {
            flex-direction: column;
          }

          .audit-modern-meta-grid {
            grid-template-columns: 1fr;
          }

          .audit-modern-preview-header {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="audit-modern-page">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="audit-modern-header">

          <div>
            <div className="audit-modern-breadcrumb">
              Compliance / Audit Reports
            </div>

            <h1>
              Audit Reports
            </h1>

            <p>
              Generate, review, and download structured
              compliance audit reports.
            </p>
          </div>

          <div className="audit-modern-framework-badge">
            🛡️
            Framework:
            <strong>
              {displayedFramework}
            </strong>
          </div>

        </div>

        {/* ======================================================
            MESSAGES
        ====================================================== */}

        {success && (
          <div className="audit-modern-message audit-modern-success">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="audit-modern-message audit-modern-error">
            ⚠ {error}
          </div>
        )}

        {/* ======================================================
            AUDIT SCOPE
        ====================================================== */}

        <section className="audit-modern-card">

          <div className="audit-modern-card-header">
            <div>
              <h2>
                Audit Scope
              </h2>

              <p>
                Select the document and compliance
                framework for your audit report.
              </p>
            </div>
          </div>

          <div className="audit-modern-scope-grid">

            <div className="audit-modern-field">

              <label htmlFor="audit-document">
                Document
              </label>

              <select
                id="audit-document"
                value={selectedDocumentId}
                onChange={(event) =>
                  setSelectedDocumentId(
                    event.target.value
                  )
                }
                disabled={
                  loadingDocuments ||
                  generating
                }
              >

                <option value="">
                  Select a document
                </option>

                {documents
                  .filter(
                    (document) =>
                      document.status ===
                        "analyzed" ||
                      document.status ===
                        "compliance_checked"
                  )
                  .map((document) => (

                    <option
                      key={document.id}
                      value={document.id}
                    >
                      #{document.id} —{" "}
                      {document.filename}
                    </option>

                  ))}

              </select>

            </div>

            <div className="audit-modern-field">

              <label htmlFor="audit-framework">
                Compliance Framework
              </label>

              <select
                id="audit-framework"
                value={selectedFramework}
                onChange={(event) => {
                  setSelectedFramework(
                    event.target.value
                  );

                  setSuccess("");
                  setError("");
                }}
                disabled={
                  loadingFrameworks ||
                  generating
                }
              >

                {frameworks.length === 0 && (
                  <option value="">
                    No frameworks available
                  </option>
                )}

                {frameworks.map(
                  (framework) => (

                    <option
                      key={framework}
                      value={framework}
                    >
                      {framework}
                    </option>

                  )
                )}

              </select>

            </div>

            <button
              className="audit-modern-primary"
              onClick={generateReport}
              disabled={
                !selectedDocumentId ||
                !selectedFramework ||
                generating ||
                loadingReports
              }
            >
              {generating
                ? "Generating..."
                : "📊 Generate Report"}
            </button>

          </div>

        </section>

        {/* ======================================================
            COMPLIANCE SUMMARY
        ====================================================== */}

        {selectedDocument && (

          <section className="audit-modern-card">

            <div className="audit-modern-card-header">

              <div>
                <h2>
                  Compliance Summary
                </h2>

                <p>
                  Assessment for{" "}
                  <strong>
                    {selectedDocument.filename}
                  </strong>
                </p>
              </div>

              <div className="audit-modern-framework-badge">
                🛡️ {selectedFramework}
              </div>

            </div>

            {loadingSummary && (
              <div className="audit-modern-loading">
                Loading compliance summary...
              </div>
            )}

            {!loadingSummary &&
              summary && (

                <>

                  <div className="audit-modern-summary-layout">

                    <div className="audit-modern-score">

                      <div className="audit-modern-score-circle">

                        <strong>
                          {Number(
                            summary.score || 0
                          ).toFixed(1)}
                          %
                        </strong>

                        <span>
                          Compliance Score
                        </span>

                      </div>

                    </div>

                    <div className="audit-modern-status-panel">

                      <span className="audit-modern-status-label">
                        Overall Status
                      </span>

                      <strong
                        className={`audit-modern-overall ${getOverallStatusClass(
                          summary.overall_status
                        )}`}
                      >
                        {summary.overall_status}
                      </strong>

                      <p>
                        Based on{" "}
                        {summary.total_requirements}{" "}
                        requirements for the selected
                        framework.
                      </p>

                      <div className="audit-modern-framework-line">

                        <span>
                          Compliance Framework:
                        </span>

                        <strong>
                          {selectedFramework}
                        </strong>

                      </div>

                    </div>

                  </div>

                  <div className="audit-modern-progress">

                    <div className="audit-modern-progress-header">

                      <span>
                        Compliance Progress
                      </span>

                      <strong>
                        {Number(
                          summary.score || 0
                        ).toFixed(1)}
                        %
                      </strong>

                    </div>

                    <div className="audit-modern-progress-track">

                      <div
                        className="audit-modern-progress-fill"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              Number(
                                summary.score || 0
                              ),
                              0
                            ),
                            100
                          )}%`
                        }}
                      ></div>

                    </div>

                  </div>

                  <div className="audit-modern-stat-grid">

                    <div className="audit-modern-stat">

                      <div className="audit-modern-stat-icon">
                        ✓
                      </div>

                      <div className="audit-modern-stat-content">

                        <strong>
                          {
                            summary.matched_requirements
                          }
                        </strong>

                        <span>
                          Matched Requirements
                        </span>

                      </div>

                    </div>

                    <div className="audit-modern-stat">

                      <div className="audit-modern-stat-icon">
                        ⚠
                      </div>

                      <div className="audit-modern-stat-content">

                        <strong>
                          {
                            summary.missing_requirements
                          }
                        </strong>

                        <span>
                          Missing Requirements
                        </span>

                      </div>

                    </div>

                    <div className="audit-modern-stat">

                      <div className="audit-modern-stat-icon">
                        📋
                      </div>

                      <div className="audit-modern-stat-content">

                        <strong>
                          {
                            summary.total_requirements
                          }
                        </strong>

                        <span>
                          Total Requirements
                        </span>

                      </div>

                    </div>

                  </div>

                </>

              )}

            {!loadingSummary &&
              !summary && (

                <div className="audit-modern-empty">

                  <div className="audit-modern-empty-icon">
                    📊
                  </div>

                  <h3>
                    Compliance Summary Unavailable
                  </h3>

                  <p>
                    Run a compliance check for this
                    document before generating an
                    audit report.
                  </p>

                </div>

              )}

          </section>

        )}

        {/* ======================================================
            REPORT HISTORY
        ====================================================== */}

        {selectedDocument && (

          <section className="audit-modern-card">

            <div className="audit-modern-history-header">

              <div
                className="audit-modern-card-header"
                style={{
                  marginBottom: 0
                }}
              >
                <div>

                  <h2>
                    Report History
                  </h2>

                  <p>
                    Reports generated for{" "}
                    <strong>
                      {selectedDocument.filename}
                    </strong>
                    {" • "}
                    <strong>
                      {selectedFramework}
                    </strong>
                  </p>

                </div>
              </div>

              <div className="audit-modern-count">
                {reports.length}{" "}
                {reports.length === 1
                  ? "REPORT"
                  : "REPORTS"}
              </div>

            </div>

            {loadingReports && (
              <div className="audit-modern-loading">
                Loading audit reports...
              </div>
            )}

            {!loadingReports &&
              reports.length === 0 && (

                <div className="audit-modern-empty">

                  <div className="audit-modern-empty-icon">
                    📄
                  </div>

                  <h3>
                    No {selectedFramework} Reports Yet
                  </h3>

                  <p>
                    Generate an audit report using
                    the selected framework.
                  </p>

                </div>

              )}

            {!loadingReports &&
              reports.length > 0 && (

                <div className="audit-modern-report-list">

                  {reports.map((report) => (

                    <button
                      type="button"
                      className={`audit-modern-report-item ${
                        selectedReport?.id ===
                        report.id
                          ? "selected"
                          : ""
                      }`}
                      key={report.id}
                      onClick={() =>
                        setSelectedReport(report)
                      }
                    >

                      <div className="audit-modern-report-icon">
                        📄
                      </div>

                      <div className="audit-modern-report-content">

                        <strong>
                          {report.report_title}
                        </strong>

                        <span>
                          Report #{report.id}
                          {" • "}
                          {report.framework ||
                            selectedFramework}
                        </span>

                        <small>
                          Generated{" "}
                          {formatDate(
                            report.generated_at
                          )}
                        </small>

                      </div>

                      <span
                        className={`audit-modern-status ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status ||
                          "Generated"}
                      </span>

                    </button>

                  ))}

                </div>

              )}

          </section>

        )}

        {/* ======================================================
            REPORT PREVIEW
        ====================================================== */}

        {selectedReport && (

          <section className="audit-modern-card">

            <div className="audit-modern-preview-header">

              <div className="audit-modern-preview-title">

                <h3>
                  {selectedReport.report_title}
                </h3>

                <p>
                  Report #{selectedReport.id}
                </p>

              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap"
                }}
              >

                <span
                  className={`audit-modern-status ${getStatusClass(
                    selectedReport.status
                  )}`}
                >
                  {selectedReport.status ||
                    "Generated"}
                </span>

                <button
                  className="audit-modern-primary"
                  onClick={downloadPdf}
                  disabled={
                    !selectedDocumentId ||
                    !selectedFramework
                  }
                >
                  ⬇ Download PDF
                </button>

              </div>

            </div>

            {/* ==================================================
                FRAMEWORK METADATA
            ================================================== */}

            <div className="audit-modern-meta-grid">

              <div className="audit-modern-meta">

                <span>
                  Document
                </span>

                <strong>
                  {selectedDocument?.filename ||
                    "Unknown"}
                </strong>

              </div>

              <div className="audit-modern-meta framework">

                <span>
                  Compliance Framework
                </span>

                <strong>
                  {selectedReport.framework ||
                    selectedFramework ||
                    "No Framework"}
                </strong>

              </div>

              <div className="audit-modern-meta">

                <span>
                  Generated
                </span>

                <strong>
                  {formatDate(
                    selectedReport.generated_at
                  )}
                </strong>

              </div>

              <div className="audit-modern-meta">

                <span>
                  Report ID
                </span>

                <strong>
                  #{selectedReport.id}
                </strong>

              </div>

            </div>

            {/* ==================================================
                REPORT CONTENT
            ================================================== */}

            <div className="audit-modern-report-content">

              <div className="audit-modern-report-content-header">
                Audit Report Content
              </div>

              <pre>
                {selectedReport.report_content ||
                  "No report content available."}
              </pre>

            </div>

          </section>

        )}

      </div>
    </>
  );
}

export default AuditReports;