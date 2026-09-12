import {
  useEffect,
  useState
} from "react";

import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function Requirements() {

  const [frameworks, setFrameworks] = useState([]);

  const [selectedFramework, setSelectedFramework] =
    useState("");

  const [requirements, setRequirements] =
    useState([]);

  const [loadingFrameworks, setLoadingFrameworks] =
    useState(true);

  const [loadingRequirements, setLoadingRequirements] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [severity, setSeverity] =
    useState("medium");



  // ========================================================
  // FETCH ACTIVE FRAMEWORKS
  // ========================================================

  const fetchFrameworks = async () => {

    try {

      setLoadingFrameworks(true);

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/frameworks`
      );

      if (!response.ok) {

        throw new Error(
          "Unable to load regulatory frameworks."
        );

      }

      const data =
        await response.json();

      const frameworkList =
        Array.isArray(data.frameworks)
          ? data.frameworks
          : [];

      setFrameworks(
        frameworkList
      );

      if (
        frameworkList.length > 0 &&
        !selectedFramework
      ) {

        setSelectedFramework(
          frameworkList[0]
        );

      }

    } catch (err) {

      console.error(
        "Framework loading error:",
        err
      );

      setError(
        "Unable to load regulatory frameworks."
      );

    } finally {

      setLoadingFrameworks(false);

    }

  };



  // ========================================================
  // FETCH REQUIREMENTS FOR SELECTED FRAMEWORK
  // ========================================================

  const fetchRequirements = async (
    framework
  ) => {

    if (!framework) {

      setRequirements([]);

      return;

    }

    try {

      setLoadingRequirements(true);

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/compliance-requirements?framework=${encodeURIComponent(
          framework
        )}`
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to load compliance requirements."
        );

      }

      setRequirements(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Requirement loading error:",
        err
      );

      setRequirements([]);

      setError(
        err.message ||
        "Unable to load compliance requirements."
      );

    } finally {

      setLoadingRequirements(false);

    }

  };



  // ========================================================
  // INITIAL FRAMEWORK LOAD
  // ========================================================

  useEffect(() => {

    fetchFrameworks();

  }, []);



  // ========================================================
  // LOAD REQUIREMENTS WHEN FRAMEWORK CHANGES
  // ========================================================

  useEffect(() => {

    if (selectedFramework) {

      fetchRequirements(
        selectedFramework
      );

    }

  }, [selectedFramework]);



  // ========================================================
  // CLEAR FORM
  // ========================================================

  const clearForm = () => {

    setTitle("");

    setDescription("");

    setCategory("");

    setSeverity("medium");

    setEditingId(null);

    setEditing(false);

  };



  // ========================================================
  // CREATE REQUIREMENT
  // ========================================================

  const handleCreateRequirement = async (
    event
  ) => {

    event.preventDefault();

    setError("");

    setSuccess("");

    if (!selectedFramework) {

      setError(
        "Please select a framework."
      );

      return;

    }

    if (!title.trim()) {

      setError(
        "Requirement title is required."
      );

      return;

    }

    if (!description.trim()) {

      setError(
        "Requirement description is required."
      );

      return;

    }

    if (!category.trim()) {

      setError(
        "Requirement category is required."
      );

      return;

    }

    try {

      setSubmitting(true);

      const params =
        new URLSearchParams({

          framework:
            selectedFramework,

          title:
            title.trim(),

          description:
            description.trim(),

          category:
            category.trim(),

          severity:
            severity

        });

      const response = await fetch(
        `${API_BASE_URL}/compliance-requirements?${params.toString()}`,
        {
          method: "POST"
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to create compliance requirement."
        );

      }

      setRequirements(
        (previousRequirements) => [
          ...previousRequirements,
          data
        ]
      );

      clearForm();

      setSuccess(
        `Requirement "${data.title}" was added to ${data.framework}.`
      );

    } catch (err) {

      console.error(
        "Requirement creation error:",
        err
      );

      setError(
        err.message ||
        "Unable to create compliance requirement."
      );

    } finally {

      setSubmitting(false);

    }

  };



  // ========================================================
  // START EDITING REQUIREMENT
  // ========================================================

  const handleEditClick = (
    requirement
  ) => {

    setEditingId(
      requirement.id
    );

    setEditing(true);

    setTitle(
      requirement.title || ""
    );

    setDescription(
      requirement.description || ""
    );

    setCategory(
      requirement.category || ""
    );

    setSeverity(
      requirement.severity || "medium"
    );

    setError("");

    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  };



  // ========================================================
  // CANCEL EDITING
  // ========================================================

  const handleCancelEdit = () => {

    clearForm();

    setError("");

    setSuccess("");

  };



  // ========================================================
  // UPDATE REQUIREMENT
  // ========================================================

  const handleUpdateRequirement = async (
    event
  ) => {

    event.preventDefault();

    setError("");

    setSuccess("");

    if (!editingId) {

      setError(
        "No requirement selected for editing."
      );

      return;

    }

    if (!title.trim()) {

      setError(
        "Requirement title is required."
      );

      return;

    }

    if (!description.trim()) {

      setError(
        "Requirement description is required."
      );

      return;

    }

    if (!category.trim()) {

      setError(
        "Requirement category is required."
      );

      return;

    }

    try {

      setSubmitting(true);

      const params =
        new URLSearchParams({

          framework:
            selectedFramework,

          title:
            title.trim(),

          description:
            description.trim(),

          category:
            category.trim(),

          severity:
            severity

        });

      const response = await fetch(
        `${API_BASE_URL}/compliance-requirements/${editingId}?${params.toString()}`,
        {
          method: "PUT"
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to update compliance requirement."
        );

      }

      setRequirements(
        (previousRequirements) =>
          previousRequirements.map(
            (requirement) =>
              requirement.id === editingId
                ? data
                : requirement
          )
      );

      setSuccess(
        `Requirement "${data.title}" was updated successfully.`
      );

      clearForm();

    } catch (err) {

      console.error(
        "Requirement update error:",
        err
      );

      setError(
        err.message ||
        "Unable to update compliance requirement."
      );

    } finally {

      setSubmitting(false);

    }

  };



  // ========================================================
  // DELETE REQUIREMENT
  // ========================================================

  const handleDeleteRequirement = async (
    requirement
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${requirement.title}"?\n\nThis will also remove compliance gaps and evidence associated with this requirement.`
      );

    if (!confirmed) {

      return;

    }

    setError("");

    setSuccess("");

    try {

      const response = await fetch(
        `${API_BASE_URL}/compliance-requirements/${requirement.id}`,
        {
          method: "DELETE"
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to delete compliance requirement."
        );

      }

      setRequirements(
        (previousRequirements) =>
          previousRequirements.filter(
            (item) =>
              item.id !== requirement.id
          )
      );

      if (
        editingId === requirement.id
      ) {

        clearForm();

      }

      setSuccess(
        `Requirement "${requirement.title}" was deleted successfully.`
      );

    } catch (err) {

      console.error(
        "Requirement deletion error:",
        err
      );

      setError(
        err.message ||
        "Unable to delete compliance requirement."
      );

    }

  };



  // ========================================================
  // SEVERITY CLASS
  // ========================================================

  const getSeverityStyle = (
    requirementSeverity
  ) => {

    switch (
      requirementSeverity
    ) {

      case "critical":

        return {
          background: "#fee2e2",
          color: "#991b1b"
        };

      case "high":

        return {
          background: "#ffedd5",
          color: "#9a3412"
        };

      case "medium":

        return {
          background: "#fef3c7",
          color: "#92400e"
        };

      case "low":

        return {
          background: "#dcfce7",
          color: "#166534"
        };

      default:

        return {
          background: "#f3f4f6",
          color: "#4b5563"
        };

    }

  };



  return (

    <>

      <header className="top-header">

        <div>

          <h1>
            Compliance Requirements
          </h1>

          <p>
            Manage framework-specific regulatory
            requirements used by ReguAI.
          </p>

        </div>

        <div className="header-actions">

          <button
            className="refresh-button"
            onClick={() =>
              fetchRequirements(
                selectedFramework
              )
            }
            disabled={
              loadingRequirements ||
              !selectedFramework
            }
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
          FRAMEWORK SELECTOR
          ==================================================== */}

      <section className="dashboard-card">

        <div className="section-header">

          <div>

            <h2>
              Regulatory Framework
            </h2>

            <p>
              Select a framework to view and manage
              its compliance requirements.
            </p>

          </div>

        </div>



        {loadingFrameworks ? (

          <div className="loading-message">
            Loading frameworks...
          </div>

        ) : frameworks.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🛡
            </div>

            <h3>
              No active frameworks
            </h3>

            <p>
              Create and activate a framework from
              Settings before adding requirements.
            </p>

          </div>

        ) : (

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >

            <label
              htmlFor="requirement-framework"
              style={{
                fontWeight: "600"
              }}
            >
              Framework
            </label>

            <select
              id="requirement-framework"
              value={selectedFramework}
              onChange={(event) => {

                setSelectedFramework(
                  event.target.value
                );

                clearForm();

                setSuccess("");

                setError("");

              }}
              disabled={
                loadingRequirements ||
                submitting
              }
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                minWidth: "240px",
                fontSize: "14px"
              }}
            >

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
              Managing:
              {" "}
              <strong>
                {selectedFramework}
              </strong>
            </span>

          </div>

        )}

      </section>



      {/* ====================================================
          CREATE / EDIT REQUIREMENT
          ==================================================== */}

      {selectedFramework && (

        <section className="dashboard-card">

          <div className="section-header">

            <div>

              <h2>
                {editing
                  ? "Edit Requirement"
                  : "Add Requirement"}
              </h2>

              <p>

                {editing
                  ? (
                    <>
                      Update the selected requirement
                      for{" "}
                      <strong>
                        {selectedFramework}
                      </strong>.
                    </>
                  )
                  : (
                    <>
                      Add a compliance requirement to{" "}
                      <strong>
                        {selectedFramework}
                      </strong>.
                    </>
                  )}

              </p>

            </div>

          </div>



          <form
            onSubmit={
              editing
                ? handleUpdateRequirement
                : handleCreateRequirement
            }
            style={{
              display: "grid",
              gap: "18px"
            }}
          >

            <div>

              <label
                htmlFor="requirement-title"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                Requirement Title
              </label>

              <input
                id="requirement-title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Example: Data encryption"
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
                htmlFor="requirement-description"
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
                id="requirement-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Describe what the organization must comply with."
                rows="5"
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



            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px"
              }}
            >

              <div>

                <label
                  htmlFor="requirement-category"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  Category
                </label>

                <input
                  id="requirement-category"
                  type="text"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  placeholder="Example: data_privacy"
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
                  htmlFor="requirement-severity"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  Severity
                </label>

                <select
                  id="requirement-severity"
                  value={severity}
                  onChange={(event) =>
                    setSeverity(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    fontSize: "14px"
                  }}
                >

                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="critical">
                    Critical
                  </option>

                </select>

              </div>

            </div>



            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap"
              }}
            >

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  background: editing
                    ? "#7c3aed"
                    : "#2563eb",
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
                  ? (
                    editing
                      ? "Saving..."
                      : "Adding..."
                  )
                  : (
                    editing
                      ? "✓ Save Changes"
                      : "＋ Add Requirement"
                  )}

              </button>



              {editing && (

                <button
                  type="button"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={submitting}
                  style={{
                    padding: "12px 20px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#374151",
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
                  Cancel Edit
                </button>

              )}

            </div>

          </form>

        </section>

      )}



      {/* ====================================================
          REQUIREMENT LIST
          ==================================================== */}

      {selectedFramework && (

        <section className="dashboard-card">

          <div className="section-header">

            <div>

              <h2>
                {selectedFramework} Requirements
              </h2>

              <p>
                Requirements currently configured
                for this framework.
              </p>

            </div>

            <span className="live-badge">
              {requirements.length} REQUIREMENTS
            </span>

          </div>



          {loadingRequirements ? (

            <div className="loading-message">
              Loading requirements...
            </div>

          ) : requirements.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📋
              </div>

              <h3>
                No requirements configured
              </h3>

              <p>
                Add the first requirement for{" "}
                <strong>
                  {selectedFramework}
                </strong>{" "}
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

              {requirements.map(
                (requirement) => (

                  <div
                    key={requirement.id}
                    style={{
                      padding: "20px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "#ffffff"
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "16px",
                        flexWrap: "wrap"
                      }}
                    >

                      <div
                        style={{
                          flex: 1,
                          minWidth: "240px"
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "8px"
                          }}
                        >

                          <strong
                            style={{
                              fontSize: "16px"
                            }}
                          >
                            {requirement.title}
                          </strong>

                          <span
                            style={{
                              padding: "4px 9px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: "700",
                              ...getSeverityStyle(
                                requirement.severity
                              )
                            }}
                          >
                            {(
                              requirement.severity ||
                              "medium"
                            ).toUpperCase()}
                          </span>

                        </div>

                        <p
                          style={{
                            margin: "0 0 10px",
                            color: "#4b5563",
                            fontSize: "14px",
                            lineHeight: 1.6
                          }}
                        >
                          {requirement.description}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap",
                            fontSize: "13px",
                            color: "#6b7280"
                          }}
                        >

                          <span>
                            <strong>
                              Category:
                            </strong>{" "}
                            {requirement.category}
                          </span>

                          <span>
                            <strong>
                              Framework:
                            </strong>{" "}
                            {requirement.framework}
                          </span>

                          <span>
                            <strong>
                              ID:
                            </strong>{" "}
                            #{requirement.id}
                          </span>

                        </div>

                      </div>



                      {/* ==================================================
                          REQUIREMENT ACTIONS
                          ================================================== */}

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexShrink: 0
                        }}
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handleEditClick(
                              requirement
                            )
                          }
                          disabled={
                            submitting
                          }
                          style={{
                            padding: "9px 14px",
                            border: "1px solid #c7d2fe",
                            borderRadius: "8px",
                            background: "#eef2ff",
                            color: "#4338ca",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: submitting
                              ? "not-allowed"
                              : "pointer",
                            opacity: submitting
                              ? 0.6
                              : 1
                          }}
                        >
                          ✏️ Edit
                        </button>



                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteRequirement(
                              requirement
                            )
                          }
                          disabled={
                            submitting
                          }
                          style={{
                            padding: "9px 14px",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: submitting
                              ? "not-allowed"
                              : "pointer",
                            opacity: submitting
                              ? 0.6
                              : 1
                          }}
                        >
                          🗑️ Delete
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      )}

    </>

  );

}

export default Requirements;