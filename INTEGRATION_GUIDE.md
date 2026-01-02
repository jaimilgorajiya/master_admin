# How to Integrate New Software with Master Admin

This guide explains how to make any external Node.js/React application compatible with the Master Admin System for centralized license management, expiry, and renewal.

## 1. Backend Integration (Node.js/Express)

### A. Database Model
Your User/Admin model must have a `status` field and store the Master Admin's reference if needed.

```javascript
// models/Admin.js
const adminSchema = new mongoose.Schema({
    // ... other fields
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    }, 
    // ...
});
```

### B. Required API Endpoints
You must expose these 4 endpoints for the Master Admin to control your software.

1.  **Register User (POST)**
    *   **Route**: `/api/admin/register`
    *   **Body**: `{ name, email, mobile, password, ... }`
    *   **Action**: Create a new user in your database.

2.  **Get All Users (GET)**
    *   **Route**: `/api/admin/all`
    *   **Response**: `{ admins: [ { _id, email, ... } ] }`
    *   **Purpose**: Allows Master Admin to map emails to IDs.

3.  **Update Status (PATCH)**
    *   **Route**: `/api/admin/status/:id`
    *   **Body**: `{ status: 'active' | 'inactive' }`
    *   **Action**: Update the user's `status` field in your DB.

4.  **Delete User (DELETE)**
    *   **Route**: `/api/admin/delete/:id`
    *   **Action**: Delete the user (optional, used for cleanup).

### C. Authentication Middleware (CRITICAL)
Your JWT verification middleware **MUST** check the database status. Do not rely only on the token signature.

```javascript
// middleware/authMiddleware.js
export const verifyUser = async (req, res, next) => {
    // ... verify token ...
    const decoded = jwt.verify(token, secret);

    // CRITICAL: Check DB status
    const user = await Admin.findById(decoded.id);
    if (!user || user.status !== 'active') {
        return res.status(403).json({ message: "Account is inactive. Please renew." });
    }
    
    req.user = decoded;
    next();
};
```

### D. "Me" Endpoint
Create a lightweight endpoint to check status.
```javascript
router.get('/me', verifyUser, (req, res) => res.json(req.user));
```

## 2. Frontend Integration (React)

### A. Login Page Redirect
In your `Login.jsx` (or equivalent), catch 403 errors.

```javascript
try {
    await loginUser(formData);
} catch (error) {
    if (error.response?.status === 403 || error.response?.data?.message?.includes('inactive')) {
        // Redirect to Master Admin Renewal
        const email = formData.email;
        window.location.href = `http://192.168.29.90:5173/renew/${encodeURIComponent(email)}`;
    }
}
```

### B. Auto-Logout (Polling)
In your main Layout or Sidebar (`SidePanel.jsx`), add a check.

```javascript
useEffect(() => {
    const checkStatus = async () => {
        try {
            await axios.get(`${API_URL}/api/admin/me`, { headers: { ... } });
        } catch (error) {
            if (error.response?.status === 403) {
                // Logout and Redirect
                localStorage.clear();
                window.location.href = `http://192.168.29.90:5173/renew/${encodeURIComponent(email)}`;
            }
        }
    };
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
}, []);
```

## 3. Connect in Master Admin
1.  Log in to **Master Admin**.
2.  Go to **Software Management**.
3.  Add New Software (e.g., "HR Management System").
4.  Enter the full API URLs for the endpoints you created above:
    *   Register API: `http://new-app-url/api/admin/register`
    *   Get All API: `http://new-app-url/api/admin/all`
    *   Update Status API: `http://new-app-url/api/admin/status/:id`
    *   Delete API: `http://new-app-url/api/admin/delete/:id`

Done! Your new software is now fully controlled by the Master Admin.
