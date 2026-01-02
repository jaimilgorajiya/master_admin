import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const AddSoftware = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    backendRegisterApiLink: "",
    getAllAdminsApiLink: "",
    deleteAdminApiLink: "",
    updateStatusApiLink: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await Swal.fire({
      title: "Confirm Software Creation",
      html: `
        <div style="text-align: left; font-size: 0.9em; line-height: 1.5;">
          <p style="margin-bottom: 5px;"><strong>Name:</strong> ${formData.name}</p>
          <hr style="border-color: #444; margin: 10px 0;">
          <p style="margin-bottom: 5px; color: #aaa; font-size: 0.85em;">API Configuration:</p>
          <div style="background: #222; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.8em; word-break: break-all;">
            <p style="margin-bottom: 8px;"><strong style="color: #00c8ff;">Register:</strong><br/>${formData.backendRegisterApiLink}</p>
            <p style="margin-bottom: 8px;"><strong style="color: #00c8ff;">Get All:</strong><br/>${formData.getAllAdminsApiLink}</p>
            <p style="margin-bottom: 8px;"><strong style="color: #00c8ff;">Delete:</strong><br/>${formData.deleteAdminApiLink}</p>
            <p style="margin: 0;"><strong style="color: #00c8ff;">Update:</strong><br/>${formData.updateStatusApiLink}</p>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Add Software",
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#ffffff",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#666666",
      customClass: {
        popup: "swal-dark",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/software/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await Swal.fire({
            title: "Success!",
            text: "Software added successfully!",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            background: "#1a1a1a",
            color: "#ffffff"
        });

        onSuccess("Software added successfully!");
        setFormData({ 
          name: "", 
          description: "", 
          backendRegisterApiLink: "",
          getAllAdminsApiLink: "",
          deleteAdminApiLink: "",
          updateStatusApiLink: "",
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to add software";
      setError(errorMessage);
      
      Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#00c8ff",
          background: "#1a1a1a",
          color: "#ffffff"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Add New Software</h1>
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
              POST API Link <span className="required">*</span>
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
              <strong>Required:</strong> API endpoint to register new clients. Expects: name, email, password, phone
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="getAllAdminsApiLink">
              Get API Link <span className="required">*</span>
              </label>
              <input
              type="url"
              id="getAllAdminsApiLink"
              name="getAllAdminsApiLink"
              value={formData.getAllAdminsApiLink}
              onChange={handleChange}
              placeholder="https://api.example.com/api/admin/all"
              required
            />
            <small className="input-hint">
              <strong>Required:</strong> API endpoint to fetch all existing clients (needed for status updates & deletion)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="deleteAdminApiLink">
              Delete API Link <span className="required">*</span>
            </label>
            <input
              type="url"
              id="deleteAdminApiLink"
              name="deleteAdminApiLink"
              value={formData.deleteAdminApiLink}
              onChange={handleChange}
              placeholder="https://api.example.com/api/admin/delete/:id"
              required
            />
            <small className="input-hint">
              <strong>Required:</strong> API endpoint to delete clients. Use :id placeholder for dynamic ID (e.g., /api/admin/delete/:id)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="updateStatusApiLink">
              Update API Link <span className="required">*</span>
            </label>
            <input
              type="url"
              id="updateStatusApiLink"
              name="updateStatusApiLink"
              value={formData.updateStatusApiLink}
              onChange={handleChange}
              placeholder="https://api.example.com/api/admin/status/:id"
              required
            />
            <small className="input-hint">
              <strong>Required:</strong> API endpoint to update client status. Use :id placeholder for dynamic ID. Expects: &#123;status: 'active'/'inactive'&#125;
            </small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding Software..." : "Add Software"}
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

export default AddSoftware;

