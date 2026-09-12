import {
  BrowserRouter,
  Routes,
  Route,
  NavLink
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import "./App.css";

import Documents from "./Documents";
import DocumentDetails from "./DocumentDetails";
import Compliance from "./Compliance";
import ComplianceGaps from "./ComplianceGaps";
import AuditReports from "./AuditReports";
import Requirements from "./Requirements";


const API_BASE_URL = "http://127.0.0.1:8000";


// ==========================================================
// DASHBOARD
// ==========================================================

function Dashboard() {

  const [dashboard, setDashboard] = useState(null);

  const [documents, setDocuments] = useState([]);

  const [frameworks, setFrameworks] = useState([]);

  const [selectedFramework, setSelectedFramework] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [noRequirements, setNoRequirements] = useState(false);


  // ========================================================
  // FETCH FRAMEWORKS
  // ========================================================

  const fetchFrameworks = async () => {

    try {

      const response = await fetch(
        `${API_BASE_URL}/frameworks`
      );

      if (!response.ok) {

        throw new Error(
          "Unable to load compliance frameworks."
        );

      }

      const data = await response.json();

      setFrameworks(
        data.frameworks || []
      );

    } catch (err) {

      console.error(
        "Framework loading error:",
        err
      );

    }

  };


  // ========================================================
  // FETCH DASHBOARD
  // ========================================================

  const fetchDashboard = async () => {

    try {

      setLoading(true);

      setError("");

      setNoRequirements(false);


      const dashboardUrl =
        selectedFramework
          ? `${API_BASE_URL}/compliance-dashboard?framework=${encodeURIComponent(
              selectedFramework
            )}`
          : `${API_BASE_URL}/compliance-dashboard`;


      const [
        dashboardResponse,
        documentsResponse
      ] = await Promise.all([

        fetch(
          dashboardUrl
        ),

        fetch(
          `${API_BASE_URL}/documents`
        )

      ]);


      // ====================================================
      // DOCUMENTS RESPONSE
      // ====================================================

      if (!documentsResponse.ok) {

        throw new Error(
          "Unable to load documents."
        );

      }


      const documentsData =
        await documentsResponse.json();


      setDocuments(
        documentsData
      );


      // ====================================================
      // FRAMEWORK HAS NO REQUIREMENTS
      // ====================================================

      if (
        !dashboardResponse.ok &&
        dashboardResponse.status === 404
      ) {

        let errorData = {};

        try {

          errorData =
            await dashboardResponse.json();

        } catch {

          errorData = {};

        }


        const detail =
          typeof errorData.detail === "string"
            ? errorData.detail
            : "";


        if (
          detail.toLowerCase().includes(
            "no compliance requirements"
          )
        ) {

          setDashboard(null);

          setNoRequirements(true);

          return;

        }

      }


      // ====================================================
      // OTHER DASHBOARD ERRORS
      // ====================================================

      if (!dashboardResponse.ok) {

        throw new Error(
          "Unable to load compliance dashboard."
        );

      }


      // ====================================================
      // SUCCESSFUL DASHBOARD RESPONSE
      // ====================================================

      const dashboardData =
        await dashboardResponse.json();


      setDashboard(
        dashboardData
      );

    } catch (err) {

      console.error(
        "Dashboard loading error:",
        err
      );


      setError(
        "Unable to connect to the ReguAI backend. Make sure the backend server is running."
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================================
  // INITIAL FRAMEWORK LOAD
  // ========================================================

  useEffect(() => {

    fetchFrameworks();

  }, []);


  // ========================================================
  // LOAD DASHBOARD WHEN FRAMEWORK CHANGES
  // ========================================================

  useEffect(() => {

    fetchDashboard();

  }, [selectedFramework]);


  // ========================================================
  // DASHBOARD VALUES
  // ========================================================

  const totalDocuments =
    dashboard?.total_documents ?? 0;


  const averageScore =
    dashboard?.average_score ?? 0;


  const complianceGaps =
    dashboard?.documents?.reduce(
      (total, document) =>
        total +
        (document.missing_requirements || 0),
      0
    ) ?? 0;


  const fullyCompliantDocuments =
    dashboard?.fully_compliant_documents ?? 0;


  // ========================================================
  // DOCUMENT STATUS
  // ========================================================

  const getDocumentStatus = (
    status
  ) => {

    switch (status) {

      case "analyzed":
        return "Analyzed";

      case "compliance_checked":
        return "Compliance Checked";

      case "uploaded":
        return "Uploaded";

      default:
        return status || "Unknown";

    }

  };


  const getStatusClass = (
    status
  ) => {

    switch (status) {

      case "compliance_checked":
        return "status-success";

      case "analyzed":
        return "status-info";

      case "uploaded":
        return "status-warning";

      default:
        return "status-neutral";

    }

  };


  // ========================================================
  // DASHBOARD UI
  // ========================================================

  return (

    <>

      <header className="top-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Monitor your organization's compliance status
          </p>

        </div>


        <div className="header-actions">

          <button
            className="refresh-button"
            onClick={fetchDashboard}
            disabled={loading}
          >
            ↻ Refresh
          </button>


          <div className="profile-circle">
            U
          </div>

        </div>

      </header>


      {/* ====================================================
          FRAMEWORK SELECTOR
          ==================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>

            <h2>
              Compliance Framework
            </h2>

            <p>
              Select a framework to view framework-specific
              compliance statistics.
            </p>

          </div>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >

          <label
            htmlFor="dashboard-framework"
            style={{
              fontWeight: "600"
            }}
          >
            Framework
          </label>


          <select
            id="dashboard-framework"
            value={selectedFramework}
            onChange={(event) =>
              setSelectedFramework(
                event.target.value
              )
            }
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              minWidth: "220px",
              fontSize: "14px",
              cursor: loading
                ? "not-allowed"
                : "pointer"
            }}
          >

            <option value="">
              All Frameworks
            </option>


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


          <span
            style={{
              fontSize: "14px",
              color: "#6b7280"
            }}
          >
            Viewing:
            {" "}

            <strong>
              {
                selectedFramework ||
                "All Frameworks"
              }
            </strong>

          </span>

        </div>

      </section>


      {/* ====================================================
          LOADING
          ==================================================== */}

      {loading && (

        <div className="loading-message">
          Loading ReguAI dashboard...
        </div>

      )}


      {/* ====================================================
          GENERAL ERROR
          ==================================================== */}

      {error && (

        <div className="error-message">
          {error}
        </div>

      )}


      {/* ====================================================
          NO REQUIREMENTS STATE
          ==================================================== */}

      {!loading &&
        !error &&
        noRequirements && (

          <section className="dashboard-card">

            <div
              style={{
                textAlign: "center",
                padding: "50px 30px"
              }}
            >

              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "18px"
                }}
              >
                🛡️
              </div>


              <h2
                style={{
                  marginBottom: "10px"
                }}
              >
                No Requirements Configured
              </h2>


              <p
                style={{
                  maxWidth: "620px",
                  margin: "0 auto 24px",
                  color: "#6b7280",
                  lineHeight: 1.6
                }}
              >
                The framework{" "}
                <strong>
                  {selectedFramework}
                </strong>{" "}
                does not have any compliance requirements
                configured yet.
              </p>


              <p
                style={{
                  maxWidth: "620px",
                  margin: "0 auto 28px",
                  color: "#6b7280",
                  lineHeight: 1.6
                }}
              >
                Add requirements for this framework to
                start performing compliance analysis,
                calculating scores, and identifying
                regulatory gaps.
              </p>


              <NavLink
                to="/requirements"
                className="action-button"
                style={{
                  display: "inline-flex",
                  textDecoration: "none"
                }}
              >
                📋 Manage Requirements
              </NavLink>

            </div>

          </section>

        )}


      {/* ====================================================
          NORMAL DASHBOARD
          ==================================================== */}

      {!loading &&
        !error &&
        !noRequirements &&
        dashboard && (

          <>

            {/* ==================================================
                STATISTICS
                ================================================== */}

            <section className="stats-grid">

              <div className="stat-card">

                <div className="stat-icon blue">
                  📄
                </div>

                <div>

                  <p>
                    Total Documents
                  </p>

                  <h2>
                    {totalDocuments}
                  </h2>

                  <span>
                    Documents in system
                  </span>

                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon green">
                  ✓
                </div>

                <div>

                  <p>
                    Average Compliance
                  </p>

                  <h2>
                    {averageScore.toFixed(1)}%
                  </h2>

                  <span>
                    Across analyzed documents
                  </span>

                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon orange">
                  ⚠
                </div>

                <div>

                  <p>
                    Compliance Gaps
                  </p>

                  <h2>
                    {complianceGaps}
                  </h2>

                  <span>
                    Issues detected
                  </span>

                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon purple">
                  🛡
                </div>

                <div>

                  <p>
                    Fully Compliant
                  </p>

                  <h2>
                    {fullyCompliantDocuments}
                  </h2>

                  <span>
                    Documents compliant
                  </span>

                </div>

              </div>

            </section>


            {/* ==================================================
                COMPLIANCE OVERVIEW
                ================================================== */}

            <section className="dashboard-card">

              <div className="section-header">

                <div>

                  <h2>
                    Compliance Overview
                  </h2>

                  <p>
                    Overall compliance performance
                    {" "}
                    (
                    {
                      selectedFramework ||
                      "All Frameworks"
                    }
                    )
                  </p>

                </div>


                <span className="live-badge">
                  LIVE
                </span>

              </div>


              <div className="compliance-score">

                <div className="score-circle">

                  <strong>
                    {averageScore.toFixed(1)}%
                  </strong>

                  <span>
                    Average Score
                  </span>

                </div>


                <div className="compliance-info">

                  <div className="info-row">

                    <span>
                      Fully Compliant
                    </span>

                    <strong>
                      {
                        dashboard.fully_compliant_documents
                      }
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      Mostly Compliant
                    </span>

                    <strong>
                      {
                        dashboard.mostly_compliant_documents
                      }
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      Partially Compliant
                    </span>

                    <strong>
                      {
                        dashboard.partially_compliant_documents
                      }
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      Non-Compliant
                    </span>

                    <strong>
                      {
                        dashboard.non_compliant_documents
                      }
                    </strong>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================================
                RECENT DOCUMENTS
                ================================================== */}

            <section className="dashboard-card">

              <div className="section-header">

                <div>

                  <h2>
                    Recent Documents
                  </h2>

                  <p>
                    Documents currently stored in ReguAI
                  </p>

                </div>


                <NavLink
                  to="/documents"
                  className="view-all-button"
                >
                  View All
                </NavLink>

              </div>


              {documents.length === 0 ? (

                <div className="empty-state">

                  <div className="empty-icon">
                    📄
                  </div>

                  <h3>
                    No documents yet
                  </h3>

                  <p>
                    Upload your first compliance
                    document to start analyzing it.
                  </p>

                </div>

              ) : (

                <div className="documents-table">

                  <div className="table-header">

                    <span>
                      Document
                    </span>

                    <span>
                      Type
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Uploaded
                    </span>

                  </div>


                  {documents
                    .slice(0, 5)
                    .map(
                      (document) => (

                        <div
                          className="table-row"
                          key={document.id}
                        >

                          <div className="document-name">

                            <div className="document-icon">
                              📄
                            </div>


                            <div>

                              <strong>
                                {document.filename}
                              </strong>

                              <small>
                                Document #{document.id}
                              </small>

                            </div>

                          </div>


                          <span>
                            {
                              document.file_type?.toUpperCase() ||
                              "PDF"
                            }
                          </span>


                          <span
                            className={`document-status ${getStatusClass(
                              document.status
                            )}`}
                          >
                            {
                              getDocumentStatus(
                                document.status
                              )
                            }
                          </span>


                          <span>
                            {
                              document.uploaded_at
                                ? new Date(
                                    document.uploaded_at
                                  ).toLocaleDateString()
                                : "—"
                            }
                          </span>

                        </div>

                      )
                    )}

                </div>

              )}

            </section>


            {/* ==================================================
                QUICK ACTIONS
                ================================================== */}

            <section className="quick-actions">

              <div>

                <h2>
                  Quick Actions
                </h2>

                <p>
                  Manage your compliance workflow
                </p>

              </div>


              <div className="action-buttons">

                <NavLink
                  to="/documents"
                  className="action-button"
                >
                  <span>
                    📤
                  </span>

                  Upload Document
                </NavLink>


                <NavLink
                  to="/compliance"
                  className="action-button"
                >
                  <span>
                    🔍
                  </span>

                  Run Compliance Check
                </NavLink>


                <NavLink
                  to="/audit-reports"
                  className="action-button"
                >
                  <span>
                    📊
                  </span>

                  Generate Audit Report
                </NavLink>

              </div>

            </section>

          </>

        )}

    </>

  );

}


// ==========================================================
// SETTINGS
// ==========================================================

function Settings() {

  const [frameworks, setFrameworks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [updatingFrameworkId, setUpdatingFrameworkId] = useState(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [frameworkName, setFrameworkName] = useState("");

  const [frameworkDescription, setFrameworkDescription] = useState("");

  const [frameworkStatus, setFrameworkStatus] = useState("active");


  // ========================================================
  // FETCH ALL FRAMEWORKS
  // ========================================================

  const fetchFrameworks = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/frameworks/all`
      );

      if (!response.ok) {

        throw new Error(
          "Unable to load frameworks."
        );

      }

      const data =
        await response.json();

      setFrameworks(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Framework loading error:",
        err
      );

      setError(
        "Unable to load regulatory frameworks."
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    fetchFrameworks();

  }, []);


  // ========================================================
  // CREATE FRAMEWORK
  // ========================================================

  const handleCreateFramework = async (
    event
  ) => {

    event.preventDefault();

    setError("");

    setSuccess("");

    if (!frameworkName.trim()) {

      setError(
        "Framework name is required."
      );

      return;

    }

    try {

      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/frameworks`,
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            name:
              frameworkName.trim(),

            description:
              frameworkDescription.trim() || null,

            status:
              frameworkStatus

          })

        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to create framework."
        );

      }

      setFrameworks(
        (previousFrameworks) => [

          ...previousFrameworks,

          data

        ]
      );

      setFrameworkName("");

      setFrameworkDescription("");

      setFrameworkStatus("active");

      setSuccess(
        `Framework "${data.name}" created successfully.`
      );

    } catch (err) {

      console.error(
        "Framework creation error:",
        err
      );

      setError(
        err.message ||
        "Unable to create framework."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // ========================================================
  // UPDATE FRAMEWORK STATUS
  // ========================================================

  const handleUpdateFrameworkStatus = async (
    framework
  ) => {

    const nextStatus =
      framework.status === "active"
        ? "inactive"
        : "active";

    setError("");

    setSuccess("");

    setUpdatingFrameworkId(
      framework.id
    );

    try {

      const response = await fetch(
        `${API_BASE_URL}/frameworks/${framework.id}/status?status=${nextStatus}`,
        {
          method: "PATCH"
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to update framework status."
        );

      }

      setFrameworks(
        (previousFrameworks) =>
          previousFrameworks.map(
            (item) =>
              item.id === framework.id
                ? data
                : item
          )
      );

      setSuccess(
        `Framework "${data.name}" is now ${data.status}.`
      );

    } catch (err) {

      console.error(
        "Framework status update error:",
        err
      );

      setError(
        err.message ||
        "Unable to update framework status."
      );

    } finally {

      setUpdatingFrameworkId(null);

    }

  };


  // ========================================================
  // FRAMEWORK COUNTS
  // ========================================================

  const activeFrameworkCount =
    frameworks.filter(
      (framework) =>
        framework.status === "active"
    ).length;

  const inactiveFrameworkCount =
    frameworks.filter(
      (framework) =>
        framework.status === "inactive"
    ).length;


  // ========================================================
  // SETTINGS UI
  // ========================================================

  return (

    <>

      <header className="top-header">

        <div>

          <h1>
            Settings
          </h1>

          <p>
            Manage your ReguAI application settings and
            regulatory frameworks.
          </p>

        </div>


        <div className="header-actions">

          <button
            className="refresh-button"
            onClick={fetchFrameworks}
            disabled={loading}
          >
            ↻ Refresh
          </button>


          <div className="profile-circle">
            U
          </div>

        </div>

      </header>


      {error && (

        <div
          className="error-message"
          style={{
            marginBottom: "20px"
          }}
        >
          {error}
        </div>

      )}


      {success && (

        <div
          style={{
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "10px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            fontSize: "14px",
            fontWeight: "600"
          }}
        >
          ✓ {success}
        </div>

      )}


      {/* ====================================================
          FRAMEWORK CREATION
          ==================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>

            <h2>
              Add Regulatory Framework
            </h2>

            <p>
              Create a framework that can be used for
              compliance analysis and audit reporting.
            </p>

          </div>

        </div>


        <form
          onSubmit={handleCreateFramework}
          style={{
            display: "grid",
            gap: "18px"
          }}
        >

          <div>

            <label
              htmlFor="framework-name"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              Framework Name
            </label>


            <input
              id="framework-name"
              type="text"
              value={frameworkName}
              onChange={(event) =>
                setFrameworkName(
                  event.target.value
                )
              }
              placeholder="Example: ISO 27001"
              disabled={submitting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px"
              }}
            />

          </div>


          <div>

            <label
              htmlFor="framework-description"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              Description
            </label>


            <textarea
              id="framework-description"
              value={frameworkDescription}
              onChange={(event) =>
                setFrameworkDescription(
                  event.target.value
                )
              }
              placeholder="Describe the purpose of this regulatory framework."
              rows="4"
              disabled={submitting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                resize: "vertical",
                fontFamily: "inherit"
              }}
            />

          </div>


          <div>

            <label
              htmlFor="framework-status"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              Initial Status
            </label>


            <select
              id="framework-status"
              value={frameworkStatus}
              onChange={(event) =>
                setFrameworkStatus(
                  event.target.value
                )
              }
              disabled={submitting}
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                minWidth: "180px",
                fontSize: "14px"
              }}
            >

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

            </select>

          </div>


          <div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "14px",
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
                opacity: submitting
                  ? 0.7
                  : 1
              }}
            >
              {submitting
                ? "Creating..."
                : "＋ Create Framework"}
            </button>

          </div>

        </form>

      </section>


      {/* ====================================================
          FRAMEWORK LIST
          ==================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>

            <h2>
              Regulatory Frameworks
            </h2>

            <p>
              Manage all regulatory frameworks configured
              in ReguAI.
            </p>

          </div>


          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap"
            }}
          >

            <span
              className="live-badge"
            >
              {activeFrameworkCount} ACTIVE
            </span>


            <span
              style={{
                padding: "7px 11px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "700",
                background: "#f3f4f6",
                color: "#4b5563"
              }}
            >
              {inactiveFrameworkCount} INACTIVE
            </span>

          </div>

        </div>


        {loading ? (

          <div className="loading-message">
            Loading frameworks...
          </div>

        ) : frameworks.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🛡
            </div>

            <h3>
              No frameworks configured
            </h3>

            <p>
              Create your first regulatory framework
              using the form above.
            </p>

          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gap: "14px"
            }}
          >

            {frameworks.map(
              (framework) => (

                <div
                  key={framework.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "20px",
                    padding: "18px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "#ffffff",
                    flexWrap: "wrap"
                  }}
                >

                  <div
                    style={{
                      minWidth: "220px",
                      flex: 1
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "6px"
                      }}
                    >

                      <strong
                        style={{
                          fontSize: "16px"
                        }}
                      >
                        {framework.name}
                      </strong>


                      <span
                        style={{
                          padding: "4px 9px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background:
                            framework.status === "active"
                              ? "#dcfce7"
                              : "#f3f4f6",
                          color:
                            framework.status === "active"
                              ? "#166534"
                              : "#4b5563"
                        }}
                      >
                        {framework.status.toUpperCase()}
                      </span>

                    </div>


                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "14px"
                      }}
                    >
                      {framework.description ||
                        "Regulatory compliance framework"}
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateFrameworkStatus(
                        framework
                      )
                    }
                    disabled={
                      updatingFrameworkId ===
                      framework.id
                    }
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      background:
                        framework.status === "active"
                          ? "#ffffff"
                          : "#2563eb",
                      color:
                        framework.status === "active"
                          ? "#374151"
                          : "#ffffff",
                      fontWeight: "600",
                      cursor:
                        updatingFrameworkId ===
                        framework.id
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        updatingFrameworkId ===
                        framework.id
                          ? 0.6
                          : 1
                    }}
                  >
                    {
                      updatingFrameworkId ===
                      framework.id
                        ? "Updating..."
                        : framework.status === "active"
                          ? "Deactivate"
                          : "Activate"
                    }
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ====================================================
          FRAMEWORK INFORMATION
          ==================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>

            <h2>
              Framework Usage
            </h2>

            <p>
              Frameworks control which compliance
              requirements are used during analysis.
            </p>

          </div>

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px"
          }}
        >

          <div
            style={{
              padding: "18px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb"
            }}
          >

            <div
              style={{
                fontSize: "24px",
                marginBottom: "8px"
              }}
            >
              🛡
            </div>

            <strong>
              Framework Selection
            </strong>

            <p
              style={{
                color: "#6b7280",
                fontSize: "13px",
                lineHeight: 1.5
              }}
            >
              Select an active framework when running
              compliance checks.
            </p>

          </div>


          <div
            style={{
              padding: "18px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb"
            }}
          >

            <div
              style={{
                fontSize: "24px",
                marginBottom: "8px"
              }}
            >
              📊
            </div>

            <strong>
              Framework-Specific Reports
            </strong>

            <p
              style={{
                color: "#6b7280",
                fontSize: "13px",
                lineHeight: 1.5
              }}
            >
              Compliance summaries and audit reports
              retain the selected framework.
            </p>

          </div>


          <div
            style={{
              padding: "18px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb"
            }}
          >

            <div
              style={{
                fontSize: "24px",
                marginBottom: "8px"
              }}
            >
              🔍
            </div>

            <strong>
              Requirement Isolation
            </strong>

            <p
              style={{
                color: "#6b7280",
                fontSize: "13px",
                lineHeight: 1.5
              }}
            >
              Each framework can have its own set of
              compliance requirements.
            </p>

          </div>

        </div>

      </section>

    </>

  );

}


// ==========================================================
// SIDEBAR
// ==========================================================

function Sidebar() {

  return (

    <aside className="sidebar">

      <div className="logo-section">

        <div className="logo-icon">
          R
        </div>


        <div>

          <h2>
            ReguAI
          </h2>

          <p>
            Compliance Platform
          </p>

        </div>

      </div>


      <nav className="sidebar-nav">

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>
            ▣
          </span>

          Dashboard
        </NavLink>


        <NavLink
          to="/documents"
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>
            📄
          </span>

          Documents
        </NavLink>


        <NavLink
          to="/compliance"
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>
            ✓
          </span>

          Compliance
        </NavLink>


        <NavLink
          to="/requirements"
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>
            📋
          </span>

          Requirements
        </NavLink>


        <NavLink
          to="/compliance-gaps"
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>
            ⚠
          </span>

          Compliance Gaps
        </NavLink>


        <NavLink
          to="/audit-reports"
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>
            📊
          </span>

          Audit Reports
        </NavLink>

      </nav>


      <div className="sidebar-bottom">

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>
            ⚙
          </span>

          Settings
        </NavLink>


        <div className="system-status">

          <span className="online-dot"></span>

          <div>

            <strong>
              System Online
            </strong>

            <small>
              All services operational
            </small>

          </div>

        </div>

      </div>

    </aside>

  );

}


// ==========================================================
// APP
// ==========================================================

function App() {

  return (

    <BrowserRouter>

      <div className="app-container">

        <Sidebar />


        <main className="main-content">

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />


            <Route
              path="/documents"
              element={<Documents />}
            />


            <Route
              path="/documents/:documentId"
              element={<DocumentDetails />}
            />


            <Route
              path="/compliance"
              element={<Compliance />}
            />


            <Route
              path="/requirements"
              element={<Requirements />}
            />


            <Route
              path="/compliance-gaps"
              element={<ComplianceGaps />}
            />


            <Route
              path="/audit-reports"
              element={<AuditReports />}
            />


            <Route
              path="/settings"
              element={<Settings />}
            />

          </Routes>

        </main>

      </div>

    </BrowserRouter>

  );

}


export default App;