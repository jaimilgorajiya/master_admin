import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import AddClient from "./AddClient";
import EditClient from "./EditClient";
import { TableSkeleton } from "./LoadingSkeleton";

const ClientManagement = ({ initialShowAddForm = false, onFormClose }) => {
  const [clientList, setClientList] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSoftware, setSelectedSoftware] = useState("");
  const [softwareList, setSoftwareList] = useState([]);

  useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  useEffect(() => {
    fetchClients();
    fetchSoftware();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clientList, searchTerm, selectedSoftware]);

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

  const filterClients = () => {
    let filtered = [...clientList];

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.clientName.toLowerCase().includes(searchLower) ||
        client.clientEmail.toLowerCase().includes(searchLower) ||
        client.clientPhone.toLowerCase().includes(searchLower) ||
        (client.softwareId?.name && client.softwareId.name.toLowerCase().includes(searchLower))
      );
    }

    // Filter by software
    if (selectedSoftware !== "") {
      filtered = filtered.filter(client => 
        client.softwareId?._id === selectedSoftware
      );
    }

    setFilteredClients(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSoftwareFilterChange = (e) => {
    setSelectedSoftware(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSoftware("");
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/client/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setClientList(response.data.clients);
        setFilteredClients(response.data.clients);
        
        // Log summary for debugging
        if (response.data.summary) {
          console.log("Client Summary:", response.data.summary);
        }
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

  const handleDeleteExternal = async (client) => {
    const result = await Swal.fire({
      title: "Delete External Client?",
      html: `
        <div style="text-align: left;">
          <p>You are about to delete <strong>"${client.clientName}"</strong> from <strong>${client.softwareId?.name}</strong>.</p>
          <p><strong>⚠️ Important:</strong></p>
          <ul style="margin-left: 20px;">
            <li>This will delete the client from the external software</li>
            <li>The client will no longer be able to login</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#666666",
      confirmButtonText: "Yes, delete from external software!",
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#ffffff",
      width: 500,
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
      
      // Create a payload for external client deletion
      const deletePayload = {
        clientEmail: client.clientEmail,
        softwareId: client.softwareId._id,
        externalId: client.externalId,
        isExternal: true
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/client/delete-external`,
        deletePayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await Swal.fire({
          title: "Deleted!",
          text: "External client has been deleted successfully.",
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
        text: err.response?.data?.message || "Failed to delete external client",
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



  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Client Management</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Client
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, phone, or software..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        
        <div className="filter-section">
          <select
            value={selectedSoftware}
            onChange={handleSoftwareFilterChange}
            className="filter-select"
          >
            <option value="">All Software</option>
            {softwareList.map((software) => (
              <option key={software._id} value={software._id}>
                {software.name}
              </option>
            ))}
          </select>
          
          {(searchTerm || selectedSoftware) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || selectedSoftware) && (
        <div className="results-summary">
          Showing {filteredClients.length} of {clientList.length} clients
          {searchTerm && <span> matching "{searchTerm}"</span>}
          {selectedSoftware && (
            <span> in {softwareList.find(s => s._id === selectedSoftware)?.name}</span>
          )}
        </div>
      )}

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
              <th>Registration</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  {clientList.length === 0 
                    ? "No clients found. Add your first client to get started."
                    : "No clients match your search criteria."
                  }
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
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
                  <td>
                    <span className={`status-badge ${client.registrationStatus}`}>
                      {client.registrationStatus === 'success' && '✅ Success'}
                      {client.registrationStatus === 'failed' && '❌ Failed'}
                      {client.registrationStatus === 'pending' && '⏳ Pending'}
                      {client.registrationStatus === 'skipped' && '⚠️ Skipped'}
                      {client.registrationStatus === 'already_exists' && '⚠️ Exists'}
                    </span>
                  </td>
                  <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => client.source === 'external' ? handleDeleteExternal(client) : handleDelete(client._id, client.clientName)}
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
