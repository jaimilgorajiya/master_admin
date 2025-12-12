# Client Registration System Guide

## Overview
This Master Admin Panel allows you to manage multiple software applications and automatically register clients for them through API integration.

## How It Works

### 1. Software Management
First, add your software applications with their API endpoints:

**Required Fields:**
- **Name**: Software name (e.g., "Quotation Management System")
- **Description**: What the software does
- **Register API Link**: ⚠️ **REQUIRED** - API endpoint to register new clients

**Optional Fields (for advanced features):**
- **Get All Clients API**: Fetch existing clients (needed for status updates & deletion)
- **Delete Client API**: Remove clients from external software
- **Update Status API**: Activate/deactivate clients in external software

### 2. Client Registration Process
When you add a client:

1. **Select Software**: Choose which software to register the client for
2. **Enter Details**: Client name, email, and phone number
3. **Automatic Registration**: System will:
   - Generate a secure random password
   - Call the software's Register API with client details
   - Store client information in Master Admin database
   - Show registration status

### 3. Registration Status Types

| Status | Description |
|--------|-------------|
| ✅ **Success** | Client successfully registered in external software |
| ❌ **Failed** | Registration failed (check API or client details) |
| ⏳ **Pending** | Registration in progress |
| ⚠️ **Skipped** | No Register API configured for this software |
| ⚠️ **Exists** | Client email already exists in external software |

### 4. API Integration Requirements

Your software's Register API should:
- **Accept POST requests** to the registration endpoint
- **Expect JSON payload** with these fields:
  ```json
  {
    "name": "Client Name",
    "email": "client@example.com", 
    "password": "generated_password",
    "phone": "+919876543210"
  }
  ```
- **Return success status** (200-299) for successful registration
- **Return error status** (400+) for failures

### 5. Advanced Features

**Status Management:**
- Toggle client active/inactive status
- Syncs with external software if APIs are configured

**Client Deletion:**
- Remove from Master Admin Panel
- Optionally delete from external software

**Status Checking:**
- External software can check client status via: `/api/client/check-status/:email`

## Example API Setup

```javascript
// Your software's registration endpoint
app.post('/api/admin/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  
  // Register user in your system
  // Return success/error response
  
  res.json({ success: true, message: 'User registered successfully' });
});
```

## Troubleshooting

**Registration Failed?**
- Check if Register API URL is correct
- Verify API accepts the required fields
- Check API response format
- Ensure API is accessible from Master Admin server

**Status Updates Not Working?**
- Configure "Get All Clients API" and "Update Status API"
- Ensure APIs return expected data format
- Check client email matches between systems

## Security Notes
- Generated passwords are 12 characters with mixed case, numbers, and symbols
- All API calls include proper error handling
- Client credentials are stored securely in the Master Admin database