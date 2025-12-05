import { useState, useEffect } from "react";
import axios from "axios";

const EditSoftware = ({ software, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    backendRegisterApiLink: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (software) {
      setFormData({
        name: software.name,
        description: software.description,
        backendRegisterApiLink: software.backendRegisterApiLink,
      });
    }
  }, [software]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5000/api/software/update/${software._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        onSuccess("Software updated successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update software");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Edit Software</h1>
        <button className="btn-secondary" onClick={onBack}>
          ← Back to List
        </button>
      </div>

      <div className="form-center">
        <div className="form-card">
          <form onSubmit={handleSubmit} className="form-layout">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">
                Software Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Quotation Management System"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this software does..."
                rows="5"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="backendRegisterApiLink">
                Backend Register API Link <span className="required">*</span>
              </label>
              <input
                type="url"
                id="backendRegisterApiLink"
                name="backendRegisterApiLink"
                value={formData.backendRegisterApiLink}
                onChange={handleChange}
                placeholder="https://api.example.com/api/admin/register"
                required
              />
              <small className="input-hint">
                This API endpoint will be used to register new clients for this software
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Updating..." : "Update Software"}
              </button>
              <button type="button" className="btn-secondary" onClick={onBack}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSoftware;
