import { useState, useEffect } from "react";
import axios from "axios";

const AddClient = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    softwareId: "",
  });
  const [softwareList, setSoftwareList] = useState([]);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSoftware();
  }, []);

  const fetchSoftware = async () => {
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/software/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSoftwareList(response.data.softwareList);
      }
    } catch (err) {
      console.error("Error fetching software:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number - only allow digits and limit to 10
    if (name === "clientPhone") {
      const digitsOnly = value.replace(/\D/g, "");
      const limitedDigits = digitsOnly.slice(0, 10);
      
      setFormData({
        ...formData,
        [name]: limitedDigits,
      });

      // Validate phone number
      if (limitedDigits.length > 0 && limitedDigits.length < 10) {
        setValidationErrors({
          ...validationErrors,
          phone: "Phone number must be exactly 10 digits",
        });
      } else {
        setValidationErrors({
          ...validationErrors,
          phone: "",
        });
      }
      return;
    }

    // Handle email validation
    if (name === "clientEmail") {
      setFormData({
        ...formData,
        [name]: value,
      });

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setValidationErrors({
          ...validationErrors,
          email: "Please enter a valid email address",
        });
      } else {
        setValidationErrors({
          ...validationErrors,
          email: "",
        });
      }
      return;
    }

    // Handle other fields
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate before submit
    if (validationErrors.email || validationErrors.phone) {
      setError("Please fix validation errors before submitting");
      return;
    }

    if (formData.clientPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      
      // Add +91 prefix to phone number before sending
      const submitData = {
        ...formData,
        clientPhone: `+91${formData.clientPhone}`,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/client/create`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Show detailed success message based on registration status
        let successMessage = "Client added successfully!";
        if (response.data.warning) {
          successMessage += ` Warning: ${response.data.warning}`;
        }
        
        onSuccess(successMessage);
        setFormData({ clientName: "", clientEmail: "", clientPhone: "", softwareId: "" });
        setValidationErrors({ email: "", phone: "" });
        
        // Log detailed response for debugging
        console.log("Client creation response:", response.data);
      }
    } catch (err) {
      console.error("Client creation error:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMessage = "Failed to add client";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      if (err.response?.data?.apiError) {
        errorMessage += ` (API Error: ${err.response.data.apiError})`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Add New Client</h1>
        <button className="btn-secondary" onClick={onBack}>
          ← Back to List
        </button>
      </div>

      <div className="form-center">
        <div className="form-card">
          <form onSubmit={handleSubmit} className="form-layout">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="clientName">
                Client <span className="required">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                placeholder="client@example.com"
                required
                className={validationErrors.email ? "input-error" : ""}
              />
              {validationErrors.email && (
                <small className="error-hint">{validationErrors.email}</small>
              )}
              {!validationErrors.email && (
                <small className="input-hint">
                  Credentials will be sent to this email address
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="clientPhone">
                Phone Number <span className="required">*</span>
              </label>
              <div className="phone-input-wrapper">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  id="clientPhone"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength="10"
                  required
                  className={validationErrors.phone ? "input-error" : ""}
                />
              </div>
              {validationErrors.phone && (
                <small className="error-hint">{validationErrors.phone}</small>
              )}
              {!validationErrors.phone && formData.clientPhone.length === 10 && (
                <small className="success-hint">✓ Valid phone number</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="softwareId">
                Select Software <span className="required">*</span>
              </label>
              <select
                id="softwareId"
                name="softwareId"
                value={formData.softwareId}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Software --</option>
                {softwareList.map((software) => (
                  <option key={software._id} value={software._id}>
                    {software.name}
                  </option>
                ))}
              </select>
              <small className="input-hint">
                Client will be registered for the selected software
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Adding Client..." : "Add Client"}
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

export default AddClient;
