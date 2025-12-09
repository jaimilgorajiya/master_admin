# Master Admin Panel

A centralized admin panel for managing multiple software applications and their clients.

This project consists of a **Node.js/Express + MongoDB backend** and a **React + Vite frontend**. It allows you to:

- Manage software applications your organization offers.
- Create and manage clients for each software.
- Automatically generate and email credentials to clients.
- Optionally register clients with external software backends through configurable APIs.

---

## Features

- 🔐 **Authentication**
  - Secure master admin login with JWT.
  - Protected API routes for managing software and clients.

- 💻 **Software Management**
  - Add, edit, and delete software records.
  - Store optional backend registration API URLs for each software.

- 👥 **Client Management**
  - Create, update, and delete clients.
  - Link clients to one or more software applications.

- 📧 **Email Integration**
  - Automatically send generated credentials to clients via email.
  - Configurable SMTP using environment variables.

- 🔗 **External API Integration**
  - When a client is created, the system can call an external software backend to create the client/user there as well.

- 🎨 **Modern UI**
  - React + Vite single-page app.
  - Dark-themed, responsive layout.
  - Toasts, modals, and loading states for smooth UX.

---

## Tech Stack

**Backend**

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (SMTP emails)
- Axios (server-side HTTP calls)

**Frontend**

- React (Vite)
- React Router
- Axios
- SweetAlert2
- React Hot Toast

---

## Project Structure

```text
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
│   ├── .env (not committed)
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

---

## Prerequisites

- **Node.js** v18+ (recommended)
- **MongoDB** running locally or in the cloud
- **SMTP-capable email account** (e.g., Gmail) for sending client credentials

---

## Installation & Setup

### 1. Backend Setup

1. Navigate to the backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in `backend/` (see **Environment Variables** above).

4. Start the backend (development mode with auto-restart):

   ```bash
   npm run dev
   ```

   Or start once without nodemon:

   ```bash
   npm start
   ```

The backend will listen on `PORT` (default `5000`) and bind to `0.0.0.0` so it’s accessible from your network.

### 2. Frontend Setup

1. Navigate to the frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in `frontend/` (or update the existing one) and set `VITE_API_BASE_URL`.

4. Start the frontend dev server:

   ```bash
   npm run dev
   ```

5. Open the URL printed by Vite, typically:

   ```text
   http://localhost:5173
   ```

### 3. Running Both Together

- Start backend (`cd backend && npm run dev`).
- Start frontend (`cd frontend && npm run dev`).
- Ensure `VITE_API_BASE_URL` matches the backend URL and port.

---

## NPM Scripts

### Backend (`backend/package.json`)

- **`npm run dev`**
  - Runs the Express server with `nodemon` watching `server.js`.

- **`npm start`**
  - Runs `node server.js` once (useful for production-like runs).

### Frontend (`frontend/package.json`)

- **`npm run dev`**
  - Starts the Vite dev server.

- **`npm run build`**
  - Builds the production React bundle into `dist/`.

- **`npm run preview`**
  - Serves the built `dist/` bundle locally for testing.

- **`npm run lint`**
  - Runs ESLint on the frontend source.

---

## Usage

### 1. Register Master Admin

On first run, you’ll need a master admin account.

- Open the frontend in your browser.
- Navigate to the login page.
- If a UI register flow is available, use it, or call the `/api/auth/register` endpoint directly.

### 2. Login

- Use your registered master admin **email** and **password**.
- Optionally enable **Remember Me** to persist the session.

### 3. Software Management

- Navigate to **Software Management**.
- Click **"+ Add Software"**.
- Fill in:
  - Name
  - Description
  - Backend Register API Link (optional; used for external integrations)
- Save to persist the software definition.

### 4. Client Management

- Navigate to **Client Management**.
- Click **"+ Add Client"**.
- Fill in:
  - Client Name
  - Client Email
  - Client Phone
  - Select Software
- On save, the system will:
  - Generate a random password for the client.
  - Send credentials via email.
  - Call the configured external software API (if present).
  - Persist the client record.

### 5. Client Email

Each new client receives an email containing:

- Their **email address**.
- Their **generated password**.
- Basic instructions for logging into the relevant software.

---

## API Endpoints (Backend)

Base URL: `http://<backend-host>:<PORT>` (e.g., `http://localhost:5000`).

### Authentication

```text
POST /api/auth/register  - Register master admin
POST /api/auth/login     - Login master admin
```

### Software Management

```text
POST   /api/software/add         - Add software
GET    /api/software/all         - Get all software
PUT    /api/software/update/:id  - Update software
DELETE /api/software/delete/:id  - Delete software
```

### Client Management

```text
POST   /api/client/create        - Create client
GET    /api/client/all           - Get all clients
PUT    /api/client/update/:id    - Update client
DELETE /api/client/delete/:id    - Delete client
```

---

## Email Configuration

### Using Gmail (Recommended)

1. Enable **2‑Factor Authentication (2FA)** on your Google account.
2. Generate an **App Password**:
   - Go to **Google Account → Security → 2‑Step Verification → App passwords**.
   - Choose app = **Mail**, device = **Other** (or similar).
   - Generate an app password.
3. Use that password as `SMTP_PASS` in `backend/.env`.

### Email Template

When a client is created, they receive an email similar to:

```text
Subject: Your Software Access Credentials

Hello [Client Name],

Your access has been created.

Email: [client-email@example.com]
Password: [generated-password]

Please store these credentials securely.
```

You can customize the template in the backend mailer logic if needed.

---

## External Software Integration

When creating a client, the system can call the external software’s registration API.

1. When adding software, set the **Backend Register API Link**.
2. On client creation, the backend sends a request such as:

   ```javascript
   POST [Backend Register API Link]
   {
     "name": "Client Name",
     "email": "client@example.com",
     "password": "generated-password"
   }
   ```

3. The external software is expected to create the user account.
4. The client then uses the provided credentials to log into that external software.

---

## Troubleshooting

### 401 Unauthorized

- JWT token may be missing or expired (tokens typically have a limited lifetime).
- **Fix**: Log out in the frontend and log in again to obtain a new token.

### Email Not Sending

- Verify SMTP credentials in `backend/.env`.
- Ensure you are using a **Gmail App Password** (not your main password).
- Confirm that **2FA** is enabled on your Gmail account.

### Cannot Connect to MongoDB

- Ensure MongoDB service is running.
- Check `MONGODB_URI` in `backend/.env`.
- Example for local:

  ```text
  mongodb://localhost:27017/master-admin
  ```

### CORS Errors

- Backend already enables CORS for common dev origins (e.g., `http://localhost:5173`).
- Make sure the backend is running on the expected port.
- Confirm the frontend is calling the correct `VITE_API_BASE_URL`.

---

## Security Notes

- JWT tokens have limited lifetimes to reduce risk from stolen tokens.
- Passwords are hashed using **bcrypt** before being stored.
- Sensitive routes are protected and require a valid JWT.
- Email and database credentials should always be stored in `.env` files and **never committed to version control**.

---

## License

MIT

---
