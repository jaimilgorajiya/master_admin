import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import SoftwareManagement from "../components/SoftwareManagement";
import ClientManagement from "../components/ClientManagement";
import StaffManagement from "../components/StaffManagement";
import DepartmentManagement from "../components/DepartmentManagement";
import PositionManagement from "../components/PositionManagement";
import PackageManagement from "../components/PackageManagement";
import ServiceManagement from "../components/ServiceManagement";
import { StatsSkeleton } from "../components/LoadingSkeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMenu, setActiveMenu] = useState(searchParams.get("tab") || "dashboard");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Theme State removed

  const [stats, setStats] = useState({
    totalSoftware: 0,
    totalClients: 0,
    activeClients: 0,
    totalStaff: 0,
    totalDepartments: 0,
    totalPositions: 0,
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

  useEffect(() => {
    const tab = searchParams.get("tab") || "dashboard";
    const action = searchParams.get("action");

    if (tab !== activeMenu) {
      setActiveMenu(tab);
    }

    setShowAddForm(action === "add");
  }, [searchParams, activeMenu]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      
      const [softwareRes, clientsRes, staffRes, deptRes, posRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/software/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/client/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/staff/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/department/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/position/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (softwareRes.data.success && clientsRes.data.success) {
        const clients = clientsRes.data.clients;
        const activeClients = clients.filter(client => client.isActive).length;

        setStats({
          totalSoftware: softwareRes.data.softwareList?.length || 0,
          totalClients: clients.length,
          activeClients: activeClients,
          totalStaff: staffRes.data.staffList?.length || 0,
          totalDepartments: deptRes.data.departments?.length || 0,
          totalPositions: posRes.data.positions?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00c8ff",
      cancelButtonColor: "#666666",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#ffffff",
      customClass: {
        popup: "swal-dark",
        confirmButton: "swal-btn-confirm",
        cancelButton: "swal-btn-cancel",
      },
    });

    if (!result.isConfirmed) return;

    // Remove tokens
    localStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminToken");
    // Note: We keep rememberedEmail and rememberedPassword so they persist after logout
    navigate("/login");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "clients", label: "Clients" },
    { id: "packages", label: "Packages" },
    { id: "software", label: "Softwares" },
    { id: "services", label: "Services" },
    { 
      id: "staff", 
      label: "Employees",
      submenu: [
        { id: "dept_positions", label: "Dept & Positions" }
      ]
    },
  ];

  const handleMenuChange = (menuId) => {
    if (menuId === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: menuId });
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
          <button className="icon-button-red" onClick={handleLogout} title="Logout">
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
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id || (item.submenu && item.submenu.some(sub => sub.id === activeMenu));
            const hasSubmenu = !!item.submenu;
            // State to control expansion: if it matches the active parent OR if we explicitly toggled it open
            const [isExpanded, setIsExpanded] = useState(isActive);

            useEffect(() => {
                if (isActive) setIsExpanded(true);
            }, [isActive]);

            const handleItemClick = (e) => {
              if (hasSubmenu) {
                // If it has specific logic to navigate to the parent itself (like 'staff' listing), do that:
                handleMenuChange(item.id);
                // AND toggle the submenu
                setIsExpanded(!isExpanded);
              } else {
                handleMenuChange(item.id);
              }
            };

            return (
              <div key={item.id} className="sidebar-menu-group">
                <button
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  onClick={handleItemClick}
                  style={{ justifyContent: "space-between" }}
                >
                  <span>{item.label}</span>
                  {hasSubmenu && (
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ 
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease" 
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </button>
                {hasSubmenu && (
                  <div className={`sidebar-submenu ${isExpanded ? "open" : ""}`} style={{ 
                    maxHeight: isExpanded ? "200px" : "0", 
                    overflow: "hidden", 
                    transition: "max-height 0.3s ease",
                    paddingLeft: isExpanded ? "0" : "0" // handled by css
                  }}>
                    {item.submenu.map((sub) => (
                      <button
                        key={sub.id}
                        className={`sidebar-subitem ${activeMenu === sub.id ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuChange(sub.id);
                        }}
                      >
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', opacity: 0.7}}>
                          <circle cx="12" cy="12" r="4"></circle>
                        </svg>
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="sidebar-footer">
          <p className="footer-text">
            Designed, developed & maintain by <a href="https://iflorainfo.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#007bff", textDecoration: "underline" }}>IIPL</a>
          </p>
        </div>
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
                <div
                  className="stat-card"
                  onClick={() => handleMenuChange("software")}
                >
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
                <div
                  className="stat-card"
                  onClick={() => handleMenuChange("clients")}
                >
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
                <div
                  className="stat-card"
                  onClick={() => handleMenuChange("clients")}
                >
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

                <div
                  className="stat-card"
                  onClick={() => handleMenuChange("staff")}
                >
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalStaff}</div>
                    <div className="stat-label">Total Employees</div>
                  </div>
                </div>

                </div>
              )}

              <div className="quick-actions">
                <h2 className="quick-actions-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                  <button 
                    className="quick-action-card"
                    onClick={() => navigate("/dashboard?tab=software&action=add")
                    }
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
                    onClick={() => navigate("/dashboard?tab=clients&action=add")
                    }
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

                  <button 
                    className="quick-action-card"
                    onClick={() => navigate("/dashboard?tab=staff&action=add")
                    }
                  >
                    <div className="quick-action-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    </div>
                    <div className="quick-action-content">
                      <h3>Add Employee</h3>
                      <p>Register a new staff member</p>
                    </div>
                    <div className="quick-action-arrow">→</div>
                  </button>

                  <button 
                    className="quick-action-card"
                    onClick={() => navigate("/dashboard?tab=packages&action=add")
                    }
                  >
                    <div className="quick-action-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <div className="quick-action-content">
                      <h3>Add Package</h3>
                      <p>Create a new subscription package</p>
                    </div>
                    <div className="quick-action-arrow">→</div>
                  </button>

                  <button 
                    className="quick-action-card"
                    onClick={() => navigate("/dashboard?tab=services&action=add")
                    }
                  >
                    <div className="quick-action-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                    </div>
                    <div className="quick-action-content">
                      <h3>Add Service</h3>
                      <p>Add a new service offering</p>
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
              onFormClose={() => setSearchParams({ tab: "software" })}
            />
          )}

          {activeMenu === "clients" && (
            <ClientManagement 
              initialShowAddForm={showAddForm}
              onFormClose={() => setSearchParams({ tab: "clients" })}
            />
          )}

          {activeMenu === "packages" && (
            <PackageManagement 
              initialShowAddForm={showAddForm}
              onFormClose={() => setSearchParams({ tab: "packages" })}
            />
          )}

          {activeMenu === "dept_positions" && (
            <div>
              <div className="page-header">
                <h1 className="page-title">Departments & Positions</h1>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <DepartmentManagement />
                </div>
                <div>
                  <PositionManagement />
                </div>
              </div>
            </div>
          )}
          {activeMenu === "staff" && (
            <StaffManagement 
              initialShowAddForm={showAddForm}
              onFormClose={() => setSearchParams({ tab: "staff" })}
            />
          )}

          {activeMenu === "services" && (
            <ServiceManagement 
              initialShowAddForm={showAddForm}
              onFormClose={() => setSearchParams({ tab: "services" })}
            />
          )}

         
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
