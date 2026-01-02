import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import AddClient from "./AddClient";
import EditClient from "./EditClient";
import ClientDetails from "./ClientDetails";
import { TableSkeleton } from "./LoadingSkeleton";

const ClientManagement = ({ initialShowAddForm = false, onFormClose }) => {
  const [clientList, setClientList] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSoftware, setSelectedSoftware] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [softwareList, setSoftwareList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [activeTab, setActiveTab] = useState("software"); // 'software' | 'service'

  useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  useEffect(() => {
    fetchClients();
    fetchSoftware();
    fetchServices();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clientList, searchTerm, selectedSoftware, selectedService, activeTab]);

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

  const fetchServices = async () => {
    try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/service/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if(res.data.success) {
            setServiceList(res.data.services);
        }
    } catch (error) {
        console.error("Fetch services error", error);
    }
  };

  const filterClients = () => {
    let filtered = [...clientList];

    // Filter by Active Tab (Client Type)
    // Note: Legacy clients might not have clientType 'software' explicitly set if migrated, 
    // but default in schema handles it for new fetches. 
    // For safety, assume if clientType is missing or 'software', it's software.
    // If clientType is 'service', it's service.
    filtered = filtered.filter(client => {
        const type = client.clientType || 'software';
        return type === activeTab;
    });

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.clientName.toLowerCase().includes(searchLower) ||
        client.clientEmail.toLowerCase().includes(searchLower) ||
        client.clientPhone.toLowerCase().includes(searchLower) ||
        (client.softwareId?.name && client.softwareId.name.toLowerCase().includes(searchLower)) ||
        (client.serviceIds && client.serviceIds.some(s => s.name.toLowerCase().includes(searchLower)))
      );
    }

    // Filter by software (only in software mode)
    if (activeTab === 'software' && selectedSoftware !== "") {
      filtered = filtered.filter(client => 
        client.softwareId?._id === selectedSoftware
      );
    }

    // Filter by service (only in service mode)
    if (activeTab === 'service' && selectedService !== "") {
        filtered = filtered.filter(client => 
            client.serviceIds?.some(s => s._id === selectedService)
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

  const handleServiceFilterChange = (e) => {
      setSelectedService(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSoftware("");
    setSelectedService("");
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
        // filterClients will run via useEffect
        
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
        initialClientType={activeTab}
      />
    );
  }

  if (selectedClient) {
    return (
        <ClientDetails 
            client={selectedClient} 
            onBack={() => setSelectedClient(null)} 
        />
    );
  }



  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Client Management</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          + Add New Client
        </button>
      </div>

      {/* Toggle Tabs */}
      <div className="tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
            <button 
                className={`tab-btn ${activeTab === 'software' ? 'active' : ''}`}
                onClick={() => setActiveTab('software')}
                style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'software' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === 'software' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '16px',
                    transition: 'all 0.3s ease'
                }}
            >
                Software
            </button>
            <button 
                className={`tab-btn ${activeTab === 'service' ? 'active' : ''}`}
                onClick={() => setActiveTab('service')}
                style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'service' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === 'service' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '16px',
                    transition: 'all 0.3s ease'
                }}
            >
                Service 
            </button>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
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
          {activeTab === 'software' ? (
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
          ) : (
                <select
                    value={selectedService}
                    onChange={handleServiceFilterChange}
                    className="filter-select"
                >
                    <option value="">All Services</option>
                    {serviceList.map((service) => (
                    <option key={service._id} value={service._id}>
                        {service.name}
                    </option>
                    ))}
                </select>
          )}

          
          {(searchTerm || selectedSoftware || selectedService) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || selectedSoftware || selectedService) && (
        <div className="results-summary">
          Showing {filteredClients.length} of {clientList.filter(c => (c.clientType || 'software') === activeTab).length} clients
          {searchTerm && <span> matching "{searchTerm}"</span>}
          {activeTab === 'software' && selectedSoftware && (
            <span> in {softwareList.find(s => s._id === selectedSoftware)?.name}</span>
          )}
          {activeTab === 'service' && selectedService && (
            <span> with service {serviceList.find(s => s._id === selectedService)?.name}</span>
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
              <th>{activeTab === 'software' ? 'Software' : 'Services'}</th>
              <th>Status</th>
              <th>Account Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  {clientList.filter(c => (c.clientType || 'software') === activeTab).length === 0 
                    ? `No ${activeTab} clients found. Add your first client.`
                    : "No clients match your search criteria."
                  }
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client._id}>
                  <td 
                      className="font-semibold" 
                      style={{ cursor: 'pointer', color: '#00c8ff' }}
                      onClick={() => setSelectedClient(client)}
                  >
                      {client.clientName}
                  </td>
                  <td>{client.clientEmail}</td>
                  <td>{client.clientPhone}</td>
                  <td>
                      {activeTab === 'software' ? (
                          client.softwareId?.name || "N/A"
                      ) : (
                          client.serviceIds && client.serviceIds.length > 0 
                            ? (
                                <div title={client.serviceIds.map(s => s.name).join(', ')}>
                                    {client.serviceIds.length === 1 
                                        ? client.serviceIds[0].name 
                                        : `${client.serviceIds.length} Services`
                                    }
                                </div>
                            )
                            : "No Services"
                      )}
                  </td>
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
                    <span 
                        className="status-badge"
                        style={{
                            backgroundColor: client.isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                            color: client.isActive ? '#4ade80' : '#f87171',
                            border: `1px solid ${client.isActive ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                       
                      {client.isActive ? 'Active' : 'Inactive'}
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
