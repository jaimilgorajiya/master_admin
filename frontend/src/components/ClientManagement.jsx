import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import AddClient from "./AddClient";
import EditClient from "./EditClient";
import { TableSkeleton } from "./LoadingSkeleton";

const ClientManagement = ({ initialShowAddForm = false, onFormClose }) => {
  const [clientList, setClientList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/client/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setClientList(response.data.clients);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = (message) => {
    toast.success(message);
    setShowAddForm(false);
    if (onFormClose) onFormClose();
    fetchClients();
  };

  const handleEditSuccess = (message) => {
    toast.success(message);
    setShowEditForm(false);
    setSelectedClient(null);
    if (onFormClose) onFormClose();
    fetchClients();
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setShowEditForm(true);
  };

  const handleToggleStatus = async (id, currentStatus, clientName) => {
    const action = currentStatus ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Client?`,
      html: `Are you sure you want to ${action} <strong>"${clientName}"</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00c8ff",
      cancelButtonColor: "#666666",
      confirmButtonText: `Yes, ${action}!`,
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
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/client/toggle-status/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await Swal.fire({
          title: "Success!",
          text: `Client has been ${action}d successfully.`,
          icon: "success",
          confirmButtonColor: "#00c8ff",
          background: "#1a1a1a",
          color: "#ffffff",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchClients();
      }
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: err.response?.data?.message || "Failed to toggle client status",
        icon: "error",
        confirmButtonColor: "#00c8ff",
        background: "#1a1a1a",
        color: "#ffffff",
      });
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete client <strong>"${name}"</strong>.<br/>This action cannot be undone.`,
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
        `${import.meta.env.VITE_API_BASE_URL}/api/client/delete/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await Swal.fire({
          title: "Deleted!",
          text: "Client has been deleted successfully.",
          icon: "success",
          confirmButtonColor: "#00c8ff",
          background: "#1a1a1a",
          color: "#ffffff",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchClients();
      }
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: err.response?.data?.message || "Failed to delete client",
        icon: "error",
        confirmButtonColor: "#00c8ff",
        background: "#1a1a1a",
        color: "#ffffff",
      });
    }
  };



  if (showAddForm) {
    return (
      <AddClient
        onBack={() => {
          setShowAddForm(false);
          if (onFormClose) onFormClose();
        }}
        onSuccess={handleAddSuccess}
      />
    );
  }

  if (showEditForm && selectedClient) {
    return (
      <EditClient
        client={selectedClient}
        onBack={() => {
          setShowEditForm(false);
          setSelectedClient(null);
          if (onFormClose) onFormClose();
        }}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Client Management</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Client
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : (
        <>
          <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Software</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clientList.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No clients found. Add your first client to get started.
                </td>
              </tr>
            ) : (
              clientList.map((client) => (
                <tr key={client._id}>
                  <td className="font-semibold">{client.clientName}</td>
                  <td>{client.clientEmail}</td>
                  <td>{client.clientPhone}</td>
                  <td>{client.softwareId?.name || "N/A"}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={client.isActive}
                        onChange={() => handleToggleStatus(client._id, client.isActive, client.clientName)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(client)}
                      title="Edit"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(client._id, client.clientName)}
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

export default ClientManagement;
