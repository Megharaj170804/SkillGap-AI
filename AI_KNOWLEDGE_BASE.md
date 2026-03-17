# Skill Gap Platform - AI Knowledge Base

This document is designed to provide AI agents with a comprehensive understanding of the **Skill Gap Platform** architecture, technical stack, database models, and core business flows.

## 1. Project Overview
The Skill Gap Platform is a full-stack, role-based application designed to manage employee skills, track learning progress, identify skill gaps against target roles, and provide AI-driven career and learning recommendations. It supports real-time notifications and analytics dashboards.

## 2. Tech Stack Ecosystem
### Backend (Node.js & Express)
- **Framework**: Express.js (v5.2.1)
- **Database**: MongoDB with Mongoose (v9.3.0)
- **Authentication**: JWT stored in HTTP-only cookies, combined with bcryptjs for password hashing.
- **Real-time Interaction**: Socket.io (v4.8.3) for live notifications and instant updates.
- **AI Integration**: Google Generative AI (Gemini `0.24.1`) for generating personalized learning paths and career advice.
- **Utilities**: `json2csv` and `pdfkit` for exporting data.

### Frontend (React & Vite)
- **Framework**: React 19 driven by Vite.
- **Routing**: React Router v7 (`react-router-dom`) handling public and protected routes, wrapped with a custom `RoleGuard` component for RBAC (Role-Based Access Control).
- **Styling UI**: Tailwind CSS v4, utilizing a modern, dark-themed aesthetic with glassmorphism.
- **Animations**: Framer Motion for smooth component transitions.
- **Data Visualization**: Recharts for rendering team skill readiness analytics and bar charts.
- **Networking/Real-time**: Axios for REST calls and `socket.io-client` for handling live events.

## 3. Core Database Models

### User (`backend/models/User.js`)
- Handles system access and authentication.
- **Fields**: `name`, `email`, `password` (hashed), `role` (`'admin'`, `'manager'`, `'employee'`), `department`, and `employeeRef` (ObjectId link to the Employee profile).

### Employee (`backend/models/Employee.js`)
- Central entity for operational logic and gap analysis.
- **Fields**:
  - Profile Info: `name`, `email`, `currentRole`, `department`, `managerId`.
  - Skills Matrix: Array of `skills` (objects with `skillName`, `proficiencyLevel` (1-5), `yearsOfExperience`).
  - `projectHistory`: Array tracking past projects and tech used.
  - `targetRole`: The role the employee is aspiring to or being measured against.
  - AI Fields: `aiLearningPath` (Array), `aiCareerAdvice` (Object), `lastAnalysisAt`.
  - Progress tracking: `overallProgress`.

*(Other likely models based on routing include `Role`, `Notification`, and `LearningProgress`)*

## 4. Application Architecture & Data Flow

### 4.1. Role-Based Access Control (RBAC)
The application strictly enforces what users can see and do based on 3 distinct roles:
1. **Admin**: Full visibility. Can add employees, create roles, view company-wide analytics (`Analytics.tsx`), export data.
2. **Manager**: Department-level visibility. Can view `TeamInsights.tsx`, team dashboards, and department employees.
3. **Employee**: Self-service visibility. Only allowed to view their own `Profile.tsx`, `EmployeeDashboard.tsx`, personal `CareerAdvice.tsx`, and `AILearningPath.tsx`.
- Overriding navigation logic exists in `Dashboard.tsx` (Admins/Managers see team stats via Recharts, while Employees are physically redirected to render `<EmployeeDashboard />`).

### 4.2. API Routes Structure
- `/api/auth`: Login, register, logout, `me` (initial hydrate).
- `/api/employees`: CRUD for employee profiles.
- `/api/roles`: CRUD for organizational roles.
- `/api/analysis`: Generates comparative gap scores (e.g., Team Analysis by department).
- `/api/ai`: Hooks into Google Gemini to query dynamically generated advice.
- `/api/notifications`: Stores and retrieves notification history.
- `/api/progress`: Tracks granular learning module completions.
- `/api/export`: Downloads CSV/PDF reports.

### 4.3. Real-Time WebSockets
Socket.IO (`backend/server.js`) creates specific channels:
- `employee_{employeeId}`: For direct, individual notifications (e.g., "Your AI learning path is ready").
- `dept_{department}`: For manager/department level broadcasts.

## 5. Implementation Guidelines for AI Agents
When extending or modifying this project, adhere to the following rules:

1. **Routing & Auth**: Always protect new frontend routes in `src/App.tsx` using `<ProtectedRoute>` and `<RoleGuard>` where applicable. Ensure backend routes are protected using middleware (e.g., `verifyToken`, `authorizeRoles`).
2. **Styling**: Maintain the dark-themed aesthetic. Avoid inline styles where possible; instead, rely on Tailwind CSS classes (`className="form-input"`, `className="glass-card"`, `className="btn-primary"`).
3. **Real-time**: If designing a feature that updates backend state significantly (e.g., Manager assigns a new course), emit a Socket.io event to the target `employeeId` so the frontend can react instantly.
4. **AI Features**: New AI prompts should be directed to Gemini via `services/gemini.service.js` (or similar backend service class). Never expose the Gemini API key on the frontend payload.

## 6. Entry Points
- Frontend Server Starts: `npm run dev` in `/frontend`.
- Backend Server Starts: `npm run dev` (or `npm start`) in `/backend` on port `5000`.
- MongoDB Seed: `node data/seedData.js`.
