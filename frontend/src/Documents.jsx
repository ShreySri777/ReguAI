import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [frameworks, setFrameworks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);

  const [error, setError] = useState("");
  const [frameworkError, setFrameworkError] = useState("");

  const [checkingDocumentId, setCheckingDocumentId] = useState(null);
  const [analyzingDocumentId, setAnalyzingDocumentId] = useState(null);

  const [selectedFramework, setSelectedFramework] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [complianceResults, setComplianceResults] = useState({});
  const [complianceErrors, setComplianceErrors] = useState({});
  const [complianceSuccess, setComplianceSuccess] = useState({});

  const [riskHistory, setRiskHistory] = useState({});
  const [riskHistoryLoading, setRiskHistoryLoading] = useState({});
  const [riskHistoryErrors, setRiskHistoryErrors] = useState({});

  const [auditHistory, setAuditHistory] = useState({});
  const [auditHistoryLoading, setAuditHistoryLoading] = useState({});
  const [auditHistoryErrors, setAuditHistoryErrors] = useState({});

  // ========================================================
  // FETCH DOCUMENTS
  // ========================================================

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/documents`
      );

      if (!response.ok) {
        throw new Error("Unable to load documents.");
      }

      const data = await response.json();

      setDocuments(data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the ReguAI backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // FETCH FRAMEWORKS
  // ========================================================

  const fetchFrameworks = async () => {
    try {
      setLoadingFrameworks(true);
      setFrameworkError("");

      const response = await fetch(
        `${API_BASE_URL}/frameworks/all`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load frameworks."
        );
      }

      const data = await response.json();

      const activeFrameworks = data.filter(
        (framework) =>
          framework.is_active !== false
      );

      setFrameworks(activeFrameworks);

      if (
        activeFrameworks.length > 0 &&
        !selectedFramework
      ) {
        setSelectedFramework(
          activeFrameworks[0].name
        );
      }
    } catch (err) {
      console.error(err);

      setFrameworkError(
        "Unable to load compliance frameworks."
      );
    } finally {
      setLoadingFrameworks(false);
    }
  };

  // ========================================================
  // UPLOAD DOCUMENT
  // ========================================================

  const uploadDocument = async () => {
    if (!selectedFile) {
      setUploadError(
        "Please select a PDF document first."
      );
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setUploadError(
        "Only PDF files are supported."
      );
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess("");

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response = await fetch(
        `${API_BASE_URL}/documents/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        let message =
          "Unable to upload the document.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch (parseError) {
          console.error(
            "Unable to parse upload error:",
            parseError
          );
        }

        throw new Error(message);
      }

      const data = await response.json();

      setUploadSuccess(
        data.message ||
          "Document uploaded successfully."
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "document-upload-input"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchDocuments();
    } catch (err) {
      console.error(err);

      setUploadError(
        err.message ||
          "Unable to upload the document."
      );
    } finally {
      setUploading(false);
    }
  };

  // ========================================================
  // ANALYZE DOCUMENT
  // ========================================================

  const analyzeUploadedDocument = async (
    documentId
  ) => {
    try {
      setAnalyzingDocumentId(documentId);
      setUploadError("");
      setUploadSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/analyze`,
        {
          method: "POST"
        }
      );

      if (!response.ok) {
        let message =
          "Unable to analyze the document.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch (parseError) {
          console.error(
            "Unable to parse analysis error:",
            parseError
          );
        }

        throw new Error(message);
      }

      await response.json();

      setUploadSuccess(
        "Document analyzed successfully."
      );

      await fetchDocuments();
    } catch (err) {
      console.error(err);

      setUploadError(
        err.message ||
          "Unable to analyze the document."
      );
    } finally {
      setAnalyzingDocumentId(null);
    }
  };

  // ========================================================
  // FETCH RISK HISTORY
  // ========================================================

  const fetchRiskHistory = async (
    documentId
  ) => {
    try {
      setRiskHistoryLoading((previous) => ({
        ...previous,
        [documentId]: true
      }));

      setRiskHistoryErrors((previous) => ({
        ...previous,
        [documentId]: ""
      }));

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/compliance-risks`
      );

      if (!response.ok) {
        let message =
          "Unable to load risk history.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch (parseError) {
          console.error(
            "Unable to parse risk history error:",
            parseError
          );
        }

        throw new Error(message);
      }

      const data = await response.json();

      setRiskHistory((previous) => ({
        ...previous,
        [documentId]: data
      }));
    } catch (err) {
      console.error(err);

      setRiskHistoryErrors((previous) => ({
        ...previous,
        [documentId]:
          err.message ||
          "Unable to load risk history."
      }));
    } finally {
      setRiskHistoryLoading((previous) => ({
        ...previous,
        [documentId]: false
      }));
    }
  };

  // ========================================================
  // FETCH AUDIT HISTORY
  // ========================================================

  const fetchAuditHistory = async (
    documentId
  ) => {
    try {
      setAuditHistoryLoading((previous) => ({
        ...previous,
        [documentId]: true
      }));

      setAuditHistoryErrors((previous) => ({
        ...previous,
        [documentId]: ""
      }));

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/audit-reports`
      );

      if (!response.ok) {
        let message =
          "Unable to load audit history.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch (parseError) {
          console.error(
            "Unable to parse audit history error:",
            parseError
          );
        }

        throw new Error(message);
      }

      const data = await response.json();

      setAuditHistory((previous) => ({
        ...previous,
        [documentId]: data
      }));
    } catch (err) {
      console.error(err);

      setAuditHistoryErrors((previous) => ({
        ...previous,
        [documentId]:
          err.message ||
          "Unable to load audit history."
      }));
    } finally {
      setAuditHistoryLoading((previous) => ({
        ...previous,
        [documentId]: false
      }));
    }
  };

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    fetchDocuments();
    fetchFrameworks();
  }, []);

  // ========================================================
  // LOAD STORED HISTORY AFTER DOCUMENTS LOAD
  // ========================================================

  useEffect(() => {
    if (!documents.length) {
      return;
    }

    const eligibleDocuments =
      documents.filter(
        (document) =>
          document.status === "analyzed" ||
          document.status ===
            "compliance_checked"
      );

    eligibleDocuments.forEach(
      (document) => {
        fetchRiskHistory(
          document.id
        );

        fetchAuditHistory(
          document.id
        );
      }
    );
  }, [documents]);

  // ========================================================
  // RUN COMPLIANCE CHECK
  // ========================================================

  const runComplianceCheck = async (
    documentId
  ) => {
    if (!selectedFramework) {
      setComplianceErrors((previous) => ({
        ...previous,
        [documentId]:
          "Please select a compliance framework first."
      }));

      return;
    }

    try {
      setCheckingDocumentId(documentId);

      setComplianceErrors((previous) => ({
        ...previous,
        [documentId]: ""
      }));

      setComplianceSuccess((previous) => ({
        ...previous,
        [documentId]: ""
      }));

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/compliance-check?framework=${encodeURIComponent(
          selectedFramework
        )}`,
        {
          method: "POST"
        }
      );

      if (!response.ok) {
        let message =
          "Unable to complete the compliance check.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch (parseError) {
          console.error(
            "Unable to parse compliance error:",
            parseError
          );
        }

        throw new Error(message);
      }

      const data = await response.json();

      setComplianceResults((previous) => ({
        ...previous,
        [documentId]: data
      }));

      setComplianceSuccess((previous) => ({
        ...previous,
        [documentId]:
          `Compliance check completed using ${data.framework}.`
      }));

      await fetchRiskHistory(
        documentId
      );

      await fetchAuditHistory(
        documentId
      );

      await fetchDocuments();
    } catch (err) {
      console.error(err);

      setComplianceErrors((previous) => ({
        ...previous,
        [documentId]:
          err.message ||
          "Unable to complete the compliance check."
      }));
    } finally {
      setCheckingDocumentId(null);
    }
  };

  // ========================================================
  // STATUS HELPERS
  // ========================================================

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

  const getResultStatusClass = (status) => {
    switch (status) {
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

  const getResultStatusText = (status) => {
    switch (status) {
      case "matched":
        return "Matched";

      case "review":
        return "Needs Review";

      case "missing":
        return "Missing";

      default:
        return status || "Unknown";
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "status-success";
    }

    if (score >= 50) {
      return "status-warning";
    }

    return "status-danger";
  };

  const getRiskClass = (riskLevel) => {
    switch (
      riskLevel?.toLowerCase()
    ) {
      case "minimal":
        return "status-success";

      case "low":
        return "status-info";

      case "medium":
        return "status-warning";

      case "high":
        return "status-danger";

      case "critical":
        return "status-danger";

      default:
        return "status-neutral";
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch (
      riskLevel?.toLowerCase()
    ) {
      case "minimal":
        return "Minimal Risk";

      case "low":
        return "Low Risk";

      case "medium":
        return "Medium Risk";

      case "high":
        return "High Risk";

      case "critical":
        return "Critical Risk";

      default:
        return riskLevel || "Unknown";
    }
  };

  const getAuditStatusClass = (
    status
  ) => {
    const normalized =
      String(status || "")
        .toLowerCase();

    if (
      normalized.includes("generated") ||
      normalized.includes("completed") ||
      normalized.includes("success")
    ) {
      return "status-success";
    }

    if (
      normalized.includes("pending")
    ) {
      return "status-warning";
    }

    if (
      normalized.includes("failed") ||
      normalized.includes("error")
    ) {
      return "status-danger";
    }

    return "status-neutral";
  };

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Unknown";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="documents-page">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="page-header">

        <div>
          <h1>
            Documents
          </h1>

          <p>
            Manage and analyze your compliance documents
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            fetchDocuments();
            fetchFrameworks();
          }}
          disabled={
            loading ||
            loadingFrameworks ||
            uploading
          }
        >
          ↻ Refresh Documents
        </button>

      </div>

      {/* ==================================================
          DOCUMENT UPLOAD
      ================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>
            <h2>
              Upload Document
            </h2>

            <p>
              Upload a PDF compliance document
              to begin analysis with ReguAI.
            </p>
          </div>

        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "20px",
            border:
              "1px dashed #cbd5e1",
            borderRadius: "12px",
            background: "#f8fafc"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap"
            }}
          >

            <input
              id="document-upload-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => {
                const file =
                  event.target.files?.[0] ||
                  null;

                setSelectedFile(file);
                setUploadError("");
                setUploadSuccess("");
              }}
              disabled={uploading}
              style={{
                flex: "1",
                minWidth: "240px",
                padding: "10px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#ffffff"
              }}
            />

            <button
              className="primary-button"
              onClick={
                uploadDocument
              }
              disabled={
                uploading ||
                !selectedFile
              }
            >
              {uploading
                ? "⏳ Uploading..."
                : "📤 Upload PDF"}
            </button>

          </div>

          {selectedFile && (
            <div
              style={{
                marginTop: "12px",
                color: "#475569",
                fontSize: "14px"
              }}
            >
              Selected:{" "}
              <strong>
                {selectedFile.name}
              </strong>
            </div>
          )}

          {uploadError && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#fef2f2",
                color: "#b91c1c"
              }}
            >
              ⚠ {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#f0fdf4",
                color: "#15803d"
              }}
            >
              ✓ {uploadSuccess}
            </div>
          )}

          <p
            style={{
              margin:
                "12px 0 0 0",
              color: "#64748b",
              fontSize: "13px"
            }}
          >
            Supported format: PDF
          </p>

        </div>

      </section>

      {/* ==================================================
          DOCUMENT STATS
      ================================================== */}

      <div className="document-stats">

        <div className="document-stat-card">

          <div className="document-stat-icon blue">
            📄
          </div>

          <div>
            <span>
              Total Documents
            </span>

            <strong>
              {documents.length}
            </strong>
          </div>

        </div>

        <div className="document-stat-card">

          <div className="document-stat-icon orange">
            📤
          </div>

          <div>
            <span>
              Uploaded
            </span>

            <strong>
              {
                documents.filter(
                  (document) =>
                    document.status ===
                    "uploaded"
                ).length
              }
            </strong>
          </div>

        </div>

        <div className="document-stat-card">

          <div className="document-stat-icon green">
            ✓
          </div>

          <div>
            <span>
              Analyzed
            </span>

            <strong>
              {
                documents.filter(
                  (document) =>
                    document.status ===
                      "analyzed" ||
                    document.status ===
                      "compliance_checked"
                ).length
              }
            </strong>
          </div>

        </div>

      </div>

      {/* ==================================================
          COMPLIANCE CHECK CONTROLS
      ================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>
            <h2>
              Compliance Check
            </h2>

            <p>
              Select a regulatory framework and run
              AI-powered compliance checks on your documents.
            </p>
          </div>

        </div>

        <div
          className="compliance-check-controls"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "16px",
            marginBottom: "20px"
          }}
        >

          <label
            htmlFor="compliance-framework"
            style={{
              fontWeight: "600"
            }}
          >
            Framework
          </label>

          <select
            id="compliance-framework"
            value={selectedFramework}
            onChange={(event) => {
              setSelectedFramework(
                event.target.value
              );
            }}
            disabled={
              loadingFrameworks ||
              checkingDocumentId !==
                null ||
              analyzingDocumentId !==
                null
            }
            style={{
              minWidth: "220px",
              padding: "10px 12px",
              borderRadius: "8px",
              border:
                "1px solid #d1d5db",
              background: "#ffffff",
              cursor: "pointer"
            }}
          >

            <option value="">
              Select Framework
            </option>

            {frameworks.map(
              (framework) => (
                <option
                  key={framework.id}
                  value={framework.name}
                >
                  {framework.name}
                </option>
              )
            )}

          </select>

          {loadingFrameworks && (
            <span>
              Loading frameworks...
            </span>
          )}

        </div>

        {frameworkError && (
          <div
            className="document-error"
            style={{
              marginBottom: "20px"
            }}
          >
            <p>
              {frameworkError}
            </p>
          </div>
        )}

        {!loadingFrameworks &&
          !frameworkError &&
          frameworks.length === 0 && (
            <div
              className="empty-state"
              style={{
                marginBottom: "20px"
              }}
            >

              <div className="empty-icon">
                ⚠
              </div>

              <h3>
                No active frameworks found
              </h3>

              <p>
                Activate a compliance framework from
                Settings before running a compliance check.
              </p>

            </div>
          )}

      </section>

      {/* ==================================================
          ALL DOCUMENTS
      ================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>
            <h2>
              All Documents
            </h2>

            <p>
              Documents stored in the ReguAI system
            </p>
          </div>

        </div>

        {loading && (
          <div className="page-loading">

            <div className="loading-spinner">
            </div>

            <p>
              Loading documents...
            </p>

          </div>
        )}

        {!loading && error && (
          <div className="document-error">

            <div className="error-icon">
              ⚠
            </div>

            <h3>
              Unable to load documents
            </h3>

            <p>
              {error}
            </p>

            <button
              className="primary-button"
              onClick={
                fetchDocuments
              }
            >
              Try Again
            </button>

          </div>
        )}

        {!loading &&
          !error &&
          documents.length === 0 && (
            <div className="empty-state">

              <div className="empty-icon">
                📄
              </div>

              <h3>
                No documents found
              </h3>

              <p>
                Upload a compliance document above
                to get started with ReguAI.
              </p>

            </div>
          )}

        {!loading &&
          !error &&
          documents.length > 0 && (

            <div
              className="documents-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                width: "100%"
              }}
            >

              {documents.map(
                (document) => {

                  const result =
                    complianceResults[
                      document.id
                    ];

                  const documentError =
                    complianceErrors[
                      document.id
                    ];

                  const documentSuccess =
                    complianceSuccess[
                      document.id
                    ];

                  const storedRiskHistory =
                    riskHistory[
                      document.id
                    ];

                  const riskLoading =
                    riskHistoryLoading[
                      document.id
                    ];

                  const riskError =
                    riskHistoryErrors[
                      document.id
                    ];

                  const storedAuditHistory =
                    auditHistory[
                      document.id
                    ];

                  const auditLoading =
                    auditHistoryLoading[
                      document.id
                    ];

                  const auditError =
                    auditHistoryErrors[
                      document.id
                    ];

                  const isAnalyzing =
                    analyzingDocumentId ===
                    document.id;

                  const latestAuditReport =
                    storedAuditHistory &&
                    storedAuditHistory.length >
                      0
                      ? storedAuditHistory[0]
                      : null;

                  return (

                    <div
                      className="document-card"
                      key={document.id}
                      style={{
                        display: "block",
                        width: "100%",
                        boxSizing:
                          "border-box",
                        overflow:
                          "hidden"
                      }}
                    >

                      {/* ==================================================
                          DOCUMENT HEADER
                      ================================================== */}

                      <div
                        className="document-card-link"
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "20px",
                          width: "100%",
                          boxSizing:
                            "border-box"
                        }}
                      >

                        <NavLink
                          to={`/documents/${document.id}`}
                          style={{
                            textDecoration:
                              "none",
                            color:
                              "inherit",
                            flex: "1",
                            minWidth: 0
                          }}
                        >

                          <div className="document-card-left">

                            <div className="large-document-icon">
                              📄
                            </div>

                            <div className="document-details">

                              <h3>
                                {document.filename}
                              </h3>

                              <p>
                                Document #{document.id}
                              </p>

                              <div
                                className="document-meta"
                                style={{
                                  display:
                                    "flex",
                                  gap:
                                    "16px",
                                  flexWrap:
                                    "wrap"
                                }}
                              >

                                <span>
                                  Type:{" "}
                                  {document.file_type?.toUpperCase() ||
                                    "PDF"}
                                </span>

                                <span>
                                  Uploaded:{" "}
                                  {document.uploaded_at
                                    ? new Date(
                                        document.uploaded_at
                                      ).toLocaleDateString()
                                    : "Unknown"}
                                </span>

                              </div>

                            </div>

                          </div>

                        </NavLink>

                        <div
                          className="document-card-right"
                          style={{
                            flexShrink: 0
                          }}
                        >

                          <span
                            className={`document-status ${getStatusClass(
                              document.status
                            )}`}
                          >
                            {getStatusText(
                              document.status
                            )}
                          </span>

                          <span className="document-open-arrow">
                            →
                          </span>

                        </div>

                      </div>

                      {/* ==================================================
                          DOCUMENT ACTIONS
                      ================================================== */}

                      <div
                        style={{
                          borderTop:
                            "1px solid #e5e7eb",
                          marginTop:
                            "16px",
                          paddingTop:
                            "16px",
                          display:
                            "flex",
                          gap:
                            "10px",
                          flexWrap:
                            "wrap",
                          alignItems:
                            "center"
                        }}
                      >

                        {document.status ===
                          "uploaded" && (

                          <button
                            className="primary-button"
                            onClick={() =>
                              analyzeUploadedDocument(
                                document.id
                              )
                            }
                            disabled={
                              isAnalyzing ||
                              analyzingDocumentId !==
                                null ||
                              uploading
                            }
                          >
                            {isAnalyzing
                              ? "⏳ Analyzing..."
                              : "🧠 Analyze Document"}
                          </button>

                        )}

                        {document.status ===
                          "analyzed" && (

                          <span
                            style={{
                              color:
                                "#15803d",
                              fontSize:
                                "14px",
                              fontWeight:
                                "600"
                            }}
                          >
                            ✓ AI analysis completed
                          </span>

                        )}

                        {document.status ===
                          "compliance_checked" && (

                          <span
                            style={{
                              color:
                                "#15803d",
                              fontSize:
                                "14px",
                              fontWeight:
                                "600"
                            }}
                          >
                            ✓ AI analysis completed
                          </span>

                        )}

                      </div>

                      {/* ==================================================
                          COMPLIANCE ACTION
                      ================================================== */}

                      <div
                        className="compliance-action-area"
                        style={{
                          borderTop:
                            "1px solid #e5e7eb",
                          marginTop:
                            "16px",
                          paddingTop:
                            "16px",
                          width:
                            "100%",
                          boxSizing:
                            "border-box"
                        }}
                      >

                        <button
                          className="primary-button"
                          onClick={() =>
                            runComplianceCheck(
                              document.id
                            )
                          }
                          disabled={
                            checkingDocumentId ===
                              document.id ||
                            loadingFrameworks ||
                            !selectedFramework ||
                            frameworks.length ===
                              0 ||
                            document.status ===
                              "uploaded" ||
                            isAnalyzing
                          }
                        >

                          {checkingDocumentId ===
                          document.id
                            ? "⏳ Checking Compliance..."
                            : "✓ Run Compliance Check"}

                        </button>

                        {document.status ===
                          "uploaded" && (

                          <span
                            style={{
                              marginLeft:
                                "12px",
                              color:
                                "#6b7280",
                              fontSize:
                                "13px"
                            }}
                          >
                            Analyze the document first.
                          </span>

                        )}

                        {!selectedFramework &&
                          !loadingFrameworks &&
                          document.status !==
                            "uploaded" && (

                          <span
                            style={{
                              marginLeft:
                                "12px",
                              color:
                                "#6b7280"
                            }}
                          >
                            Select a framework first.
                          </span>

                        )}

                        {documentError && (
                          <div
                            style={{
                              marginTop:
                                "12px",
                              padding:
                                "10px 12px",
                              borderRadius:
                                "8px",
                              background:
                                "#fef2f2",
                              color:
                                "#b91c1c"
                            }}
                          >
                            ⚠ {documentError}
                          </div>
                        )}

                        {documentSuccess && (
                          <div
                            style={{
                              marginTop:
                                "12px",
                              padding:
                                "10px 12px",
                              borderRadius:
                                "8px",
                              background:
                                "#f0fdf4",
                              color:
                                "#15803d"
                            }}
                          >
                            ✓ {documentSuccess}
                          </div>
                        )}

                      </div>

                      {/* ==================================================
                          COMPLIANCE RESULTS
                      ================================================== */}

                      {result && (

                        <div
                          className="compliance-result-panel"
                          style={{
                            display:
                              "block",
                            width:
                              "100%",
                            boxSizing:
                              "border-box",
                            marginTop:
                              "20px",
                            padding:
                              "24px",
                            borderRadius:
                              "12px",
                            background:
                              "#f8fafc",
                            border:
                              "1px solid #e2e8f0",
                            overflow:
                              "hidden"
                          }}
                        >

                          {/* RESULT HEADER */}

                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              flexWrap:
                                "wrap",
                              gap:
                                "16px",
                              marginBottom:
                                "24px"
                            }}
                          >

                            <div>

                              <h3
                                style={{
                                  margin:
                                    0,
                                  fontSize:
                                    "20px"
                                }}
                              >
                                Compliance Results
                              </h3>

                              <p
                                style={{
                                  margin:
                                    "6px 0 0 0",
                                  color:
                                    "#64748b"
                                }}
                              >
                                Framework:{" "}
                                <strong>
                                  {result.framework}
                                </strong>
                              </p>

                            </div>

                            <div
                              style={{
                                fontSize:
                                  "32px",
                                fontWeight:
                                  "700",
                                lineHeight:
                                  "1"
                              }}
                              className={getScoreClass(
                                result.score
                              )}
                            >
                              {result.score}%
                            </div>

                          </div>

                          {/* SCORE SUMMARY */}

                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "repeat(4, minmax(0, 1fr))",
                              gap:
                                "12px",
                              marginBottom:
                                "28px"
                            }}
                          >

                            {[
                              [
                                "Total",
                                result.total_requirements
                              ],
                              [
                                "Matched",
                                result.matched_requirements
                              ],
                              [
                                "Review",
                                result.results.filter(
                                  (item) =>
                                    item.status ===
                                    "review"
                                ).length
                              ],
                              [
                                "Missing",
                                result.missing_requirements
                              ]
                            ].map(
                              ([label, value]) => (
                                <div
                                  key={label}
                                  style={{
                                    padding:
                                      "16px",
                                    background:
                                      "#ffffff",
                                    border:
                                      "1px solid #e2e8f0",
                                    borderRadius:
                                      "10px"
                                  }}
                                >

                                  <span
                                    style={{
                                      display:
                                        "block",
                                      color:
                                        "#64748b",
                                      fontSize:
                                        "13px",
                                      marginBottom:
                                        "6px"
                                    }}
                                  >
                                    {label}
                                  </span>

                                  <strong
                                    style={{
                                      fontSize:
                                        "22px"
                                    }}
                                  >
                                    {value}
                                  </strong>

                                </div>
                              )
                            )}

                          </div>

                          {/* ==================================================
                              RISK ASSESSMENT
                          ================================================== */}

                          {result.risk && (

                            <div
                              style={{
                                marginBottom:
                                  "28px",
                                padding:
                                  "20px",
                                borderRadius:
                                  "12px",
                                background:
                                  "#ffffff",
                                border:
                                  "1px solid #e2e8f0"
                              }}
                            >

                              <div
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  gap:
                                    "16px",
                                  flexWrap:
                                    "wrap",
                                  marginBottom:
                                    "18px"
                                }}
                              >

                                <div>

                                  <h4
                                    style={{
                                      margin:
                                        "0 0 6px 0",
                                      fontSize:
                                        "18px"
                                    }}
                                  >
                                    ⚠ Risk Assessment
                                  </h4>

                                  <p
                                    style={{
                                      margin:
                                        0,
                                      color:
                                        "#64748b",
                                      fontSize:
                                        "14px"
                                    }}
                                  >
                                    Risk is calculated from
                                    requirement severity and
                                    compliance status.
                                  </p>

                                </div>

                                <span
                                  className={`document-status ${getRiskClass(
                                    result.risk.overall_risk_level
                                  )}`}
                                  style={{
                                    fontSize:
                                      "14px",
                                    padding:
                                      "8px 12px"
                                  }}
                                >
                                  {getRiskLabel(
                                    result.risk.overall_risk_level
                                  )}
                                </span>

                              </div>

                              <div
                                style={{
                                  display:
                                    "grid",
                                  gridTemplateColumns:
                                    "repeat(4, minmax(0, 1fr))",
                                  gap:
                                    "12px",
                                  marginBottom:
                                    "22px"
                                }}
                              >

                                {[
                                  [
                                    "Total Risk",
                                    result.risk.total_risk
                                  ],
                                  [
                                    "Average Risk",
                                    result.risk.average_risk
                                  ],
                                  [
                                    "Highest Risk",
                                    result.risk.highest_risk
                                  ],
                                  [
                                    "Requirements",
                                    result.risk.total_requirements
                                  ]
                                ].map(
                                  ([label, value]) => (
                                    <div
                                      key={label}
                                      style={{
                                        padding:
                                          "14px",
                                        background:
                                          "#f8fafc",
                                        border:
                                          "1px solid #e2e8f0",
                                        borderRadius:
                                          "10px"
                                      }}
                                    >

                                      <span
                                        style={{
                                          display:
                                            "block",
                                          color:
                                            "#64748b",
                                          fontSize:
                                            "13px",
                                          marginBottom:
                                            "6px"
                                        }}
                                      >
                                        {label}
                                      </span>

                                      <strong
                                        style={{
                                          fontSize:
                                            "22px"
                                        }}
                                      >
                                        {value}
                                      </strong>

                                    </div>
                                  )
                                )}

                              </div>

                              {result.risk.risks &&
                                result.risk.risks.length >
                                  0 && (

                                <div>

                                  <h5
                                    style={{
                                      margin:
                                        "0 0 14px 0",
                                      fontSize:
                                        "15px"
                                    }}
                                  >
                                    Risk by Requirement
                                  </h5>

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      flexDirection:
                                        "column",
                                      gap:
                                        "10px"
                                    }}
                                  >

                                    {result.risk.risks.map(
                                      (risk) => (
                                        <div
                                          key={
                                            risk.requirement_id
                                          }
                                          style={{
                                            display:
                                              "flex",
                                            justifyContent:
                                              "space-between",
                                            alignItems:
                                              "center",
                                            gap:
                                              "16px",
                                            flexWrap:
                                              "wrap",
                                            padding:
                                              "14px 16px",
                                            background:
                                              "#f8fafc",
                                            border:
                                              "1px solid #e2e8f0",
                                            borderRadius:
                                              "10px"
                                          }}
                                        >

                                          <div
                                            style={{
                                              flex:
                                                "1",
                                              minWidth:
                                                "220px"
                                            }}
                                          >

                                            <strong
                                              style={{
                                                display:
                                                  "block",
                                                marginBottom:
                                                  "6px"
                                              }}
                                            >
                                              {risk.title}
                                            </strong>

                                            <span
                                              style={{
                                                color:
                                                  "#64748b",
                                                fontSize:
                                                  "13px"
                                              }}
                                            >
                                              Severity:{" "}
                                              <strong>
                                                {risk.severity}
                                              </strong>
                                              {" · "}
                                              Status:{" "}
                                              <strong>
                                                {getResultStatusText(
                                                  risk.status
                                                )}
                                              </strong>
                                            </span>

                                          </div>

                                          <div
                                            style={{
                                              display:
                                                "flex",
                                              alignItems:
                                                "center",
                                              gap:
                                                "12px"
                                            }}
                                          >

                                            <div
                                              style={{
                                                textAlign:
                                                  "right"
                                              }}
                                            >

                                              <span
                                                style={{
                                                  display:
                                                    "block",
                                                  color:
                                                    "#64748b",
                                                  fontSize:
                                                    "12px"
                                                }}
                                              >
                                                Risk Score
                                              </span>

                                              <strong>
                                                {risk.risk_score}
                                              </strong>

                                            </div>

                                            <span
                                              className={`document-status ${getRiskClass(
                                                risk.risk_level
                                              )}`}
                                            >
                                              {getRiskLabel(
                                                risk.risk_level
                                              )}
                                            </span>

                                          </div>

                                        </div>
                                      )
                                    )}

                                  </div>

                                </div>

                              )}

                            </div>

                          )}

                          {/* ==================================================
                              REQUIREMENT RESULTS
                          ================================================== */}

                          <div>

                            <h4
                              style={{
                                marginBottom:
                                  "16px"
                              }}
                            >
                              Requirement Results
                            </h4>

                            {result.results.map(
                              (item) => (

                                <div
                                  key={
                                    item.requirement_id
                                  }
                                  style={{
                                    width:
                                      "100%",
                                    boxSizing:
                                      "border-box",
                                    padding:
                                      "20px",
                                    marginBottom:
                                      "14px",
                                    background:
                                      "#ffffff",
                                    border:
                                      "1px solid #e2e8f0",
                                    borderRadius:
                                      "10px"
                                  }}
                                >

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      alignItems:
                                        "flex-start",
                                      gap:
                                        "20px",
                                      flexWrap:
                                        "wrap",
                                      marginBottom:
                                        "16px"
                                    }}
                                  >

                                    <div
                                      style={{
                                        minWidth:
                                          0,
                                        flex:
                                          "1"
                                      }}
                                    >

                                      <h4
                                        style={{
                                          margin:
                                            "0 0 12px 0",
                                          fontSize:
                                            "18px"
                                        }}
                                      >
                                        {item.title}
                                      </h4>

                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          flexDirection:
                                            "column",
                                          gap:
                                            "6px",
                                          color:
                                            "#475569",
                                          fontSize:
                                            "14px"
                                        }}
                                      >

                                        <div>
                                          <strong>
                                            Category:
                                          </strong>{" "}
                                          {item.category}
                                        </div>

                                        <div>
                                          <strong>
                                            Severity:
                                          </strong>{" "}
                                          {item.severity}
                                        </div>

                                      </div>

                                    </div>

                                    <span
                                      className={`document-status ${getResultStatusClass(
                                        item.status
                                      )}`}
                                      style={{
                                        flexShrink:
                                          0
                                      }}
                                    >
                                      {getResultStatusText(
                                        item.status
                                      )}
                                    </span>

                                  </div>

                                  <div
                                    style={{
                                      padding:
                                        "14px 16px",
                                      marginBottom:
                                        "18px",
                                      background:
                                        "#f8fafc",
                                      borderRadius:
                                        "8px",
                                      color:
                                        "#475569",
                                      lineHeight:
                                        "1.6",
                                      overflowWrap:
                                        "anywhere"
                                    }}
                                  >

                                    <strong
                                      style={{
                                        display:
                                          "block",
                                        marginBottom:
                                          "6px",
                                        color:
                                          "#1e293b"
                                      }}
                                    >
                                      Explanation
                                    </strong>

                                    {item.explanation}

                                  </div>

                                  {item.evidence &&
                                    item.evidence.length >
                                      0 && (

                                    <div>

                                      <h5
                                        style={{
                                          marginBottom:
                                            "12px",
                                          fontSize:
                                            "15px"
                                        }}
                                      >
                                        Evidence
                                      </h5>

                                      {item.evidence.map(
                                        (evidence) => (

                                          <div
                                            key={
                                              evidence.evidence_number
                                            }
                                            style={{
                                              padding:
                                                "14px",
                                              marginBottom:
                                                "10px",
                                              background:
                                                "#f8fafc",
                                              border:
                                                "1px solid #e2e8f0",
                                              borderRadius:
                                                "8px",
                                              overflowWrap:
                                                "anywhere"
                                            }}
                                          >

                                            <div
                                              style={{
                                                display:
                                                  "flex",
                                                justifyContent:
                                                  "space-between",
                                                gap:
                                                  "12px",
                                                flexWrap:
                                                  "wrap",
                                                marginBottom:
                                                  "8px"
                                              }}
                                            >

                                              <strong>
                                                Evidence{" "}
                                                {
                                                  evidence.evidence_number
                                                }
                                              </strong>

                                              <span
                                                style={{
                                                  fontWeight:
                                                    "600",
                                                  color:
                                                    "#475569"
                                                }}
                                              >
                                                Similarity:{" "}
                                                {(
                                                  evidence.similarity_score *
                                                  100
                                                ).toFixed(1)}
                                                %
                                              </span>

                                            </div>

                                            <p
                                              style={{
                                                margin:
                                                  0,
                                                lineHeight:
                                                  "1.6",
                                                color:
                                                  "#475569"
                                              }}
                                            >
                                              {evidence.text}
                                            </p>

                                          </div>

                                        )
                                      )}

                                    </div>

                                  )}

                                  {(!item.evidence ||
                                    item.evidence.length ===
                                      0) && (

                                    <div
                                      style={{
                                        padding:
                                          "12px 14px",
                                        background:
                                          "#f8fafc",
                                        borderRadius:
                                          "8px",
                                        color:
                                          "#64748b"
                                      }}
                                    >
                                      No relevant evidence
                                      was found.
                                    </div>

                                  )}

                                </div>

                              )
                            )}

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          RISK HISTORY
                      ================================================== */}

                      <div
                        style={{
                          marginTop:
                            "20px",
                          padding:
                            "20px",
                          borderRadius:
                            "12px",
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e2e8f0"
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap:
                              "16px",
                            flexWrap:
                              "wrap",
                            marginBottom:
                              "18px"
                          }}
                        >

                          <div>

                            <h4
                              style={{
                                margin:
                                  "0 0 6px 0",
                                fontSize:
                                  "18px"
                              }}
                            >
                              🕘 Risk History
                            </h4>

                            <p
                              style={{
                                margin:
                                  0,
                                color:
                                  "#64748b",
                                fontSize:
                                  "14px"
                              }}
                            >
                              Historical risk assessments
                              recorded during compliance checks.
                            </p>

                          </div>

                          <button
                            className="primary-button"
                            onClick={() =>
                              fetchRiskHistory(
                                document.id
                              )
                            }
                            disabled={
                              riskLoading
                            }
                            style={{
                              padding:
                                "8px 14px"
                            }}
                          >
                            {riskLoading
                              ? "⏳ Loading..."
                              : "↻ Refresh History"}
                          </button>

                        </div>

                        {riskLoading && (
                          <div
                            style={{
                              padding:
                                "16px",
                              background:
                                "#f8fafc",
                              borderRadius:
                                "8px",
                              color:
                                "#64748b"
                            }}
                          >
                            Loading stored risk
                            assessments...
                          </div>
                        )}

                        {!riskLoading &&
                          riskError && (
                            <div
                              style={{
                                padding:
                                  "12px 14px",
                                background:
                                  "#fef2f2",
                                borderRadius:
                                  "8px",
                                color:
                                  "#b91c1c"
                              }}
                            >
                              ⚠ {riskError}
                            </div>
                          )}

                        {!riskLoading &&
                          !riskError &&
                          storedRiskHistory &&
                          storedRiskHistory.total_risks ===
                            0 && (
                            <div
                              style={{
                                padding:
                                  "16px",
                                background:
                                  "#f8fafc",
                                borderRadius:
                                  "8px",
                                color:
                                  "#64748b"
                              }}
                            >
                              No stored risk history is
                              available yet.
                            </div>
                          )}

                        {!riskLoading &&
                          !riskError &&
                          storedRiskHistory &&
                          storedRiskHistory.total_risks >
                            0 && (

                            <div>

                              <div
                                style={{
                                  padding:
                                    "12px 16px",
                                  background:
                                    "#f8fafc",
                                  border:
                                    "1px solid #e2e8f0",
                                  borderRadius:
                                    "10px",
                                  marginBottom:
                                    "18px",
                                  display:
                                    "inline-block"
                                }}
                              >

                                <span
                                  style={{
                                    display:
                                      "block",
                                    color:
                                      "#64748b",
                                    fontSize:
                                      "12px",
                                    marginBottom:
                                      "4px"
                                  }}
                                >
                                  Stored Risk Records
                                </span>

                                <strong
                                  style={{
                                    fontSize:
                                      "20px"
                                  }}
                                >
                                  {
                                    storedRiskHistory.total_risks
                                  }
                                </strong>

                              </div>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexDirection:
                                    "column",
                                  gap:
                                    "10px"
                                }}
                              >

                                {storedRiskHistory.risks.map(
                                  (risk) => (
                                    <div
                                      key={
                                        risk.id
                                      }
                                      style={{
                                        padding:
                                          "14px 16px",
                                        background:
                                          "#f8fafc",
                                        border:
                                          "1px solid #e2e8f0",
                                        borderRadius:
                                          "10px"
                                      }}
                                    >

                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          justifyContent:
                                            "space-between",
                                          alignItems:
                                            "flex-start",
                                          gap:
                                            "16px",
                                          flexWrap:
                                            "wrap"
                                        }}
                                      >

                                        <div
                                          style={{
                                            flex:
                                              "1",
                                            minWidth:
                                              "220px"
                                          }}
                                        >

                                          <strong
                                            style={{
                                              display:
                                                "block",
                                              marginBottom:
                                                "6px"
                                            }}
                                          >
                                            {risk.title}
                                          </strong>

                                          <div
                                            style={{
                                              color:
                                                "#64748b",
                                              fontSize:
                                                "13px",
                                              lineHeight:
                                                "1.7"
                                            }}
                                          >

                                            <div>
                                              Framework:{" "}
                                              <strong>
                                                {risk.framework ||
                                                  "Not recorded"}
                                              </strong>
                                            </div>

                                            <div>
                                              Requirement:{" "}
                                              <strong>
                                                #{risk.requirement_id}
                                              </strong>
                                            </div>

                                            <div>
                                              Severity:{" "}
                                              <strong>
                                                {risk.severity}
                                              </strong>
                                              {" · "}
                                              Status:{" "}
                                              <strong>
                                                {getResultStatusText(
                                                  risk.status
                                                )}
                                              </strong>
                                            </div>

                                            <div>
                                              Check Run:{" "}
                                              <span
                                                style={{
                                                  fontFamily:
                                                    "monospace",
                                                  fontSize:
                                                    "12px"
                                                }}
                                              >
                                                {risk.check_run_id}
                                              </span>
                                            </div>

                                            <div>
                                              Recorded:{" "}
                                              {formatDate(
                                                risk.created_at
                                              )}
                                            </div>

                                          </div>

                                        </div>

                                        <div
                                          style={{
                                            display:
                                              "flex",
                                            alignItems:
                                              "center",
                                            gap:
                                              "14px"
                                          }}
                                        >

                                          <div
                                            style={{
                                              textAlign:
                                                "right"
                                            }}
                                          >

                                            <span
                                              style={{
                                                display:
                                                  "block",
                                                color:
                                                  "#64748b",
                                                fontSize:
                                                  "12px",
                                                marginBottom:
                                                  "4px"
                                              }}
                                            >
                                              Risk Score
                                            </span>

                                            <strong
                                              style={{
                                                fontSize:
                                                  "20px"
                                              }}
                                            >
                                              {risk.risk_score}
                                            </strong>

                                          </div>

                                          <span
                                            className={`document-status ${getRiskClass(
                                              risk.risk_level
                                            )}`}
                                          >
                                            {getRiskLabel(
                                              risk.risk_level
                                            )}
                                          </span>

                                        </div>

                                      </div>

                                    </div>
                                  )
                                )}

                              </div>

                            </div>
                          )}

                      </div>

                      {/* ==================================================
                          AUDIT HISTORY
                      ================================================== */}

                      <div
                        style={{
                          marginTop:
                            "20px",
                          padding:
                            "20px",
                          borderRadius:
                            "12px",
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e2e8f0"
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap:
                              "16px",
                            flexWrap:
                              "wrap",
                            marginBottom:
                              "18px"
                          }}
                        >

                          <div>

                            <h4
                              style={{
                                margin:
                                  "0 0 6px 0",
                                fontSize:
                                  "18px"
                              }}
                            >
                              📋 Audit History
                            </h4>

                            <p
                              style={{
                                margin:
                                  0,
                                color:
                                  "#64748b",
                                fontSize:
                                  "14px"
                              }}
                            >
                              Previously generated audit reports
                              for this document.
                            </p>

                          </div>

                          <button
                            className="primary-button"
                            onClick={() =>
                              fetchAuditHistory(
                                document.id
                              )
                            }
                            disabled={
                              auditLoading
                            }
                            style={{
                              padding:
                                "8px 14px"
                            }}
                          >
                            {auditLoading
                              ? "⏳ Loading..."
                              : "↻ Refresh History"}
                          </button>

                        </div>

                        {auditLoading && (
                          <div
                            style={{
                              padding:
                                "16px",
                              background:
                                "#f8fafc",
                              borderRadius:
                                "8px",
                              color:
                                "#64748b"
                            }}
                          >
                            Loading audit history...
                          </div>
                        )}

                        {!auditLoading &&
                          auditError && (
                            <div
                              style={{
                                padding:
                                  "12px 14px",
                                background:
                                  "#fef2f2",
                                borderRadius:
                                  "8px",
                                color:
                                  "#b91c1c"
                              }}
                            >
                              ⚠ {auditError}
                            </div>
                          )}

                        {!auditLoading &&
                          !auditError &&
                          storedAuditHistory &&
                          storedAuditHistory.length ===
                            0 && (
                            <div
                              style={{
                                padding:
                                  "16px",
                                background:
                                  "#f8fafc",
                                borderRadius:
                                  "8px",
                                color:
                                  "#64748b"
                              }}
                            >
                              No audit reports have been
                              generated for this document yet.
                            </div>
                          )}

                        {!auditLoading &&
                          !auditError &&
                          storedAuditHistory &&
                          storedAuditHistory.length >
                            0 && (

                            <div>

                              <div
                                style={{
                                  padding:
                                    "12px 16px",
                                  background:
                                    "#f8fafc",
                                  border:
                                    "1px solid #e2e8f0",
                                  borderRadius:
                                    "10px",
                                  marginBottom:
                                    "18px",
                                  display:
                                    "inline-block"
                                }}
                              >

                                <span
                                  style={{
                                    display:
                                      "block",
                                    color:
                                      "#64748b",
                                    fontSize:
                                      "12px",
                                    marginBottom:
                                      "4px"
                                  }}
                                >
                                  Generated Reports
                                </span>

                                <strong
                                  style={{
                                    fontSize:
                                      "20px"
                                  }}
                                >
                                  {
                                    storedAuditHistory.length
                                  }
                                </strong>

                              </div>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexDirection:
                                    "column",
                                  gap:
                                    "10px"
                                }}
                              >

                                {storedAuditHistory.map(
                                  (report) => (
                                    <div
                                      key={
                                        report.id
                                      }
                                      style={{
                                        padding:
                                          "16px",
                                        background:
                                          "#f8fafc",
                                        border:
                                          "1px solid #e2e8f0",
                                        borderRadius:
                                          "10px"
                                      }}
                                    >

                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          justifyContent:
                                            "space-between",
                                          alignItems:
                                            "flex-start",
                                          gap:
                                            "16px",
                                          flexWrap:
                                            "wrap"
                                        }}
                                      >

                                        <div
                                          style={{
                                            flex:
                                              "1",
                                            minWidth:
                                              "240px"
                                          }}
                                        >

                                          <strong
                                            style={{
                                              display:
                                                "block",
                                              marginBottom:
                                                "8px",
                                              fontSize:
                                                "16px"
                                            }}
                                          >
                                            {report.report_title ||
                                              "Compliance Audit Report"}
                                          </strong>

                                          <div
                                            style={{
                                              color:
                                                "#64748b",
                                              fontSize:
                                                "13px",
                                              lineHeight:
                                                "1.7"
                                            }}
                                          >

                                            <div>
                                              Framework:{" "}
                                              <strong>
                                                {report.framework ||
                                                  "Not specified"}
                                              </strong>
                                            </div>

                                            <div>
                                              Status:{" "}
                                              <strong>
                                                {report.status ||
                                                  "Unknown"}
                                              </strong>
                                            </div>

                                            <div>
                                              Generated:{" "}
                                              {formatDate(
                                                report.generated_at
                                              )}
                                            </div>

                                            <div>
                                              Report ID:{" "}
                                              <strong>
                                                #{report.id}
                                              </strong>
                                            </div>

                                          </div>

                                        </div>

                                        <div
                                          style={{
                                            display:
                                              "flex",
                                            alignItems:
                                              "center",
                                            gap:
                                              "10px",
                                            flexWrap:
                                              "wrap"
                                          }}
                                        >

                                          <span
                                            className={`document-status ${getAuditStatusClass(
                                              report.status
                                            )}`}
                                          >
                                            {report.status ||
                                              "Unknown"}
                                          </span>

                                          <button
                                            className="primary-button"
                                            onClick={() =>
                                              window.open(
                                                `${API_BASE_URL}/documents/${document.id}/audit-report/pdf`,
                                                "_blank"
                                              )
                                            }
                                            style={{
                                              padding:
                                                "8px 14px"
                                            }}
                                          >
                                            ⬇ Download Latest PDF
                                          </button>

                                        </div>

                                      </div>

                                    </div>
                                  )
                                )}

                              </div>

                              {latestAuditReport && (
                                <p
                                  style={{
                                    margin:
                                      "14px 0 0 0",
                                    color:
                                      "#64748b",
                                    fontSize:
                                      "13px"
                                  }}
                                >
                                  Latest report:
                                  {" "}
                                  <strong>
                                    {latestAuditReport.framework ||
                                      "Not specified"}
                                  </strong>
                                  {" · "}
                                  {formatDate(
                                    latestAuditReport.generated_at
                                  )}
                                </p>
                              )}

                            </div>
                          )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

      </section>

    </div>
  );
}

export default Documents;