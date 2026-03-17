<div align="center">
  <h1>🚀 Skill Gap Platform</h1>
  <p><strong>An AI-Powered Personalized Learning & Skill-Gap Analysis Platform</strong></p>
</div>

---

<br />

## 📖 Overview

The **Skill Gap Platform** is a full-stack, state-of-the-art web application designed to help organizations manage employee skills, track learning progress, and identify skill gaps against target roles. 

Powered by **Google Generative AI (Gemini)**, the platform provides tailored career advice and dynamically generated learning paths. With **Role-Based Access Control (RBAC)** and a real-time reactive UI, it delivers a seamless and highly engaging experience for Admins, Managers, and Employees.

<br />

## ✨ Key Features

- 🔐 **Role-Based Access Control (RBAC)**: Distinct dashboards and permissions for Admins, Managers, and Employees.
- 🧠 **AI-Powered Insights**: Integrates Google Gemini AI to generate personalized learning paths and career advice.
- 📊 **Interactive Analytics**: Real-time team insights and skill readiness scores visualized using Recharts.
- ⚡ **Real-Time Notifications**: Instant updates via WebSockets (Socket.io) for task assignments and system alerts.
- 🎨 **Premium UI/UX**: Responsive, dark-themed, glassmorphic design enriched with smooth Framer Motion animations.
- 📄 **Data Exporting**: Export analytics and reports effortlessly in PDF and CSV formats.
- 🛡️ **Secure Authentication**: Robust JWT-based authentication stored securely in HTTP-only cookies.

<br />

## 🛠️ Tech Stack Ecosystem

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 (Dark mode, Glassmorphism)
- **Routing**: React Router DOM v7
- **Animations & Charts**: Framer Motion, Recharts
- **Networking**: Axios, Socket.io-client

### Backend
- **Runtime**: Node.js + Express.js v5
- **Database**: MongoDB + Mongoose v9
- **Authentication**: Custom JWT with bcryptjs
- **Real-time**: Socket.io
- **AI Integration**: `@google/generative-ai` (Gemini 0.24.1)
- **Utilities**: `pdfkit`, `json2csv`

<br />

## 🚀 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Running locally or a MongoDB Atlas URI)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Database & Backend Setup

Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder and configure your environment variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skillgap
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```

Seed the database with initial data (Users, Roles, Employees):
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
# The server will run on http://localhost:5000
```

### 2. Frontend Setup

Open a new terminal, navigate to the `frontend` directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:
```bash
npm run dev
# The app will run on http://localhost:5173
```

<br />

## 🔑 Test Credentials (Post-Seeding)

Use the following credentials to log in and test different role perspectives:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@skillgap.com` | `admin123` |
| **Manager** | `manager@skillgap.com` | `manager123` |
| **Employee** | `rahul@skillgap.com` | `emp123` |
| **Employee** | `priya@skillgap.com` | `emp123` |
| **Employee** | `amit@skillgap.com` | `emp123` |

<br />

## 📂 Project Structure

```text
skill-gap-platform/
├── backend/                # Node.js/Express Backend Server
│   ├── config/             # DB & server configurations
│   ├── controllers/        # Request handlers
│   ├── data/               # Seeding scripts & dummy data
│   ├── middleware/         # Auth & RBAC middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   └── services/           # External services (Gemini AI, PDF generation)
├── frontend/               # React/Vite Frontend App
│   ├── public/             # Static assets
│   └── src/                # React source code (components, pages, contexts)
└── README.md               # Main project documentation
```

<br />

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is licensed under the ISC License.
