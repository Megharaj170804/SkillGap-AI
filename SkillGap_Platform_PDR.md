# Product Design Requirements (PDR)
**Project:** SkillGap Platform - AI-Powered Skill Gap Analysis & Personalized Learning
**Prepared By:** Megharaj Dandgavhal

---

## 1. Executive Summary
The SkillGap Platform is an AI-powered web application that enables organizations to systematically identify, measure, and address skill gaps across their workforce. The system supports three user personas — Admin, Manager, and Employee — each with dedicated dashboards providing role-appropriate features.

Google Gemini AI powers the core intelligence of the platform, generating personalized learning paths, career advice, team insights, and project skill recommendations. Socket.IO ensures all data is reflected in real time across all connected users, making the platform a live, collaborative tool rather than a static reporting system.

## 2. User Scope & Personas

| User Type | Description |
|-----------|-------------|
| **Admin** | Full platform access. Manages all employees, departments, roles, skills matrix, and platform settings. Views company-wide analytics and exports reports. |
| **Manager** | Views and manages employees in their department. Monitors team skill coverage, sends learning nudges, plans project staffing, and generates AI team insights. |
| **Employee** | Views their own skill profile, gap analysis, and personalized AI learning path. Tracks learning progress, earns achievements, and interacts with the AI career advisor. |

## 3. Functional Requirements

### 3.1 Authentication & Authorization
- Secure user registration and login using bcrypt password hashing.
- JWT token-based session management with 7-day expiration.
- Role-based access control enforced on both frontend routes and backend API endpoints.
- Automatic session restoration on page refresh using stored JWT token.
- Logout redirects to the landing page, never to the login page.

### 3.2 Skill Gap Analysis Engine
- Compare employee skills against target role requirements from the Skills Matrix.
- Categorize each skill as: Strong (meets/exceeds requirement), Weak (below requirement), or Missing (not present).
- Calculate readiness score as percentage: `(strong skills / total required) x 100`.
- Automatically recalculate score on every skill add, update, or remove.
- Store gap analysis results in MongoDB for historical comparison.

### 3.3 AI-Powered Learning Paths
- Generate 12-week personalized roadmaps using Google Gemini 1.5 Flash.
- Include real YouTube video links from channels: Traversy Media, Fireship, TechWorld with Nana, freeCodeCamp.
- Provide daily study plans (Monday to Friday) with estimated hours per task.
- Include practice projects with GitHub search links for each week.
- Cache generated paths in MongoDB to minimize API calls and quota usage.
- Allow employees to mark resources complete, skip weeks, and log study sessions.

### 3.4 Real-Time Features
- Socket.IO connections established on login and maintained throughout session.
- Live activity feed on Manager dashboard updates without page refresh.
- Admin KPI cards update in real time when employees are added or skills change.
- Achievement unlock triggers confetti animation and toast notification instantly.
- Manager receives instant alert when any team member's score drops below 40%.

## 4. Non-Functional Requirements

| Parameter | Target | Implementation |
|-----------|--------|----------------|
| **Performance** | API response < 500ms | MongoDB indexing, `lean()` queries, response caching |
| **AI Response** | < 20 seconds for generation | Gemini 1.5 Flash model, async processing |
| **Availability** | 24/7 uptime | Stateless backend, MongoDB Atlas cloud DB |
| **Security** | All routes authenticated | JWT middleware, bcrypt, HTTPS, CORS config |
| **Scalability** | 100+ concurrent users | Socket.IO rooms, MongoDB connection pooling |
| **AI Quota** | 1500 requests/day free tier | Gemini 1.5 Flash, 24h caching, rate limiting |

## 5. Technology Stack Requirements

### 5.1 Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Data Visualization:** Recharts
- **Real-Time:** Socket.IO Client
- **State/API:** Axios

### 5.2 Backend
- **Environment:** Node.js (18.x LTS)
- **Framework:** Express.js 4.x
- **Database ORM:** Mongoose 7.x
- **Real-Time:** Socket.IO 4.x
- **Authentication:** JWT & bcryptjs
- **AI SDK:** @google/generative-ai (Gemini 1.5 Flash)

### 5.3 Infrastructure
- **Database:** MongoDB (Atlas / NoSQL Document DB)
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render / Railway

## 6. Dashboard Requirements

### 6.1 Admin Dashboard
Requires 8 core pages: Overview, Employee Management, Department Management, Skills Matrix Builder, Platform Analytics, AI Control Center, Reports & Export, and Platform Settings. Needs capability to bulk generate AI paths and view real-time company readiness.

### 6.2 Manager Dashboard
Focused on team health. Must include: Team Skill Coverage (interactive heatmap), AI Team Insights (strengths/gaps generated by Gemini), Project Skill Planner, Team Progress Tracker, and real-time alerts.

### 6.3 Employee Dashboard
Gamified mobile-first design. Must include: Readiness Score (donut chart), My Skills assessment, 12-week AI Learning Paths, Career Advisor, Achievements (11 badges + confetti), and Project Mapper.

## 7. Limitations & Future Roadmap
- **Limitations:** Requires internet for Gemini/Socket.IO, English-only initially, self-reported skills introduce subjectivity, free API quota limits.
- **Phase 2 (Q3 2026):** Multi-language support, sentiment analysis on study notes, mentor matching.
- **Phase 3 (Q4 2026):** HR System integrations (SAP, Workday), Enterprise SSO (SAML 2.0).
- **Phase 4 (Q1 2027):** Native Mobile Apps (iOS/Android), voice-based skill assessment.
