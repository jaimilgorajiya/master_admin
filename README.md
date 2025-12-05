# Master Admin Panel

A centralized admin panel for managing multiple software applications and their clients.

## Features

- 🔐 **Authentication** - Secure login with JWT
- 💻 **Software Management** - Add, edit, and delete software applications
- 👥 **Client Management** - Create clients and automatically send credentials
- 📧 **Email Integration** - Automatic credential delivery to clients
- 🔗 **API Integration** - Register clients with external software APIs
- 🎨 **Modern UI** - Dark theme with responsive design

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer for emails
- Axios for API calls

**Frontend:**
- React + Vite
- React Router for navigation
- Axios for API calls
- SweetAlert2 for modals
- React Hot Toast for notifications

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Gmail account (for sending emails)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/master-admin
JWT_SECRET=your-secret-key-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. Start backend:
```bash
npm start
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend:
```bash
npm run dev
```

4. Open browser:
```
http://localhost:5173
```

## Usage

### 1. Register Master Admin

First time setup - register a master admin account:
- Go to login page
- Click register (if available) or use API directly

### 2. Login

- Email: your-email@example.com
- Password: your-password
- Check "Remember Me" to stay logged in

### 3. Add Software

- Go to "Software Management"
- Click "+ Add Software"
- Fill in:
  - Name
  - Description
  - Backend Register API Link (optional)
- Save

### 4. Add Client

- Go to "Client Management"
- Click "+ Add Client"
- Fill in:
  - Client Name
  - Client Email
  - Client Phone
  - Select Software
- System will:
  - Generate random password
  - Send email to client
  - Register with external software API (if configured)
  - Save client record

### 5. Client Receives Email

Client gets an email with:
- Their email address
- Generated password
- Instructions to login

## API Endpoints

### Authentication
```
POST /api/auth/register - Register master admin
POST /api/auth/login    - Login master admin
```

### Software Management
```
POST   /api/software/add        - Add software
GET    /api/software/all        - Get all software
PUT    /api/software/update/:id - Update software
DELETE /api/software/delete/:id - Delete software
```

### Client Management
```
POST   /api/client/create      - Create client
GET    /api/client/all         - Get all clients
PUT    /api/client/update/:id  - Update client
DELETE /api/client/delete/:id  - Delete client
```

## Email Configuration

### Using Gmail

1. Enable 2-Factor Authentication in your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `.env` file

### Email Template

When a client is created, they receive:
```
Subject: Your Software Access Credentials

Hello [Client Name],

Your access has been created.

Email: [client-email@example.com]
Password: [generated-password]

Please store these credentials securely.
```

## External Software Integration

When creating a client, the system can automatically register them with external software:

1. Add software with Backend Register API Link
2. When creating client, system calls:
```javascript
POST [Backend Register API Link]
{
  "name": "Client Name",
  "email": "client@example.com",
  "password": "generated-password"
}
```

3. External software creates user account
4. Client can login to external software with credentials

## Project Structure

```
master-admin-panel/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── software.controller.js
│   │   └── client.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── software.model.js
│   │   └── client.model.js
│   ├── routes/
│   │   ├── user.route.js
│   │   ├── software.routes.js
│   │   └── client.routes.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AddClient.jsx
    │   │   ├── AddSoftware.jsx
    │   │   ├── ClientManagement.jsx
    │   │   ├── EditClient.jsx
    │   │   ├── EditSoftware.jsx
    │   │   ├── LoadingSkeleton.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── SoftwareManagement.jsx
    │   ├── context/
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   └── Login.jsx
    │   ├── utils/
    │   │   └── axiosConfig.js
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Troubleshooting

### 401 Unauthorized Error
- Your token has expired (expires after 24 hours)
- Solution: Logout and login again

### Email Not Sending
- Check SMTP credentials in `.env`
- Make sure you're using App Password (not regular password)
- Check if 2FA is enabled on Gmail

### Cannot Connect to MongoDB
- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Try: `mongodb://localhost:27017/master-admin`

### CORS Error
- Backend already has CORS enabled
- Make sure backend is running on port 5000
- Make sure frontend is calling correct URL

## Security Notes

- JWT tokens expire after 24 hours
- Passwords are hashed with bcrypt
- Protected routes require authentication
- Email credentials stored securely in .env

## License

MIT

## Support

For issues or questions, check `PROJECT_CLEANUP_SUMMARY.md` for detailed information.
