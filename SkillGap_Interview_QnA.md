# Skill Gap Platform - Interview Preparation Document

This document contains "How", "Why", and "Where" questions and answers related to the Skill Gap Platform, written in simple, easy-to-understand language.

## 1. Core Platform Purpose & Logic

**Q: Why was the Skill Gap Platform built?**
**A:** It was built to help companies figure out what skills their employees have, identify what skills are missing (the "gap") for their current or future roles, and provide personalized learning paths to fill those gaps. 

**Q: How does the platform calculate an employee's "Skill Readiness Score"?**
**A:** The system looks at the skills required for an employee's target role and compares them to the skills the employee actually has. It categorizes each skill as 'Strong', 'Weak', or 'Missing'. The score is a simple percentage: `(Strong Skills / Total Required Skills) x 100`.

**Q: Where can different users (Admin, Manager, Employee) access their features?**
**A:** 
- **Admins** have a dashboard to see company-wide analytics, manage all employees, and set platform rules.
- **Managers** have a dashboard focused on their specific department or team to see team skill coverage and send learning nudges.
- **Employees** have a personal dashboard where they can see their own skill gaps, learning paths, and career advice.

## 2. Artificial Intelligence (AI) Features

**Q: Why do we use Google Gemini AI in this platform?**
**A:** We use Gemini AI to make the platform intelligent and personal. Instead of generic advice, Gemini looks at an employee's specific skill gap and generates tailored career advice and custom 12-week learning roadmaps.

**Q: How does the AI generate a learning path?**
**A:** The backend sends the employee's current skills and their target role to Gemini AI. The AI analyzes the gap and returns a structured 12-week plan, complete with daily tasks, YouTube video links (like Traversy Media or freeCodeCamp), and practice projects.

**Q: Where are the AI-generated learning paths stored, and why?**
**A:** Once generated, the learning paths are saved (cached) in the MongoDB database. We do this for two reasons: 
1. **Speed:** It loads instantly for the user the next time they log in. 
2. **Cost/Limits:** It prevents us from calling the Gemini API too many times, which saves our API quota.

## 3. Technology Stack & Architecture

**Q: How do we show real-time updates (like notifications or score changes) without the user refreshing the page?**
**A:** We use **Socket.io** (WebSockets). Instead of the frontend constantly asking the server "Is there anything new?", Socket.io keeps an open connection. When an event happens (like a manager assigning a course or an achievement unlocking), the server instantly pushes the update to the specific user's screen.

**Q: Why do we use JWT (JSON Web Tokens) and HTTP-only cookies for login?**
**A:** It is a highly secure way to handle user logins. JWT proves who the user is without saving session data on the server. Storing the JWT in an "HTTP-only cookie" prevents malicious scripts in the browser from stealing the token, protecting users from hackers.

**Q: Where is all the application data saved?**
**A:** All data, including user profiles, company roles, skills matrices, and cached AI results, is stored in a **MongoDB** database (specifically, MongoDB Atlas in the cloud). It is a NoSQL database, which is highly flexible for storing things like dynamic arrays of skills.

## 4. Frontend & User Experience

**Q: How does the platform make sure an Employee cannot access Admin pages?**
**A:** This is called Role-Based Access Control (RBAC). In the React frontend, we use a component wrapper called `<RoleGuard>`. If a user tries to visit a URL they aren't allowed to see, the guard checks their role and redirects them back to their own dashboard. The backend also double-checks their role before sending any sensitive data.

**Q: Why did we choose Vite and React for the frontend?**
**A:** React is great for building interactive, component-based UIs (like dashboards and charts). Vite is a build tool that makes React incredibly fast during development, meaning the code updates almost instantly when developers make changes, leading to faster feature delivery.

**Q: Where do the analytics charts come from?**
**A:** We use a library called **Recharts**. It reads the skill data and turns it into visual graphs, like the readiness donut chart for employees or the team progress bar charts for managers, making complex data easy to understand at a glance.
