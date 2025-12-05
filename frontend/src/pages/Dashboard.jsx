import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import SoftwareManagement from "../components/SoftwareManagement";
import ClientManagement from "../components/ClientManagement";
import { StatsSkeleton } from "../components/LoadingSkeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState({
    totalSoftware: 0,
    totalClients: 0,
    activeClients: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    
    if (!token) {
      navigate("/login");
    } else {
      fetchStats();
    }
  }, [navigate]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      
      // Fetch software count
      const softwareResponse = await axios.get("http://localhost:5000/api/software/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch clients count
      const clientsResponse = await axios.get("http://localhost:5000/api/client/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (softwareResponse.data.success && clientsResponse.data.success) {
        const clients = clientsResponse.data.clients;
        const activeClients = clients.filter(client => client.isActive).length;

        setStats({
          totalSoftware: softwareResponse.data.softwareList.length,
          totalClients: clients.length,
          activeClients: activeClients,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    // Remove tokens
    localStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminToken");
    // Note: We keep rememberedEmail and rememberedPassword so they persist after logout
    navigate("/login");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "software", label: "Software Management" },
    { id: "clients", label: "Client Management" },
  ];

  const handleMenuChange = (menuId) => {
    if (activeMenu !== menuId) {
      setActiveMenu(menuId);
      setShowAddForm(false); // Reset form state when changing menus
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <img src="/logo.png" alt="Logo" className="logo-image" />
          </div>
        </div>
        <div className="header-right">
          <button className="icon-button" onClick={() => setShowProfileModal(true)} title="Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button className="icon-button" onClick={handleLogout} title="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Admin Profile</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-avatar-modal">
                {(localStorage.getItem("rememberedEmail") || "Admin").charAt(0).toUpperCase()}
              </div>
              <div className="profile-details">
                <div className="profile-detail-item">
                  <label>Name</label>
                  <p>{localStorage.getItem("rememberedEmail")?.split("@")[0] || "Admin"}</p>
                </div>
                <div className="profile-detail-item">
                  <label>Email</label>
                  <p>{localStorage.getItem("rememberedEmail") || "admin@example.com"}</p>
                </div>
                <div className="profile-detail-item">
                  <label>Role</label>
                  <p>Master Admin</p>
                </div>
                <div className="profile-detail-item">
                  <label>Status</label>
                  <p className="status-active">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeMenu === item.id ? "active" : ""}`}
              onClick={() => handleMenuChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="content-wrapper">
          {activeMenu === "dashboard" && (
            <div>
              <h1 className="page-title">Dashboard</h1>
              
              {loadingStats ? (
                <StatsSkeleton />
              ) : (
                <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalSoftware}</div>
                    <div className="stat-label">Total Software</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalClients}</div>
                    <div className="stat-label">Total Clients</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.activeClients}</div>
                    <div className="stat-label">Active Clients</div>
                  </div>
                </div>
                </div>
              )}

              <div className="quick-actions">
                <h2 className="quick-actions-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                  <button 
                    className="quick-action-card"
                    onClick={() => {
                      setShowAddForm(false); // Reset first
                      setActiveMenu("software");
                      setTimeout(() => setShowAddForm(true), 0); // Then set to true
                    }}
                  >
                    <div className="quick-action-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="quick-action-content">
                      <h3>Add Software</h3>
                      <p>Register a new software application</p>
                    </div>
                    <div className="quick-action-arrow">→</div>
                  </button>

                  <button 
                    className="quick-action-card"
                    onClick={() => {
                      setShowAddForm(false); // Reset first
                      setActiveMenu("clients");
                      setTimeout(() => setShowAddForm(true), 0); // Then set to true
                    }}
                  >
                    <div className="quick-action-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="quick-action-content">
                      <h3>Add Client</h3>
                      <p>Create a new client account</p>
                    </div>
                    <div className="quick-action-arrow">→</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "software" && (
            <SoftwareManagement 
              initialShowAddForm={showAddForm}
              onFormClose={() => setShowAddForm(false)}
            />
          )}

          {activeMenu === "clients" && (
            <ClientManagement 
              initialShowAddForm={showAddForm}
              onFormClose={() => setShowAddForm(false)}
            />
          )}

         
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
