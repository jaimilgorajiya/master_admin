import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("employeeToken");
      const data = localStorage.getItem("employeeData");
      
      if (!token || !data) {
        navigate("/employee/login");
        return;
      }

      // Initial Load
      setEmployee(JSON.parse(data));

      try {
        // Verify session validity (checks if active in DB)
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/staff-auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // If 401/403, it means token invalid or user inactive
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("employeeToken");
          localStorage.removeItem("employeeData");
          toast.error("Session expired or account deactivated.");
          navigate("/employee/login");
        }
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeData");
    toast.success("Logged out successfully");
    navigate("/employee/login");
  };

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="dashboard-layout">
      {/* Basic Header */}
      <header className="dashboard-header" style={{ gridColumn: "1 / -1" }}>
        <div className="header-left">
          <div className="logo">
             <img src="/logo.png" alt="Logo" className="logo-image" />
             <span className="logo-text">Employee Portal</span>
          </div>
        </div>
        <div className="header-right">
          <span style={{ color: 'var(--text-primary)', marginRight: '15px' }}>
            {employee.name} ({employee.iiplId})
          </span>
          <button 
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-content" style={{ gridColumn: "1 / -1", padding: "40px" }}>
        <div className="content-wrapper">
          <h1 className="page-title">Welcome Back, {employee.name}!</h1>
          <p className="page-description">This is your dedicated employee dashboard.</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                 <div className="stat-value">Active</div>
                 <div className="stat-label">Status</div>
              </div>
            </div>
            {/* Add more widgets here later */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
