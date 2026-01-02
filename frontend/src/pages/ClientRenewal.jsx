import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const ClientRenewal = () => {
  const { encryptedId } = useParams();
  const [client, setClient] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use email from URL param or ID. For simplicity in this demo, let's assume the "encryptedId" is actually the email encoded
  // In production, use real encryption
  const email = decodeURIComponent(encryptedId || "");

    useEffect(() => {
        fetchClientInfo();
    }, [email]);

    const fetchClientInfo = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/public/client-info?email=${email}`);
            if (res.data.success) {
                setClient(res.data.client);
                setPackages(res.data.packages);
            }
        } catch (error) {
            console.error("Error fetching client info", error);
            toast.error("Invalid Renewal Link");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (pkg) => {
        const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!keyId || keyId === 'YOUR_TEST_KEY_ID_HERE') {
            toast.error("Payment Gateway not configured (Key ID missing)");
            return;
        }

        toast.loading(`Initializing Payment for ${pkg.name}...`);
        
        try {
            // 1. Create Order
            const orderRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/payment/create-order`, {
                amount: pkg.price,
                currency: "INR"
            });

            if (!orderRes.data.success) {
                toast.dismiss();
                toast.error("Failed to create order");
                return;
            }

            const { order } = orderRes.data;

            // 2. Open Razorpay
            const options = {
                key: keyId, 
                amount: order.amount, 
                currency: order.currency,
                name: "Master Admin Renewal",
                description: `Renewal for ${pkg.name}`,
                order_id: order.id, 
                handler: async function (response) {
                    toast.loading("Verifying Payment...");
                    
                    try {
                        // 3. Process Renewal on Backend
                        const renewRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/public/process-renewal`, {
                            clientId: client._id,
                            packageId: pkg._id,
                            paymentDetails: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        });

                        toast.dismiss();
                        if (renewRes.data.success) {
                            toast.success("Payment Successful! Account Reactivated.");
                            
                            // Redirect to software login if available
                            if (client.frontendUrl) {
                                setTimeout(() => window.location.href = client.frontendUrl, 1500);
                            } else if (client.softwareName?.toLowerCase().includes("quotation")) {
                                setTimeout(() => window.location.href = "http://localhost:5174/login", 1500);
                            } else {
                                fetchClientInfo();
                            }
                        } else {
                            toast.error("Renewal failed after payment. Contact Support.");
                        }
                    } catch (err) {
                        toast.dismiss();
                        console.error("Renewal Error:", err);
                        toast.error("Server error during renewal.");
                    }
                },
                prefill: {
                    name: client.name,
                    email: client.email,
                    contact: client.clientPhone || "" 
                },
                theme: {
                    color: "#00c8ff"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response){
                toast.dismiss();
                toast.error(`Payment Failed: ${response.error.description}`);
            });
            
            toast.dismiss();
            rzp1.open();

        } catch (error) {
            toast.dismiss();
            console.error("Payment Init Error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Could not initiate payment.";
            toast.error(`Payment Error: ${errorMessage}`);
        }
    };

    if (loading) return <div className="loading-screen">Loading details...</div>;

    if (!client) return <div className="renewal-container"><h1>Invalid or Expired Link</h1></div>;

    return (
        <div className="renewal-container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', background: '#1a1a1a', color: '#fff', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: client.isActive ? '#00ff88' : '#ff3b30' }}>
                    {client.isActive ? "Subscription Active" : "Renew Your Subscription"}
                </h1>
                <p>
                    {client.isActive 
                     ? `Your plan is valid until ${new Date(client.expiryDate).toLocaleDateString()}` 
                     : "Your access to Software has expired."}
                </p>
                {client.isActive && (
                    <button 
                        onClick={() => {
                            if (client.frontendUrl) window.location.href = client.frontendUrl;
                            else if (client.softwareName?.toLowerCase().includes("quotation")) window.location.href = "http://localhost:5174/login";
                        }}
                        style={{ marginTop: '1rem', padding: '10px 20px', background: '#00ff88', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Go to Software Login
                    </button>
                )}
            </div>

            <div className="client-info" style={{ background: '#333', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <h3>Account Details</h3>
                <p><strong>Name:</strong> {client.name}</p>
                <p><strong>Email:</strong> {client.email}</p>
                <p><strong>Software:</strong> {client.softwareName}</p>
            </div>

            {!client.isActive && (
             <>
                <h3>Select a Renewal Plan</h3>
                <div className="packages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {packages.map(pkg => (
                        <div key={pkg._id} className="package-card" style={{ border: '1px solid #444', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ color: '#00c8ff' }}>{pkg.name}</h3>
                            <div style={{ fontSize: '2rem', margin: '1rem 0' }}>₹{pkg.price}</div>
                            {pkg.description && <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{pkg.description}</p>}
                            <p>{pkg.durationDays} {pkg.unit || 'Days'} Access</p>
                            <button 
                                onClick={() => handlePayment(pkg)}
                                style={{ 
                                    background: '#00c8ff', 
                                    border: 'none', 
                                    padding: '10px 20px', 
                                    borderRadius: '6px', 
                                    color: '#fff', 
                                    cursor: 'pointer', 
                                    marginTop: '1rem', 
                                    width: '100%' 
                                }}
                            >
                                Pay & Renew
                            </button>
                        </div>
                    ))}
                </div>
             </>
            )}
        </div>
    );
};

export default ClientRenewal;
