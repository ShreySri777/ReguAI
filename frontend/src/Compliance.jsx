import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function Compliance() {
  const [documents, setDocuments] = useState([]);
  const [frameworks, setFrameworks] = useState([]);

  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("");

  const [results, setResults] = useState(null);

  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [checking, setChecking] = useState(false);

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
        throw new Error(
          "Unable to load documents."
        );
      }

      const data = await response.json();

      setDocuments(data);

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
  // LOAD FRAMEWORKS
  // ==========================================================

  const fetchFrameworks = async () => {
    try {
      setLoadingFrameworks(true);
      setError("");

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
        Array.isArray(data.frameworks)
          ? data.frameworks
          : [];

      setFrameworks(availableFrameworks);

      // Automatically select the first available framework.
      if (availableFrameworks.length > 0) {
        setSelectedFramework(
          availableFrameworks[0]
        );
      }

    } catch (err) {
      console.error(err);

      setError(
        "Unable to load compliance frameworks."
      );

    } finally {
      setLoadingFrameworks(false);
    }
  };

  // ==========================================================
  // INITIAL DATA LOAD
  // ==========================================================

  useEffect(() => {
    fetchDocuments();
    fetchFrameworks();
  }, []);

  // ==========================================================
  // RUN COMPLIANCE CHECK
  // ==========================================================

  const runComplianceCheck = async () => {
    if (!selectedDocumentId) {
      setError(
        "Please select a document first."
      );

      setSuccess("");

      return;
    }

    if (!selectedFramework) {
      setError(
        "Please select a compliance framework first."
      );

      setSuccess("");

      return;
    }

    try {
      setChecking(true);
      setError("");
      setSuccess("");
      setResults(null);

      const response = await fetch(
        `${API_BASE_URL}/documents/${selectedDocumentId}/compliance-check?framework=${encodeURIComponent(
          selectedFramework
        )}`,
        {
          method: "POST"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to run compliance check."
        );
      }

      setResults(data);

      setSuccess(
        `Compliance check completed successfully using the ${selectedFramework} framework.`
      );

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to run compliance check."
      );

    } finally {
      setChecking(false);
    }
  };

  // ==========================================================
  // STATUS HELPERS
  // ==========================================================

  const getResultClass = (status) => {
    if (status === "matched") {
      return "compliance-result-matched";
    }

    if (status === "review") {
      return "compliance-result-review";
    }

    return "compliance-result-missing";
  };

  const getResultLabel = (status) => {
    if (status === "matched") {
      return "Matched";
    }

    if (status === "review") {
      return "Manual Review";
    }

    return "Missing";
  };

  const getStatusIcon = (status) => {
    if (status === "matched") {
      return "✓";
    }

    if (status === "review") {
      return "◐";
    }

    return "⚠";
  };

  const getScoreClass = (score) => {
    if (score >= 90) {
      return "score-excellent";
    }

    if (score >= 70) {
      return "score-good";
    }

    if (score >= 40) {
      return "score-warning";
    }

    return "score-danger";
  };

  const getOverallStatus = (score) => {
    if (score >= 90) {
      return "Fully Compliant";
    }

    if (score >= 70) {
      return "Mostly Compliant";
    }

    if (score >= 40) {
      return "Partially Compliant";
    }

    return "Non-Compliant";
  };

  const getEvidenceClass = (score) => {
    if (score >= 0.70) {
      return "evidence-score-high";
    }

    if (score >= 0.45) {
      return "evidence-score-medium";
    }

    return "evidence-score-low";
  };

  return (
    <div className="compliance-page">

      <style>
        {`
          .compliance-page {
            max-width: 1200px;
            margin: 0 auto;
          }

          .compliance-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 28px;
            gap: 20px;
          }

          .compliance-header h1 {
            margin: 0 0 8px;
            font-size: 28px;
            color: #172033;
          }

          .compliance-header p {
            margin: 0;
            color: #7b8798;
            font-size: 14px;
          }

          .compliance-card {
            background: #ffffff;
            border: 1px solid #e7ebf1;
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 22px;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          }

          .compliance-card h2 {
            margin: 0 0 7px;
            color: #172033;
            font-size: 18px;
          }

          .compliance-card-description {
            margin: 0 0 20px;
            color: #8792a3;
            font-size: 13px;
          }

          .document-selection {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 14px;
            align-items: flex-end;
          }

          .document-select-wrapper {
            flex: 1;
          }

          .document-select-wrapper label {
            display: block;
            margin-bottom: 8px;
            color: #344054;
            font-size: 13px;
            font-weight: 600;
          }

          .document-select {
            width: 100%;
            box-sizing: border-box;
            padding: 12px 14px;
            border: 1px solid #d7dde7;
            border-radius: 9px;
            background: #ffffff;
            color: #172033;
            font-size: 14px;
            outline: none;
          }

          .document-select:focus {
            border-color: #2864e8;
            box-shadow: 0 0 0 3px rgba(40, 100, 232, 0.10);
          }

          .run-check-button {
            border: none;
            border-radius: 9px;
            padding: 12px 20px;
            background: #2864e8;
            color: white;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            min-width: 170px;
          }

          .run-check-button:hover {
            background: #1f56cf;
          }

          .run-check-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .compliance-message {
            border-radius: 9px;
            padding: 13px 16px;
            margin-bottom: 20px;
            font-size: 14px;
          }

          .compliance-error {
            background: #fff1f1;
            border: 1px solid #ffd2d2;
            color: #c62828;
          }

          .compliance-success {
            background: #ecfdf3;
            border: 1px solid #b7ebc9;
            color: #18794e;
          }

          .compliance-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-top: 20px;
          }

          .compliance-summary-item {
            border: 1px solid #e8edf3;
            border-radius: 11px;
            padding: 18px;
            background: #fafbfd;
          }

          .compliance-summary-item span {
            display: block;
            color: #7b8798;
            font-size: 12px;
            margin-bottom: 8px;
          }

          .compliance-summary-item strong {
            display: block;
            color: #172033;
            font-size: 24px;
          }

          .score-panel {
            display: flex;
            align-items: center;
            gap: 26px;
            margin-bottom: 22px;
          }

          .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: #f4f7ff;
            border: 8px solid #dce7ff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
          }

          .score-circle strong {
            font-size: 27px;
          }

          .score-circle span {
            margin-top: 3px;
            font-size: 11px;
            color: #7b8798;
          }

          .score-information h3 {
            margin: 0 0 7px;
            font-size: 19px;
          }

          .score-information p {
            margin: 0;
            color: #7b8798;
            font-size: 13px;
          }

          .framework-result {
            display: inline-flex;
            align-items: center;
            margin-top: 10px;
            padding: 6px 10px;
            border-radius: 7px;
            background: #eef4ff;
            color: #2864e8;
            font-size: 12px;
            font-weight: 700;
          }

          .score-excellent {
            color: #15803d;
          }

          .score-good {
            color: #2563eb;
          }

          .score-warning {
            color: #d97706;
          }

          .score-danger {
            color: #dc2626;
          }

          .requirements-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .requirement-result {
            border: 1px solid #e7ebf1;
            border-radius: 11px;
            padding: 18px;
            background: #ffffff;
          }

          .compliance-result-matched {
            border-left: 4px solid #22c55e;
          }

          .compliance-result-review {
            border-left: 4px solid #f59e0b;
          }

          .compliance-result-missing {
            border-left: 4px solid #ef4444;
          }

          .requirement-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }

          .requirement-title {
            margin: 0 0 7px;
            color: #172033;
            font-size: 15px;
          }

          .requirement-meta {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .requirement-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            background: #f1f4f8;
            color: #667085;
          }

          .result-status {
            white-space: nowrap;
            padding: 6px 10px;
            border-radius: 7px;
            font-size: 11px;
            font-weight: 700;
          }

          .result-status.matched {
            background: #ecfdf3;
            color: #15803d;
          }

          .result-status.review {
            background: #fff7e8;
            color: #b45309;
          }

          .result-status.missing {
            background: #fff1f1;
            color: #dc2626;
          }

          .requirement-explanation {
            margin: 14px 0 0;
            padding-top: 13px;
            border-top: 1px solid #edf0f4;
            color: #5f6b7a;
            font-size: 13px;
            line-height: 1.6;
          }

          .evidence-section {
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #edf0f4;
          }

          .evidence-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          }

          .evidence-header h4 {
            margin: 0;
            color: #344054;
            font-size: 13px;
          }

          .evidence-count {
            font-size: 11px;
            color: #7b8798;
            background: #f4f6f8;
            padding: 4px 8px;
            border-radius: 6px;
          }

          .evidence-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .evidence-item {
            background: #f8fafc;
            border: 1px solid #e5e9ef;
            border-radius: 9px;
            padding: 13px;
          }

          .evidence-item-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }

          .evidence-number {
            font-size: 11px;
            font-weight: 700;
            color: #475467;
          }

          .evidence-score {
            font-size: 10px;
            font-weight: 700;
            padding: 4px 7px;
            border-radius: 5px;
          }

          .evidence-score-high {
            background: #ecfdf3;
            color: #15803d;
          }

          .evidence-score-medium {
            background: #fff7e8;
            color: #b45309;
          }

          .evidence-score-low {
            background: #fff1f1;
            color: #dc2626;
          }

          .evidence-text {
            margin: 0;
            color: #5f6b7a;
            font-size: 12px;
            line-height: 1.65;
          }

          .no-evidence {
            padding: 12px;
            background: #fafafa;
            border: 1px dashed #d5dbe3;
            border-radius: 8px;
            color: #8a94a3;
            font-size: 12px;
          }

          .evidence-note {
            margin-top: 10px;
            color: #8a94a3;
            font-size: 11px;
            line-height: 1.5;
          }

          .empty-compliance {
            text-align: center;
            padding: 42px 20px;
            color: #7b8798;
          }

          .empty-compliance-icon {
            font-size: 38px;
            margin-bottom: 10px;
          }

          .empty-compliance h3 {
            margin: 0 0 6px;
            color: #344054;
            font-size: 16px;
          }

          .empty-compliance p {
            margin: 0;
            font-size: 13px;
          }

          .loading-compliance {
            padding: 30px;
            text-align: center;
            color: #7b8798;
            font-size: 14px;
          }

          @media (max-width: 950px) {
            .document-selection {
              grid-template-columns: 1fr;
              align-items: stretch;
            }

            .run-check-button {
              width: 100%;
            }
          }

          @media (max-width: 850px) {
            .compliance-summary-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 600px) {
            .compliance-summary-grid {
              grid-template-columns: 1fr;
            }

            .score-panel {
              flex-direction: column;
              align-items: flex-start;
            }

            .requirement-top {
              flex-direction: column;
            }

            .evidence-item-top {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="compliance-header">

        <div>

          <h1>
            Compliance Check
          </h1>

          <p>
            Analyze documents against your compliance requirements
          </p>

        </div>

      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {error && (
        <div className="compliance-message compliance-error">
          ⚠ {error}
        </div>
      )}

      {success && (
        <div className="compliance-message compliance-success">
          ✓ {success}
        </div>
      )}

      {/* =====================================================
          DOCUMENT + FRAMEWORK SELECTION
      ===================================================== */}

      <section className="compliance-card">

        <h2>
          Select Analysis Configuration
        </h2>

        <p className="compliance-card-description">
          Choose a document and the regulatory framework
          that should be used for the compliance analysis.
        </p>

        {loadingDocuments || loadingFrameworks ? (

          <div className="loading-compliance">
            Loading analysis options...
          </div>

        ) : documents.length === 0 ? (

          <div className="empty-compliance">

            <div className="empty-compliance-icon">
              📄
            </div>

            <h3>
              No documents available
            </h3>

            <p>
              Upload and analyze a document before running
              a compliance check.
            </p>

          </div>

        ) : frameworks.length === 0 ? (

          <div className="empty-compliance">

            <div className="empty-compliance-icon">
              ⚖️
            </div>

            <h3>
              No compliance frameworks available
            </h3>

            <p>
              Add at least one compliance requirement
              with a framework before running an analysis.
            </p>

          </div>

        ) : (

          <div className="document-selection">

            {/* DOCUMENT */}

            <div className="document-select-wrapper">

              <label htmlFor="document-select">
                Document
              </label>

              <select
                id="document-select"
                className="document-select"
                value={selectedDocumentId}
                onChange={(event) => {
                  setSelectedDocumentId(
                    event.target.value
                  );

                  setResults(null);
                  setSuccess("");
                  setError("");
                }}
              >

                <option value="">
                  Select a document
                </option>

                {documents.map((document) => (

                  <option
                    key={document.id}
                    value={document.id}
                  >
                    #{document.id} — {document.filename}
                  </option>

                ))}

              </select>

            </div>

            {/* FRAMEWORK */}

            <div className="document-select-wrapper">

              <label htmlFor="framework-select">
                Compliance Framework
              </label>

              <select
                id="framework-select"
                className="document-select"
                value={selectedFramework}
                onChange={(event) => {
                  setSelectedFramework(
                    event.target.value
                  );

                  setResults(null);
                  setSuccess("");
                  setError("");
                }}
              >

                <option value="">
                  Select a framework
                </option>

                {frameworks.map((framework) => (

                  <option
                    key={framework}
                    value={framework}
                  >
                    {framework}
                  </option>

                ))}

              </select>

            </div>

            {/* RUN CHECK */}

            <button
              className="run-check-button"
              onClick={runComplianceCheck}
              disabled={
                checking ||
                !selectedDocumentId ||
                !selectedFramework
              }
            >
              {checking
                ? "Checking..."
                : "🔍 Run Compliance Check"}
            </button>

          </div>

        )}

      </section>

      {/* =====================================================
          RESULTS
      ===================================================== */}

      {results && (

        <>

          {/* =================================================
              SCORE
          ================================================= */}

          <section className="compliance-card">

            <h2>
              Compliance Result
            </h2>

            <p className="compliance-card-description">
              Overall compliance performance for{" "}
              <strong>
                {results.filename}
              </strong>
            </p>

            <div className="framework-result">
              ⚖ Framework: {selectedFramework}
            </div>

            <div className="score-panel">

              <div className="score-circle">

                <strong
                  className={getScoreClass(
                    results.score
                  )}
                >
                  {Number(results.score).toFixed(1)}%
                </strong>

                <span>
                  Score
                </span>

              </div>

              <div className="score-information">

                <h3
                  className={getScoreClass(
                    results.score
                  )}
                >
                  {getOverallStatus(
                    results.score
                  )}
                </h3>

                <p>
                  Compliance analysis completed against{" "}
                  {results.total_requirements} requirements.
                </p>

              </div>

            </div>

            <div className="compliance-summary-grid">

              <div className="compliance-summary-item">

                <span>
                  Total Requirements
                </span>

                <strong>
                  {results.total_requirements}
                </strong>

              </div>

              <div className="compliance-summary-item">

                <span>
                  Matched
                </span>

                <strong className="score-excellent">
                  {results.matched_requirements}
                </strong>

              </div>

              <div className="compliance-summary-item">

                <span>
                  Missing
                </span>

                <strong className="score-danger">
                  {results.missing_requirements}
                </strong>

              </div>

              <div className="compliance-summary-item">

                <span>
                  Compliance Score
                </span>

                <strong
                  className={getScoreClass(
                    results.score
                  )}
                >
                  {Number(results.score).toFixed(1)}%
                </strong>

              </div>

            </div>

          </section>

          {/* =================================================
              REQUIREMENT RESULTS
          ================================================= */}

          <section className="compliance-card">

            <h2>
              Requirement Analysis
            </h2>

            <p className="compliance-card-description">
              Detailed compliance decisions with the document
              evidence used to support each result.
            </p>

            <div className="requirements-list">

              {results.results.map((result) => (

                <div
                  key={result.requirement_id}
                  className={`requirement-result ${getResultClass(
                    result.status
                  )}`}
                >

                  {/* REQUIREMENT HEADER */}

                  <div className="requirement-top">

                    <div>

                      <h3 className="requirement-title">
                        {result.title}
                      </h3>

                      <div className="requirement-meta">

                        <span className="requirement-badge">
                          {result.category}
                        </span>

                        <span className="requirement-badge">
                          {result.severity}
                        </span>

                      </div>

                    </div>

                    <span
                      className={`result-status ${
                        result.status === "matched"
                          ? "matched"
                          : result.status === "review"
                            ? "review"
                            : "missing"
                      }`}
                    >
                      {getStatusIcon(result.status)}{" "}
                      {getResultLabel(result.status)}
                    </span>

                  </div>

                  {/* EXPLANATION */}

                  <p className="requirement-explanation">

                    <strong>
                      {getResultLabel(
                        result.status
                      )}
                      :
                    </strong>{" "}

                    {result.explanation}

                  </p>

                  {/* EVIDENCE */}

                  <div className="evidence-section">

                    <div className="evidence-header">

                      <h4>
                        🔎 Retrieved Evidence
                      </h4>

                      <span className="evidence-count">
                        {result.evidence?.length || 0} passage
                        {result.evidence?.length === 1
                          ? ""
                          : "s"}
                      </span>

                    </div>

                    {result.evidence &&
                    result.evidence.length > 0 ? (

                      <div className="evidence-list">

                        {result.evidence.map(
                          (evidence) => {

                            const similarity =
                              Number(
                                evidence.similarity_score
                              );

                            return (
                              <div
                                className="evidence-item"
                                key={
                                  evidence.evidence_number
                                }
                              >

                                <div className="evidence-item-top">

                                  <span className="evidence-number">
                                    Evidence #
                                    {
                                      evidence.evidence_number
                                    }
                                  </span>

                                  <span
                                    className={`evidence-score ${getEvidenceClass(
                                      similarity
                                    )}`}
                                  >
                                    Similarity:{" "}
                                    {(
                                      similarity * 100
                                    ).toFixed(1)}
                                    %
                                  </span>

                                </div>

                                <p className="evidence-text">
                                  {evidence.text}
                                </p>

                              </div>
                            );
                          }
                        )}

                      </div>

                    ) : (

                      <div className="no-evidence">
                        No relevant evidence passages were
                        retrieved from this document.
                      </div>

                    )}

                    {result.status === "missing" &&
                    result.evidence &&
                    result.evidence.length > 0 && (

                      <p className="evidence-note">
                        ℹ The passages above are the closest
                        retrieved matches, but their similarity
                        was not strong enough to establish
                        compliance.
                      </p>

                    )}

                    {result.status === "review" &&
                    result.evidence &&
                    result.evidence.length > 0 && (

                      <p className="evidence-note">
                        ℹ Potentially relevant evidence was
                        retrieved. Manual verification is
                        recommended before considering this
                        requirement compliant.
                      </p>

                    )}

                  </div>

                </div>

              ))}

            </div>

          </section>

        </>

      )}

    </div>
  );
}

export default Compliance;