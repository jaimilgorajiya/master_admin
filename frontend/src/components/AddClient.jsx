import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const AddClient = ({ onBack, onSuccess, initialClientType = 'software' }) => {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    softwareId: "",
    clientType: initialClientType, // 'software' | 'service'
    serviceIds: [],
    packageId: "",
    packageIds: [], // Multiple packages for service type
    validityPeriod: "", // Only used for custom overrides
  });
  const [softwareList, setSoftwareList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);

  const [packages, setPackages] = useState([]);

  useEffect(() => {
    fetchSoftware();
    fetchServices();
    fetchPackages();
  }, []);

  useEffect(() => {
     // Reset package selection when type changes
     setFormData(prev => ({ ...prev, packageId: "", packageIds: [] }));
  }, [formData.clientType]);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/package/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setPackages(response.data.packages);
      }
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number - only allow digits and limit to 10
    if (name === "clientPhone") {
      const digitsOnly = value.replace(/\D/g, "");
      const limitedDigits = digitsOnly.slice(0, 10);
      
      setFormData({
        ...formData,
        [name]: limitedDigits,
      });

      // Validate phone number
      if (limitedDigits.length > 0 && limitedDigits.length < 10) {
        setValidationErrors({
          ...validationErrors,
          phone: "Phone number must be exactly 10 digits",
        });
      } else {
        setValidationErrors({
          ...validationErrors,
          phone: "",
        });
      }
      return;
    }

    // Handle email validation
    if (name === "clientEmail") {
      setFormData({
        ...formData,
        [name]: value,
      });

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setValidationErrors({
          ...validationErrors,
          email: "Please enter a valid email address",
        });
      } else {
        setValidationErrors({
          ...validationErrors,
          email: "",
        });
      }
      return;
    }

    // Handle package selection
    if (name === "packageId") {
       setFormData({
          ...formData,
          packageId: value,
          validityPeriod: "" 
       });
       return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
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

  const handlePackageChange = (e) => {
      const { value, checked } = e.target;
      let updatedPackages = [...formData.packageIds];
      if (checked) {
          updatedPackages.push(value);
      } else {
          updatedPackages = updatedPackages.filter(id => id !== value);
      }
      setFormData({ ...formData, packageIds: updatedPackages });
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate before submit
    if (validationErrors.email || validationErrors.phone) {
      setError("Please fix validation errors before submitting");
      return;
    }

    if (formData.clientPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    
    if (formData.clientType === 'software' && !formData.softwareId) {
        setError("Please select a software");
        return;
    }
    
    if (formData.clientType === 'service') {
        if (formData.serviceIds.length === 0 && formData.packageIds.length === 0) {
            setError("Please select at least one Service OR a Package");
            return;
        }
    }

    // Helper to calculate total
    const calculateTotal = () => {
        let total = 0;
        let serviceTotal = 0;
        let pkgTotal = 0;
        
        // Sum services
        if (formData.serviceIds.length > 0) {
            formData.serviceIds.forEach(id => {
                const s = serviceList.find(service => service._id === id);
                if (s) serviceTotal += (s.price || 0);
            });
        }

        // Sum packages
        if (formData.clientType === 'software') {
             const pkg = packages.find(p => p._id === formData.packageId);
             pkgTotal = pkg ? (pkg.price || 0) : 0;
        } else {
             // Service mode - multiple packages
             if (formData.packageIds.length > 0) {
                 formData.packageIds.forEach(id => {
                     const p = packages.find(pkg => pkg._id === id);
                     if (p) pkgTotal += (p.price || 0);
                 })
             }
        }

        total = serviceTotal + pkgTotal;
        
        return { total, serviceTotal, pkgTotal };
    };

    const { total, serviceTotal, pkgTotal } = calculateTotal();

    // Find selected package(s) for display
    let selectedPkgNames = "";
    if(formData.clientType === 'software') {
        const p = packages.find(p => p._id === formData.packageId);
        selectedPkgNames = p ? `${p.name}` : 'N/A';
    } else {
        selectedPkgNames = packages
            .filter(p => formData.packageIds.includes(p._id))
            .map(p => p.name)
            .join(", ");
    }
    
    // Confirm before submission
    const result = await Swal.fire({
      title: "Confirm Client Creation",
      html: `
        <div style="text-align: left; font-size: 0.9em;">
          <p><strong>Name:</strong> ${formData.clientName}</p>
          <p><strong>Type:</strong> <span style="text-transform: capitalize; color: #00c8ff;">${formData.clientType}</span></p>
          
          ${formData.clientType === 'software' 
             ? `<p><strong>Software:</strong> ${softwareList.find(s => s._id === formData.softwareId)?.name || 'N/A'}</p>`
             : `
                <hr style="border-color: #444; margin: 8px 0;">
                <p><strong>Services:</strong> ₹${serviceTotal} (${formData.serviceIds.length})</p>
                <p><strong>Packages:</strong> ₹${pkgTotal} ${selectedPkgNames ? `(${selectedPkgNames})` : '(None)'}</p>
                <div style="background: #222; padding: 8px; margin-top: 8px; border-radius: 4px; border: 1px solid #444;">
                    <strong style="color: #28a745; font-size: 1.1em;">Total: ₹${total}</strong>
                </div>
             `
          }
           ${formData.clientType === 'software' ? `
          <hr style="border-color: #444; margin: 8px 0;">
          <p><strong>Package:</strong> ${selectedPkgNames}</p>
          <p><strong>Price:</strong> ₹${pkgTotal}</p>
           ` : ''}
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Create Client",
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
      
      const submitData = {
        ...formData,
        clientPhone: `+91${formData.clientPhone}`,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/client/create`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // ... success handling
        let successMessage = "Client added successfully!";
        if (response.data.warning) successMessage += ` Warning: ${response.data.warning}`;
        
        await Swal.fire({
            title: "Success!",
            text: successMessage,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            background: "#1a1a1a",
            color: "#ffffff"
        });

        onSuccess(successMessage);
        setFormData({ clientName: "", clientEmail: "", clientPhone: "", softwareId: "", clientType: initialClientType, serviceIds: [], packageId: "", packageIds: [], validityPeriod: "" });
        setValidationErrors({ email: "", phone: "" });
      }
    } catch (err) {
      console.error("Client creation error:", err);
      // ... error handling
       let errorMessage = "Failed to add client";
       if (err.response?.data?.message) errorMessage = err.response.data.message;
       
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

  // Calculate total for display in real-time
  const calculateTotal = () => {
      let total = 0;
      let serviceTotal = 0;
      let pkgTotal = 0;
      
      if (formData.serviceIds.length > 0) {
          formData.serviceIds.forEach(id => {
              const s = serviceList.find(service => service._id === id);
              if (s) serviceTotal += (s.price || 0);
          });
      }

      if (formData.clientType === 'software') {
           const pkg = packages.find(p => p._id === formData.packageId);
           pkgTotal = pkg ? (pkg.price || 0) : 0;
      } else {
           if (formData.packageIds.length > 0) {
               formData.packageIds.forEach(id => {
                   const p = packages.find(pkg => pkg._id === id);
                   if (p) pkgTotal += (p.price || 0);
               })
           }
      }

      total = serviceTotal + pkgTotal;
      
      return { total, serviceTotal, pkgTotal };
  };

  const currentTotal = calculateTotal();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Add New Client</h1>
        <button className="btn-secondary" onClick={onBack}>
          ← Back to List
        </button>
      </div>

      <div className="form-center">
        <div className="form-card">
          <form onSubmit={handleSubmit} className="form-layout">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label>Choose Type</label>
                <div className="toggle-group" style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <button 
                        type="button" 
                        className={`btn-toggle ${formData.clientType === 'software' ? 'active' : ''}`}
                        onClick={() => setFormData({...formData, clientType: 'software'})}
                        style={{ 
                            flex: 1, 
                            padding: '8px', 
                            borderRadius: '6px', 
                            border: 'none', 
                            background: formData.clientType === 'software' ? 'var(--accent-primary)' : 'transparent',
                            color: formData.clientType === 'software' ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        Software 
                    </button>
                    <button 
                        type="button" 
                        className={`btn-toggle ${formData.clientType === 'service' ? 'active' : ''}`}
                        onClick={() => setFormData({...formData, clientType: 'service'})}
                        style={{ 
                            flex: 1, 
                            padding: '8px', 
                            borderRadius: '6px', 
                            border: 'none', 
                            background: formData.clientType === 'service' ? 'var(--accent-primary)' : 'transparent',
                            color: formData.clientType === 'service' ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        Service 
                    </button>
                </div>
            </div>

            <div className="form-group">
              <label htmlFor="clientName">
                Client Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                placeholder="client@example.com"
                required
                className={validationErrors.email ? "input-error" : ""}
              />
              {validationErrors.email && (
                <small className="error-hint">{validationErrors.email}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="clientPhone">
                Phone Number <span className="required">*</span>
              </label>
              <div className="phone-input-wrapper">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  id="clientPhone"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength="10"
                  required
                  className={validationErrors.phone ? "input-error" : ""}
                />
              </div>
              {validationErrors.phone && (
                <small className="error-hint">{validationErrors.phone}</small>
              )}
            </div>

            {formData.clientType === 'software' ? (
                <div className="form-group">
                  <label htmlFor="softwareId">
                    Select Software <span className="required">*</span>
                  </label>
                  <select
                    id="softwareId"
                    name="softwareId"
                    value={formData.softwareId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Software --</option>
                    {softwareList.map((software) => (
                      <option key={software._id} value={software._id}>
                        {software.name}
                      </option>
                    ))}
                  </select>
                </div>
            ) : (
                <div className="form-group" style={{ position: 'relative' }}>
                    <label>Select Services</label>
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            background: 'var(--input-bg)',
                            color: formData.serviceIds.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            minHeight: '45px'
                        }}
                    >
                        <span>
                            {formData.serviceIds.length > 0 
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
                                        <span style={{ color: 'var(--text-primary)' }}>{s.name} <span style={{color: 'var(--text-tertiary)', fontSize: '0.85em'}}>(₹{s.price || 0})</span></span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="packageId">
                Select Package / Validity {formData.clientType === 'software' && <span className="required">*</span>}
              </label>

              {formData.clientType === 'software' ? (
                  <select
                    id="packageId"
                    name="packageId"
                    value={formData.packageId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Package --</option>
                    {packages
                      .filter(pkg => pkg.softwareId?._id === formData.softwareId || pkg.softwareId === formData.softwareId)
                      .map(pkg => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.name} ({pkg.durationDays} {pkg.unit || 'Days'})
                      </option>
                    ))}
                  </select>
              ) : (
                  <>
                    <div 
                        onClick={() => setIsPackageDropdownOpen(!isPackageDropdownOpen)}
                        style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            background: 'var(--input-bg)',
                            color: formData.packageIds.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            minHeight: '45px'
                        }}
                    >
                        <span>
                            {formData.packageIds.length > 0 
                                ? packages
                                    .filter(p => formData.packageIds.includes(p._id))
                                    .map(p => p.name)
                                    .join(', ')
                                : "Select Packages"}
                        </span>
                        <span style={{ transform: isPackageDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                    </div>

                    {isPackageDropdownOpen && (
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
                            {packages
                                .filter(pkg => pkg.packageType === 'service' || (pkg.serviceIds && pkg.serviceIds.length > 0 && !pkg.softwareId))
                                .length === 0 ? (
                                <div style={{ padding: '10px', color: 'var(--text-tertiary)', textAlign: 'center' }}>No packages available</div>
                            ) : (
                                packages
                                .filter(pkg => pkg.packageType === 'service' || (pkg.serviceIds && pkg.serviceIds.length > 0 && !pkg.softwareId))
                                .map(pkg => (
                                    <div 
                                        key={pkg._id} 
                                        onClick={() => {
                                            const isSelected = formData.packageIds.includes(pkg._id);
                                            const e = {
                                                target: {
                                                    value: pkg._id,
                                                    checked: !isSelected
                                                }
                                            };
                                            handlePackageChange(e);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '10px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            background: formData.packageIds.includes(pkg._id) ? 'var(--bg-tertiary)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={formData.packageIds.includes(pkg._id)} 
                                            readOnly
                                            style={{ marginRight: '10px', width: 'auto', pointerEvents: 'none' }}
                                        />
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {pkg.name} ({pkg.durationDays} {pkg.unit}) 
                                            <span style={{color: 'var(--text-tertiary)', fontSize: '0.85em', marginLeft: '6px'}}>(₹{pkg.price || 0})</span>
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                  </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '5px', gap: '8px' }}>
                  {/* TOTAL AMOUNT DISPLAY */}
                  {((formData.clientType === 'service' && (formData.serviceIds.length > 0 || formData.packageIds.length > 0)) || 
                    (formData.clientType === 'software' && formData.packageId)) && (
                      <div style={{
                          marginTop: '8px',
                          padding: '12px',
                          background: 'rgba(40, 167, 69, 0.1)',
                          border: '1px solid rgba(40, 167, 69, 0.3)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                      }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95em' }}>
                              Total Amount {formData.clientType === 'service' ? 
                                  `(${currentTotal.serviceTotal > 0 ? `Services: ₹${currentTotal.serviceTotal}` : ''}${(currentTotal.serviceTotal > 0 && currentTotal.pkgTotal > 0) ? ' + ' : ''}${currentTotal.pkgTotal > 0 ? `Packages: ₹${currentTotal.pkgTotal}` : ''})` 
                                  : 
                                  `(Package: ₹${currentTotal.pkgTotal})`
                              }:
                          </span>
                          <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '1.2em' }}>
                              ₹{currentTotal.total}
                          </span>
                      </div>
                  )}
              </div>
            </div>


            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Adding Client..." : "Add Client"}
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

export default AddClient;
