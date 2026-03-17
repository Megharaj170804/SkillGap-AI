# ⚙️ Backend - Skill Gap Platform

Welcome to the **Backend** directory of the Skill Gap Platform! This is the engine of the application, managing secure user authentication, complex database relationships, external AI processing, and real-time WebSocket communications.

Built with Node.js and Express, the backend interacts with MongoDB and acts as the secure intermediary between the user interface and Google's Gemini AI.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database Modeler**: Mongoose (v9) linking to MongoDB
- **Authentication**: 
  - JWT (JSON Web Tokens)
  - `bcryptjs` for secure password hashing
  - `cookie-parser` for handling HTTP-only cookie authentication
- **Real-Time Communication**: Socket.io (v4)
- **AI Integration**: `@google/generative-ai` (Gemini SDK)
- **Utilities**:
  - `pdfkit` (For generating PDF reports)
  - `json2csv` (For generating CSV data exports)
  - `express-rate-limit` (For API endpoint protection)

---

## 📂 Folder Structure

```text
backend/
├── config/                 # Configuration files (Database connection logic)
├── controllers/            # Controller logic (Handling requests & responses)
├── data/                   # Initial setup utilities
│   ├── seedData.js         # The script for resetting and populating the DB
│   └── [dummy json files]  # Initial JSON data payload
├── middleware/             # Express middlewares
│   ├── auth.middleware.js  # Validating JWT access & Role Guards (Admin/Manager checks)
│   └── error.middleware.js # Centralized error handling
├── models/                 # Mongoose Schemas (User, Employee, Role, Notification)
├── routes/                 # Express route definitions pointing to controllers
├── services/               # Reusable background logic
│   └── gemini.service.js   # Interfaces directly with Google's API to fetch AI suggestions
├── server.js               # Application entry point (Sets up Express and WebSockets)
├── .env                    # Environment variables (Not committed)
└── package.json            # Scripts & Dependencies
```

---

## 🚀 Available Scripts

Navigate to the `backend/` directory and use the following NPM scripts:

### `npm start`
Runs the node server in standard mode. Good for production.

### `npm run dev`
Runs the server using `nodemon`. The server will automatically restart whenever you save a file. (Default running on `http://localhost:5000`)

### `npm run seed`
Executes the `data/seedData.js` script to clear the current database and insert starter dummy data (Admin, Managers, Employees, default roles). *Note: This will erase all existing localized data.*

---

## 🔐 Environment Variables

Create a `.env` file in the root of the `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skillgap
JWT_SECRET=this_is_a_very_secure_secret_key_123!
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Get this from Google AI Studio
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## 📡 Core API Structure

Endpoints are neatly modularized by entity:

- **`/api/auth`**: Authentication flow (Register, Login, Logout, fetch `me` profile).
- **`/api/employees`**: CRUD operations for managing employee profiles and their skills matrix.
- **`/api/roles`**: Manage organizational roles and expected skill competencies.
- **`/api/analysis`**: Compare an employee's current skills against a target role to find gaps.
- **`/api/ai`**: Generate external learning paths or career advice using Gemini.
- **`/api/notifications`**: Fetch historical system notifications.
- **`/api/export`**: Download analytical reports dynamically in PDF or CSV format.

---

## 🔌 WebSockets (Socket.io) Structure

The server spins up a Socket.io instance listening alongside Express. 
- **Employee Rooms (`employee_{id}`)**: Personal room for a user to receive 1:1 notifications (e.g., AI path generated, New feedback).
- **Department Rooms (`dept_{department_name}`)**: Rooms for managers to subscribe to general updates from their dedicated team section.
