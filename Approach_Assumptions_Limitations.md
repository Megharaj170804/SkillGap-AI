# Skill Gap Platform - Approach, Assumptions, and Limitations

This document outlines the high-level technical approach, key assumptions, and known limitations of the Skill Gap Platform.

## 1. Approach

The Skill Gap Platform is engineered as a modern, real-time, responsive web application. Our core technical approach prioritizes performance, security, and integration of cutting-edge AI.

### 1.1 Technology Stack & Architecture
- **MERN-Vite Stack:** We chose MongoDB, Express, React (via Vite for faster builds), and Node.js. This Javascript ecosystem allows for rapid, full-stack development and seamless data parsing.
- **Role-Based Access Control (RBAC):** We implemented a strict RBAC policy handling three static roles: Admin, Manager, and Employee. Security is enforced doubly on both frontend (`RoleGuard` component) and backend (JWT verification middleware).
- **Real-Time Responsiveness:** Instead of traditional HTTP polling, we incorporated **Socket.io**. This creates a persistent two-way connection, pushing analytics shifts, notifications, and AI generation completions directly to active clients without manual refreshes.

### 1.2 AI Integration Strategy
- **Generative AI (Google Gemini 1.5 Flash):** AI handles complex reasoning such as analyzing skill gaps and planning 12-week roadmaps. 
- **Caching Mechanism:** To optimize speed and minimize Google API calls, AI-generated responses (like learning paths) are securely stored in MongoDB and served instantly upon subsequent requests.

---

## 2. Assumptions

The architecture and design of the platform were built upon the following business and technical assumptions:

1. **Internet Connectivity:** Users, especially at the enterprise level, will have a reliable internet connection. This is necessary to maintain the real-time WebSocket connection and fetch AI intelligence.
2. **Standardized Organizations:** Organizations using the platform follow a relatively standard hierarchical structure (Employees reporting to specific Managers, overseen by Admins).
3. **Structured Skill Definitions:** Target roles have well-defined expected skills in the "Skills Matrix". If job requirements are too ambiguous, the AI gap analysis will be less effective.
4. **Browser Requirements:** Users are accessing the platform on modern browsers capable of handling advanced CSS features (like glassmorphism) and rendering WebSockets efficiently.

---

## 3. Limitations

While robust, the current initial build of the platform has a few known constraints:

1. **Subjective Data Inputs:** The platform relies heavily on self-reported skill proficiency levels from employees (1 to 5 scale). This inherently introduces subjectivity that could mildly skew readiness scoring compared to a formal evaluation test.
2. **Third-Party API Limits (Gemini):** Since the platform integrates a free-tier version of the Google Gemini API (1500 requests/day), heavy concurrent usage by a massive organization could lead to rate limiting unless upgraded to a paid enterprise tier.
3. **Language & Localization:** The Gemini prompts and the UI are currently configured exclusively for the English language, preventing adoption by non-English speaking global branches without further localization.
4. **Mobile Experience:** While visually responsive and accessible on mobile browsers, the platform does not currently have a dedicated native mobile app (iOS/Android), limiting push notification capabilities when the browser is closed.
