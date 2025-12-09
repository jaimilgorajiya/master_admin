import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import AddSoftware from "./AddSoftware";
import EditSoftware from "./EditSoftware";
import { TableSkeleton } from "./LoadingSkeleton";

const SoftwareManagement = ({ initialShowAddForm = false, onFormClose }) => {
  const [softwareList, setSoftwareList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  useEffect(() => {
    fetchSoftware();
  }, []);

  const fetchSoftware = async () => {
    setLoading(true);
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
      toast.error("Failed to load software");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = (message) => {
    toast.success(message);
    setShowAddForm(false);
    if (onFormClose) onFormClose();
    fetchSoftware();
  };

  const handleEditSuccess = (message) => {
    toast.success(message);
    setShowEditForm(false);
    setSelectedSoftware(null);
    if (onFormClose) onFormClose();
    fetchSoftware();
  };

  const handleEdit = (software) => {
    setSelectedSoftware(software);
    setShowEditForm(true);
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${name}"</strong>.<br/>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#00c8ff",
      cancelButtonColor: "#666666",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#ffffff",
      customClass: {
        popup: "swal-dark",
        confirmButton: "swal-btn-confirm",
        cancelButton: "swal-btn-cancel",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/software/delete/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await Swal.fire({
          title: "Deleted!",
          text: "Software has been deleted successfully.",
          icon: "success",
          confirmButtonColor: "#00c8ff",
          background: "#1a1a1a",
          color: "#ffffff",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchSoftware();
      }
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: err.response?.data?.message || "Failed to delete software",
        icon: "error",
        confirmButtonColor: "#00c8ff",
        background: "#1a1a1a",
        color: "#ffffff",
      });
    }
  };

  if (showAddForm) {
    return (
      <AddSoftware
        onBack={() => {
          setShowAddForm(false);
          if (onFormClose) onFormClose();
        }}
        onSuccess={handleAddSuccess}
      />
    );
  }

  if (showEditForm && selectedSoftware) {
    return (
      <EditSoftware
        software={selectedSoftware}
        onBack={() => {
          setShowEditForm(false);
          setSelectedSoftware(null);
          if (onFormClose) onFormClose();
        }}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Software Management</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Software
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>API Link</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {softwareList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No software found. Add your first software to get started.
                    </td>
                  </tr>
                ) : (
                  softwareList.map((software) => (
                    <tr key={software._id}>
                      <td className="font-semibold">{software.name}</td>
                      <td>{software.description}</td>
                      <td className="text-small">{software.backendRegisterApiLink}</td>
                      <td>{new Date(software.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(software)}
                          title="Edit"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(software._id, software.name)}
                          title="Delete"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SoftwareManagement;
 