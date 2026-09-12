import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function ComplianceGaps() {

  const [documents, setDocuments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [frameworks, setFrameworks] = useState([]);

  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("");

  const [gaps, setGaps] = useState([]);

  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingGaps, setLoadingGaps] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");



  // ========================================================
  // LOAD DOCUMENTS + REQUIREMENTS + FRAMEWORKS
  // ========================================================

  const loadInitialData = async () => {

    try {

      setLoadingDocuments(true);
      setError("");



      const [
        documentsResponse,
        requirementsResponse,
        frameworksResponse
      ] = await Promise.all([

        fetch(
          `${API_BASE_URL}/documents`
        ),

        fetch(
          `${API_BASE_URL}/compliance-requirements`
        ),

        fetch(
          `${API_BASE_URL}/frameworks`
        )

      ]);



      if (!documentsResponse.ok) {

        throw new Error(
          "Unable to load documents."
        );

      }



      if (!requirementsResponse.ok) {

        throw new Error(
          "Unable to load compliance requirements."
        );

      }



      if (!frameworksResponse.ok) {

        throw new Error(
          "Unable to load compliance frameworks."
        );

      }



      const documentsData =
        await documentsResponse.json();



      const requirementsData =
        await requirementsResponse.json();



      const frameworksData =
        await frameworksResponse.json();



      setDocuments(
        Array.isArray(documentsData)
          ? documentsData
          : []
      );



      setRequirements(
        Array.isArray(requirementsData)
          ? requirementsData
          : []
      );



      const availableFrameworks =
        Array.isArray(
          frameworksData?.frameworks
        )
          ? frameworksData.frameworks
          : [];



      setFrameworks(
        availableFrameworks
      );



      if (
        availableFrameworks.length > 0
      ) {

        setSelectedFramework(
          (previousFramework) =>
            previousFramework &&
            availableFrameworks.includes(
              previousFramework
            )
              ? previousFramework
              : availableFrameworks[0]
        );

      } else {

        setSelectedFramework("");

      }



      const analyzedDocuments =
        (
          Array.isArray(documentsData)
            ? documentsData
            : []
        ).filter(
          (document) =>
            document.extracted_text
        );



      if (
        analyzedDocuments.length > 0
      ) {

        setSelectedDocumentId(
          (previousDocumentId) => {

            const previousStillExists =
              analyzedDocuments.some(
                (document) =>
                  String(document.id) ===
                  String(previousDocumentId)
              );



            return previousStillExists
              ? previousDocumentId
              : String(
                  analyzedDocuments[0].id
                );

          }
        );

      } else {

        setSelectedDocumentId("");

      }

    } catch (err) {

      console.error(err);



      setError(
        err.message ||
        "Unable to connect to the ReguAI backend."
      );

    } finally {

      setLoadingDocuments(false);

    }

  };



  useEffect(() => {

    loadInitialData();

  }, []);





  // ========================================================
  // LOAD GAPS FOR SELECTED DOCUMENT + FRAMEWORK
  // ========================================================

  const loadGaps = async (
    documentId = selectedDocumentId,
    framework = selectedFramework
  ) => {

    if (!documentId) {

      setGaps([]);

      return;

    }



    try {

      setLoadingGaps(true);
      setError("");

      setSuccess("");



      const response =
        await fetch(
          `${API_BASE_URL}/documents/${documentId}/compliance-gaps`
        );



      if (!response.ok) {

        const errorData =
          await response
            .json()
            .catch(() => null);



        throw new Error(
          errorData?.detail ||
          "Unable to load compliance gaps."
        );

      }



      const data =
        await response.json();



      /*
       * Backend returns:
       *
       * {
       *   "gaps": [...]
       * }
       *
       * Keep compatibility with a direct array as well.
       */

      const returnedGaps =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.gaps)
            ? data.gaps
            : [];



      /*
       * Filter gaps using the selected framework.
       *
       * Compliance gaps are connected to requirements,
       * and requirements contain the framework name.
       */

      const filteredGaps =
        framework
          ? returnedGaps.filter(
              (gap) => {

                const requirement =
                  requirements.find(
                    (item) =>
                      item.id ===
                      gap.requirement_id
                  );



                if (!requirement) {

                  return false;

                }



                return (
                  requirement.framework ===
                  framework
                );

              }
            )
          : returnedGaps;



      setGaps(
        filteredGaps
      );

    } catch (err) {

      console.error(err);



      setGaps([]);

      setError(
        err.message ||
        "Unable to load compliance gaps."
      );

    } finally {

      setLoadingGaps(false);

    }

  };





  // ========================================================
  // LOAD GAPS WHEN DOCUMENT OR FRAMEWORK CHANGES
  // ========================================================

  useEffect(() => {

    if (
      selectedDocumentId &&
      !loadingDocuments
    ) {

      loadGaps(
        selectedDocumentId,
        selectedFramework
      );

    }

  }, [
    selectedDocumentId,
    selectedFramework,
    loadingDocuments,
    requirements
  ]);





  // ========================================================
  // RUN FRAMEWORK-SPECIFIC COMPLIANCE CHECK
  // ========================================================

  const runComplianceCheck = async () => {

    if (!selectedDocumentId) {

      return;

    }



    try {

      setLoadingGaps(true);
      setError("");
      setSuccess("");



      let url =
        `${API_BASE_URL}/documents/${selectedDocumentId}/compliance-check`;



      if (selectedFramework) {

        url +=
          `?framework=${encodeURIComponent(
            selectedFramework
          )}`;

      }



      const response =
        await fetch(
          url,
          {
            method: "POST"
          }
        );



      if (!response.ok) {

        const errorData =
          await response
            .json()
            .catch(() => null);



        throw new Error(
          errorData?.detail ||
          "Unable to run compliance check."
        );

      }



      await response.json();



      /*
       * Reload gaps using the same selected framework
       * after the compliance check completes.
       */

      await loadGaps(
        selectedDocumentId,
        selectedFramework
      );



      setSuccess(
        selectedFramework
          ? `Compliance gaps refreshed for ${selectedFramework}.`
          : "Compliance gaps refreshed successfully."
      );

    } catch (err) {

      console.error(err);



      setError(
        err.message ||
        "Unable to run compliance check."
      );

    } finally {

      setLoadingGaps(false);

    }

  };





  // ========================================================
  // DOCUMENT HELPERS
  // ========================================================

  const selectedDocument =
    documents.find(
      (document) =>
        String(document.id) ===
        String(selectedDocumentId)
    );



  const analyzedDocuments =
    documents.filter(
      (document) =>
        document.extracted_text
    );





  // ========================================================
  // REQUIREMENT LOOKUP
  // ========================================================

  const getRequirement = (
    requirementId
  ) => {

    return requirements.find(
      (requirement) =>
        requirement.id ===
        requirementId
    );

  };





  // ========================================================
  // RECOMMENDATION
  // ========================================================

  const getRecommendation = (
    gap
  ) => {

    const requirement =
      getRequirement(
        gap.requirement_id
      );



    if (
      gap.recommendation
    ) {

      return gap.recommendation;

    }



    if (!requirement) {

      return (
        "Review the missing compliance requirement and implement appropriate controls to address the identified gap."
      );

    }



    const category =
      (
        requirement.category ||
        ""
      ).toLowerCase();



    const severity =
      (
        requirement.severity ||
        ""
      ).toLowerCase();



    if (
      category.includes("privacy") ||
      category.includes("data")
    ) {

      return (
        "Implement documented data protection controls, access restrictions, privacy procedures, and appropriate handling of sensitive information."
      );

    }



    if (
      category.includes("security")
    ) {

      return (
        "Implement appropriate security controls such as access control, encryption, authentication, monitoring, and security procedures."
      );

    }



    if (
      category.includes("access")
    ) {

      return (
        "Review user access permissions and implement documented access-control procedures using least-privilege principles."
      );

    }



    if (
      severity === "critical"
    ) {

      return (
        "Prioritize immediate remediation of this critical compliance gap and document the implemented corrective controls."
      );

    }



    if (
      severity === "high"
    ) {

      return (
        "Prioritize remediation of this high-severity gap and maintain documented evidence of the corrective actions."
      );

    }



    return (
      "Review the requirement, implement the necessary control, and maintain documented evidence demonstrating compliance."
    );

  };





  // ========================================================
  // STATUS HELPERS
  // ========================================================

  const getSeverityClass = (
    severity
  ) => {

    switch (
      (
        severity ||
        ""
      ).toLowerCase()
    ) {

      case "critical":
        return "gap-severity-critical";

      case "high":
        return "gap-severity-high";

      case "medium":
        return "gap-severity-medium";

      case "low":
        return "gap-severity-low";

      default:
        return "gap-severity-default";

    }

  };





  // ========================================================
  // RENDER
  // ========================================================

  return (

    <div className="gaps-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="page-header">

        <div>

          <div className="breadcrumb">
            Compliance / Gaps
          </div>

          <h1>
            Compliance Gaps
          </h1>

          <p>
            Identify missing compliance requirements
            and review recommended remediation actions.
          </p>

        </div>

        <div className="gaps-header-actions">

          <NavLink
            to="/compliance"
            className="secondary-button"
          >
            ← Compliance Check
          </NavLink>

        </div>

      </header>



      {/* ====================================================
          SUCCESS MESSAGE
      ==================================================== */}

      {success && (

        <div className="success-message">
          ✓ {success}
        </div>

      )}



      {/* ====================================================
          ERROR MESSAGE
      ==================================================== */}

      {error && (

        <div className="error-message">
          ⚠ {error}
        </div>

      )}



      {/* ====================================================
          SELECTOR CARD
      ==================================================== */}

      <section className="dashboard-card gap-selector-card">

        <div className="section-header">

          <div>

            <h2>
              Compliance Framework
            </h2>

            <p>
              Select a framework and document to
              view framework-specific compliance gaps.
            </p>

          </div>

        </div>



        {loadingDocuments ? (

          <div className="page-loading">

            <div className="loading-spinner">
            </div>

            <p>
              Loading compliance data...
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                FRAMEWORK SELECTOR
            ================================================= */}

            <div className="gap-selector-row">

              <div className="gap-select-wrapper">

                <label htmlFor="gap-framework">
                  Framework
                </label>

                <select
                  id="gap-framework"
                  value={selectedFramework}
                  onChange={(event) =>
                    setSelectedFramework(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingGaps &&
                    frameworks.length === 0
                  }
                >

                  {frameworks.length === 0 ? (

                    <option value="">
                      No frameworks available
                    </option>

                  ) : (

                    frameworks.map(
                      (framework) => (

                        <option
                          key={framework}
                          value={framework}
                        >
                          {framework}
                        </option>

                      )
                    )

                  )}

                </select>

              </div>

            </div>



            {/* =================================================
                DOCUMENT SELECTOR
            ================================================= */}

            {analyzedDocuments.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  📄
                </div>

                <h3>
                  No analyzed documents
                </h3>

                <p>
                  Analyze a document before viewing
                  its compliance gaps.
                </p>

                <NavLink
                  to="/documents"
                  className="primary-button"
                >
                  Go to Documents
                </NavLink>

              </div>

            ) : (

              <div className="gap-selector-row">

                <div className="gap-select-wrapper">

                  <label htmlFor="gap-document">
                    Document
                  </label>

                  <select
                    id="gap-document"
                    value={selectedDocumentId}
                    onChange={(event) =>
                      setSelectedDocumentId(
                        event.target.value
                      )
                    }
                  >

                    {analyzedDocuments.map(
                      (document) => (

                        <option
                          key={document.id}
                          value={document.id}
                        >
                          #{document.id} —{" "}
                          {document.filename}
                        </option>

                      )
                    )}

                  </select>

                </div>



                <button
                  className="primary-button"
                  onClick={
                    runComplianceCheck
                  }
                  disabled={
                    loadingGaps ||
                    !selectedDocumentId
                  }
                >

                  {loadingGaps
                    ? "⏳ Checking..."
                    : "🔍 Refresh Gaps"}

                </button>

              </div>

            )}

          </>

        )}

      </section>



      {/* ====================================================
          GAP ANALYSIS
      ==================================================== */}

      {selectedDocument &&
        !loadingDocuments && (

          <section className="dashboard-card">

            <div className="section-header">

              <div>

                <h2>
                  Gap Analysis
                </h2>

                <p>

                  Compliance issues detected in{" "}

                  <strong>
                    {selectedDocument.filename}
                  </strong>

                  {selectedFramework && (

                    <>
                      {" "}
                      under{" "}

                      <strong>
                        {selectedFramework}
                      </strong>
                    </>

                  )}

                </p>

              </div>



              <span className="gap-count-badge">

                {gaps.length}{" "}

                {gaps.length === 1
                  ? "Gap"
                  : "Gaps"}

              </span>

            </div>



            {/* =================================================
                LOADING
            ================================================= */}

            {loadingGaps ? (

              <div className="page-loading">

                <div className="loading-spinner">
                </div>

                <p>
                  Loading compliance gaps...
                </p>

              </div>

            ) : gaps.length === 0 ? (

              /* ===============================================
                 NO GAPS
              =============================================== */

              <div className="no-gaps-state">

                <div className="no-gaps-icon">
                  ✓
                </div>

                <h3>
                  No Compliance Gaps Found
                </h3>

                <p>

                  This document currently satisfies
                  all available requirements for{" "}

                  <strong>
                    {selectedFramework ||
                      "the selected framework"}
                  </strong>.

                </p>

              </div>

            ) : (

              /* ===============================================
                 GAP LIST
              =============================================== */

              <div className="gaps-list">

                {gaps.map(
                  (gap, index) => {

                    const requirement =
                      getRequirement(
                        gap.requirement_id
                      );



                    return (

                      <article
                        className="gap-card"
                        key={
                          gap.id ||
                          `${gap.requirement_id}-${index}`
                        }
                      >

                        {/* =====================================
                            GAP HEADER
                        ===================================== */}

                        <div className="gap-card-top">

                          <div>

                            <span className="gap-number">
                              Gap {index + 1}
                            </span>

                            <h3>

                              {
                                requirement?.title ||
                                `Requirement #${gap.requirement_id}`
                              }

                            </h3>

                          </div>



                          <span className="missing-badge">
                            ⚠ Missing
                          </span>

                        </div>



                        {/* =====================================
                            FRAMEWORK / CATEGORY / SEVERITY
                        ===================================== */}

                        <div className="gap-tags">

                          {requirement?.framework && (

                            <span className="gap-category">
                              {requirement.framework}
                            </span>

                          )}

                          <span className="gap-category">
                            {requirement?.category ||
                              "Compliance"}
                          </span>



                          <span
                            className={`gap-severity ${getSeverityClass(
                              requirement?.severity
                            )}`}
                          >
                            {requirement?.severity ||
                              "Unknown"}
                          </span>

                        </div>



                        {/* =====================================
                            REQUIREMENT DESCRIPTION
                        ===================================== */}

                        {requirement?.description && (

                          <div className="gap-description">

                            <strong>
                              Requirement
                            </strong>

                            <p>
                              {
                                requirement.description
                              }
                            </p>

                          </div>

                        )}



                        {/* =====================================
                            WHY GAP
                        ===================================== */}

                        <div className="gap-explanation">

                          <strong>
                            Why this is a gap
                          </strong>

                          <p>

                            {
                              gap.explanation ||
                              "No explanation was provided."
                            }

                          </p>

                        </div>



                        {/* =====================================
                            RECOMMENDATION
                        ===================================== */}

                        <div className="gap-recommendation">

                          <div className="recommendation-icon">
                            💡
                          </div>

                          <div>

                            <strong>
                              Recommended Action
                            </strong>

                            <p>
                              {
                                getRecommendation(
                                  gap
                                )
                              }
                            </p>

                          </div>

                        </div>

                      </article>

                    );

                  }
                )}

              </div>

            )}

          </section>

        )}

    </div>

  );

}

export default ComplianceGaps;