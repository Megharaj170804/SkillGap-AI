# Skill Gap Platform

A full-stack Personalized Learning & Skill-Gap Analysis Platform with role-based access control.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Frontend**: React.js (Vite), TypeScript, Tailwind CSS, Recharts, React Router v6

## Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017 (or update `MONGODB_URI` in `.env`)

### Backend
```bash
cd backend
npm install
# (Optional) copy .env.example and fill values — defaults are already set in .env
node data/seedData.js   # Seed the database
npm run dev              # Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # Runs on http://localhost:5173
```

---

## Test Credentials

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@skillgap.com     | admin123    |
| Manager  | manager@skillgap.com   | manager123  |
| Employee | rahul@skillgap.com     | emp123      |
| Employee | priya@skillgap.com     | emp123      |
| Employee | amit@skillgap.com      | emp123      |

---

## Features

### Role-Based Access
- **Admin**: Full access — manage all employees, roles, skills matrix
- **Manager**: View team dashboard, view/edit department employees  
- **Employee**: View own profile, gap analysis, and learning path

### Core Features
- JWT authentication (httpOnly cookie + Authorization header)
- Skill gap analysis comparing employee skills to target role requirements
- Personalized learning path with curated course recommendations
- Team dashboard with Recharts bar chart and readiness scores
- Dynamic employee creation with skill proficiency sliders
- Department filtering on the dashboard
- Responsive dark-mode UI

### API Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Public |
| GET | /api/auth/me | Authenticated |
| GET | /api/employees | Admin, Manager |
| POST | /api/employees | Admin |
| GET | /api/employees/:id | Admin, Manager, Employee (own) |
| PUT | /api/employees/:id | Admin, Manager |
| DELETE | /api/employees/:id | Admin |
| GET | /api/roles | Authenticated |
| POST | /api/roles | Admin |
| GET | /api/analysis/employee/:id | Authenticated (employee: own only) |
| GET | /api/analysis/team/:department | Admin, Manager |
