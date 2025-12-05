# Client Deactivation Feature - Master Admin Panel

## Overview
The Master Admin Panel includes a complete client deactivation feature that allows administrators to activate/deactivate clients, preventing them from accessing their associated software projects.

## How It Works

### 1. **Backend Implementation** ✅

#### Database Model (`models/client.model.js`)
- Each client has an `isActive` field (Boolean, default: `true`)
- When `isActive` is `false`, the client is deactivated

#### API Endpoints (`routes/client.routes.js`)
- **Toggle Status**: `PATCH /api/client/toggle-status/:id` (Protected)
  - Toggles the client's active status
  - Requires admin authentication
  
- **Check Status**: `GET /api/client/check-status/:email` (Public)
  - External software can check if a client is active
  - No authentication required
  - Returns `isActive` status

#### Controller (`controllers/client.controller.js`)
- `toggleClientStatus()` - Toggles client active/inactive status
- `checkClientStatus()` - Public endpoint for external software to verify client status

### 2. **Frontend Implementation** ✅

#### Client Management UI (`components/ClientManagement.jsx`)
- **Toggle Switch**: Each client row has a toggle switch showing their status
- **Visual Feedback**: 
  - Green (ON) = Active client
  - Gray (OFF) = Inactive client
- **Confirmation Dialog**: SweetAlert2 confirmation before toggling status
- **Real-time Updates**: Table refreshes after status change

#### Styling (`App.css`)
- Custom toggle switch with smooth animations
- Active state: Cyan (#00c8ff)
- Inactive state: Gray (#666666)

### 3. **Integration with External Software** 📋

External software (like Quotation Management System) can integrate by:

1. **During Login**: Check client status before allowing access
```javascript
const statusCheck = await axios.get(
  `http://localhost:5000/api/client/check-status/${email}`
);

if (!statusCheck.data.isActive) {
  return res.status(403).json({ 
    message: "Your account has been deactivated" 
  });
}
```

2. **As Middleware**: Check status on every protected route
3. **With Caching**: Cache status for 1-5 minutes to reduce API calls

See `CLIENT_STATUS_INTEGRATION.md` for complete integration guide.

## Usage Instructions

### For Master Admin:

1. **Navigate to Client Management**
   - Click "Client Management" in the sidebar

2. **View Client Status**
   - Active clients show a green toggle switch (ON)
   - Inactive clients show a gray toggle switch (OFF)

3. **Deactivate a Client**
   - Click the toggle switch for the client
   - Confirm the action in the popup dialog
   - Client is immediately deactivated

4. **Reactivate a Client**
   - Click the toggle switch again
   - Confirm the action
   - Client can now access their software

### What Happens When a Client is Deactivated:

1. ✅ Toggle switch turns gray in the admin panel
2. ✅ Client's `isActive` field is set to `false` in database
3. ✅ External software can check status via API
4. ⚠️ Client login should be blocked (requires integration in external software)
5. ⚠️ Client's active sessions should be terminated (requires integration)

## Testing

### Test the Toggle Feature:
1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Login as admin
4. Go to Client Management
5. Toggle a client's status
6. Verify the status changes in the UI

### Test the Status Check API:
```bash
# Check active client
curl http://localhost:5000/api/client/check-status/client@example.com

# Response for active client:
{
  "success": true,
  "isActive": true,
  "clientName": "John Doe",
  "software": "Quotation Management System",
  "message": "Client is active"
}

# Response for inactive client:
{
  "success": true,
  "isActive": false,
  "clientName": "John Doe",
  "software": "Quotation Management System",
  "message": "Client account has been deactivated by admin"
}
```

## Security Considerations

✅ **Admin Authentication**: Toggle endpoint requires admin JWT token
✅ **Public Status Check**: External software can verify without authentication
✅ **Confirmation Dialog**: Prevents accidental deactivation
✅ **Audit Trail**: Timestamps tracked via `updatedAt` field
✅ **Graceful Degradation**: Status check returns `isActive: false` on errors

## Next Steps for Complete Implementation

To fully prevent deactivated clients from accessing their projects:

1. **Integrate Status Check in External Software**
   - Add status check in login controllers
   - Implement middleware for protected routes
   - Handle 403 responses in frontend

2. **Session Management**
   - Terminate active sessions when client is deactivated
   - Implement real-time status checks (WebSocket/polling)

3. **Notifications**
   - Email client when their account is deactivated
   - Email client when their account is reactivated

4. **Logging & Audit**
   - Log all status changes
   - Track who deactivated/activated clients
   - Generate reports on client status history

## Files Modified/Created

✅ Backend:
- `models/client.model.js` - Added `isActive` field
- `controllers/client.controller.js` - Added toggle and check functions
- `routes/client.routes.js` - Added status endpoints

✅ Frontend:
- `components/ClientManagement.jsx` - Added toggle switch UI
- `App.css` - Added toggle switch styles

✅ Documentation:
- `CLIENT_STATUS_INTEGRATION.md` - Integration guide for external software
- `CLIENT_DEACTIVATION_FEATURE.md` - This file

## Support

For questions or issues with the client deactivation feature, contact the development team.
