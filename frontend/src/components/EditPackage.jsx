import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const EditPackage = ({ packageId, onBack, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        packageType: "software",
        softwareId: "",
        serviceIds: [],
        durationDays: 30,
        unit: 'days',
        price: 0,
        description: "",
    });
    const [softwareList, setSoftwareList] = useState([]);
    const [serviceList, setServiceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const [softwareRes, serviceRes, packagesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/software/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/service/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/package/all`, {
                   headers: { Authorization: `Bearer ${token}` }
                }) 
            ]);

            if(softwareRes.data.success) {
                setSoftwareList(softwareRes.data.softwareList);
            }

            if(serviceRes.data.success) {
                setServiceList(serviceRes.data.services);
            }

            if (packagesRes.data.success) {
                const pkg = packagesRes.data.packages.find(p => p._id === packageId);
                if (pkg) {
                    setFormData({
                        name: pkg.name,
                        packageType: pkg.packageType || (pkg.serviceIds && pkg.serviceIds.length > 0 ? "service" : "software"),
                        softwareId: pkg.softwareId?._id || pkg.softwareId || "",
                        serviceIds: pkg.serviceIds ? pkg.serviceIds.map(s => s._id || s) : [],
                        durationDays: pkg.durationDays,
                        unit: pkg.unit || 'days',
                        price: pkg.price,
                        description: pkg.description || "",
                    });
                } else {
                    setError("Package not found");
                }
            }
        } catch (error) {
            console.error("Fetch data error", error);
            setError("Failed to load package details");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleServiceChange = (e) => {
        const { value, checked } = e.target;
        let updatedServices = [...formData.serviceIds];
        if (checked) {
            updatedServices.push(value);
        } else {
            updatedServices = updatedServices.filter(id => id !== value);
        }
        setFormData({ ...formData, serviceIds: updatedServices });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/package/update/${packageId}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if(res.data.success) {
                toast.success("Package updated successfully");
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error("Update package error", error);
            setError(error.response?.data?.message || "Failed to update package");
            toast.error("Failed to update package");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Edit Package</h1>
                <button className="btn-secondary" onClick={onBack}>
                    ← Back to List
                </button>
            </div>

            <div className="form-center">
                <div className="form-card">
                    <form onSubmit={handleSubmit} className="form-layout">
                        {error && <div className="error-message">{error}</div>}
                        
                        <div className="form-group">
                            <label>Package Type</label>
                            <div className="toggle-group" style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <button 
                                    type="button" 
                                    className={`btn-toggle ${formData.packageType === 'software' ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, packageType: 'software'})}
                                    style={{ 
                                        flex: 1, 
                                        padding: '8px', 
                                        borderRadius: '6px', 
                                        border: 'none', 
                                        background: formData.packageType === 'software' ? 'var(--accent-primary)' : 'transparent',
                                        color: formData.packageType === 'software' ? '#fff' : 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Software Package
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn-toggle ${formData.packageType === 'service' ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, packageType: 'service'})}
                                    style={{ 
                                        flex: 1, 
                                        padding: '8px', 
                                        borderRadius: '6px', 
                                        border: 'none', 
                                        background: formData.packageType === 'service' ? 'var(--accent-primary)' : 'transparent',
                                        color: formData.packageType === 'service' ? '#fff' : 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Service Package
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Package Name <span className="required">*</span></label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {formData.packageType === 'software' ? (
                            <div className="form-group">
                                <label>Software <span className="required">*</span></label>
                                <select name="softwareId" value={formData.softwareId} onChange={handleChange} required>
                                    <option value="">Select Software</option>
                                    {softwareList.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Select Services <span className="required">*</span></label>
                                
                                <div 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        background: 'var(--input-bg)',
                                        color: formData.serviceIds && formData.serviceIds.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        minHeight: '45px'
                                    }}
                                >
                                    <span>
                                        {formData.serviceIds && formData.serviceIds.length > 0 
                                            ? serviceList
                                                .filter(s => formData.serviceIds.includes(s._id))
                                                .map(s => s.name)
                                                .join(', ')
                                            : "Select Services"}
                                    </span>
                                    <span style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                </div>

                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 10,
                                        marginTop: '4px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        padding: '5px'
                                    }}>
                                        {serviceList.length === 0 ? (
                                            <div style={{ padding: '10px', color: 'var(--text-tertiary)', textAlign: 'center' }}>No services available</div>
                                        ) : (
                                            serviceList.map(s => (
                                                <div 
                                                    key={s._id} 
                                                    onClick={() => {
                                                        const isSelected = formData.serviceIds.includes(s._id);
                                                        const e = {
                                                            target: {
                                                                value: s._id,
                                                                checked: !isSelected
                                                            }
                                                        };
                                                        handleServiceChange(e);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '10px',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        background: formData.serviceIds.includes(s._id) ? 'var(--bg-tertiary)' : 'transparent',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.serviceIds.includes(s._id)} 
                                                        readOnly
                                                        style={{ marginRight: '10px', width: 'auto', pointerEvents: 'none' }}
                                                    />
                                                    <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                <small className="input-hint">Select at least one service</small>
                            </div>
                        )}

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Duration Value <span className="required">*</span></label>
                                <input 
                                    type="number" 
                                    name="durationDays" 
                                    value={formData.durationDays} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Unit <span className="required">*</span></label>
                                <select name="unit" value={formData.unit} onChange={handleChange} required>
                                    <option value="days">Days</option>
                                    <option value="minutes">Minutes</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Price (₹) <span className="required">*</span></label>
                            <input 
                                type="number" 
                                name="price" 
                                value={formData.price} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows="3"
                            ></textarea>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Updating..." : "Update Package"}
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

export default EditPackage;
