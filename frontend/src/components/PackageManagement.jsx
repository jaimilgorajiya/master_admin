import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import AddPackage from "./AddPackage";
import EditPackage from "./EditPackage";
import { TableSkeleton } from "./LoadingSkeleton";

const PackageManagement = ({ initialShowAddForm, onFormClose }) => {
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [softwareList, setSoftwareList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(initialShowAddForm || false);
    const [editingPackageId, setEditingPackageId] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSoftware, setSelectedSoftware] = useState("");
    const [activeTab, setActiveTab] = useState("software"); // 'software' | 'service'

    useEffect(() => {
        fetchPackages();
        fetchSoftware();
    }, []);

    useEffect(() => {
        if (initialShowAddForm) {
            setShowForm(true);
        }
    }, [initialShowAddForm]);

    useEffect(() => {
        filterPackages();
        // eslint-disable-next-line
    }, [packages, searchTerm, selectedSoftware, activeTab]);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/package/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(res.data.success) {
                setPackages(res.data.packages);
            }
        } catch (error) {
            console.error("Fetch packages error", error);
            toast.error("Failed to load packages");
        } finally {
            setLoading(false);
        }
    };

    const fetchSoftware = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/software/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(res.data.success) {
                setSoftwareList(res.data.softwareList);
            }
        } catch (error) {
            console.error("Fetch software error", error);
        }
    };

    const filterPackages = () => {
        let filtered = packages.filter(p => p.packageType === activeTab);

        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(lowerSearch) ||
                (p.softwareId?.name && p.softwareId.name.toLowerCase().includes(lowerSearch)) ||
                (p.serviceIds && p.serviceIds.some(s => s.name.toLowerCase().includes(lowerSearch)))
            );
        }

        if (activeTab === 'software' && selectedSoftware) {
            filtered = filtered.filter(p => 
                p.softwareId?._id === selectedSoftware || p.softwareId === selectedSoftware
            );
        }

        setFilteredPackages(filtered);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("adminToken");
                await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/package/delete/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Package deleted");
                fetchPackages();
            } catch (error) {
                toast.error("Failed to delete package");
            }
        }
    };

    const handleToggleStatus = async (pkg) => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/package/toggle-status/${pkg._id}`, 
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if(res.data.success) {
                toast.success(res.data.message);
                fetchPackages();
            }
        } catch (error) {
            console.error("Toggle status error", error);
            toast.error("Failed to update status");
        }
    };

    if (showForm) {
        return (
            <AddPackage 
                initialPackageType={activeTab}
                onBack={() => {
                    setShowForm(false);
                    if (onFormClose) onFormClose();
                }} 
                onSuccess={() => {
                    setShowForm(false);
                    if (onFormClose) onFormClose();
                    fetchPackages();
                }} 
            />
        );
    }

    if (editingPackageId) {
        return (
            <EditPackage 
                packageId={editingPackageId}
                onBack={() => setEditingPackageId(null)}
                onSuccess={() => {
                    setEditingPackageId(null);
                    fetchPackages();
                }}
            />
        );
    }

    return (
        <div className="card-container">
            <div className="page-header">
                <h1 className="page-title">Package Management</h1>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    + Add New Package
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
                    Software Packages
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
                    Service Packages
                </button>
            </div>

            {/* Filters */}
            <div className="search-filter-section">
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="Search packages..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                     <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </div>
                {activeTab === 'software' && (
                    <div className="filter-section">
                        <select 
                            value={selectedSoftware} 
                            onChange={(e) => setSelectedSoftware(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Software</option>
                            {softwareList.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Package Name</th>
                            {activeTab === 'software' ? <th>Software</th> : <th>Services</th>}
                            <th>Duration</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="6" style={{textAlign: 'center'}}><TableSkeleton columns={6} rows={5}/></td></tr>
                        ) : filteredPackages.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>No packages found</td>
                            </tr>
                        ) : (
                            filteredPackages.map(pkg => (
                                <tr key={pkg._id}>
                                    <td className="font-semibold">{pkg.name}</td>
                                    {activeTab === 'software' ? (
                                        <td>{pkg.softwareId?.name || "N/A"}</td>
                                    ) : (
                                        <td>
                                            {pkg.serviceIds?.length > 0 
                                                ? pkg.serviceIds.map(s => s.name).join(', ') 
                                                : "No Services"}
                                        </td>
                                    )}
                                    <td >{pkg.durationDays} {pkg.unit || 'Days'}</td>
                                    <td>₹{pkg.price}</td>
                                    <td>
                                        <label className="toggle-switch">
                                            <input 
                                                type="checkbox" 
                                                checked={pkg.isActive} 
                                                onChange={() => handleToggleStatus(pkg)} 
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'start' }}>
                                            <button className="btn-icon" onClick={() => setEditingPackageId(pkg._id)} title="Edit">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button className="btn-icon btn-delete" onClick={() => handleDelete(pkg._id)} title="Delete">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PackageManagement;
