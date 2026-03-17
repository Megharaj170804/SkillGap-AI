# 🎨 Frontend - Skill Gap Platform

Welcome to the **Frontend** directory of the Skill Gap Platform! This part of the application is responsible for delivering a stunning, highly interactive, and responsive user experience. 

Built with modern web technologies, it features a glassmorphic dark theme, deeply integrated Role-Based Access Control (RBAC), and real-time updates via WebSockets.

---

## 🛠️ Tech Stack

- **Core Framework**: React 19 + TypeScript
- **Build Tool**: Vite (Lightning fast HMR!)
- **Routing**: React Router DOM v7 (Supporting protected/guarded routes)
- **Styling**: Tailwind CSS v4 (Utility-first, responsive, and dark-theme optimized)
- **Animations**: Framer Motion (Smooth page transitions & micro-components animations)
- **Data Visualization**: Recharts (Interactive radar, line, and bar charts for analytics)
- **Networking**: 
  - Axios (RESTful API calls)
  - Socket.io-client (Real-time events & notifications)
- **Notifications**: React Hot Toast

---

## 📂 Folder Structure

```text
frontend/
├── public/                 # Static public assets (Favicons, etc.)
├── src/                    
│   ├── assets/             # Images, SVGs, global CSS styles
│   ├── components/         # Reusable UI components (Buttons, Modals, Cards)
│   ├── context/            # React Contexts (AuthContext, SocketContext)
│   ├── hooks/              # Custom React Hooks
│   ├── pages/              # Main view components mapping to routes
│   │   ├── admin/          # Admin-specific views (User Management, Global Analytics)
│   │   ├── manager/        # Manager-specific views (Team Insights)
│   │   ├── employee/       # Employee-specific views (Learning Path, Gap Analysis)
│   │   └── shared/         # Shared views (Login, Profile, Notifications)
│   ├── services/           # Axios service instances and API call wrappers
│   ├── types/              # TypeScript interface & type definitions
│   ├── App.tsx             # Main Application Component (Routing config)
│   └── main.tsx            # React DOM injection point
├── .env                    # Environment variables (Not committed)
├── vite.config.ts          # Vite bundler configuration
└── package.json            # Frontend dependencies & scripts
```

---

## 🚀 Available Scripts

In the frontend directory, you can run:

### `npm run dev`
Starts the Vite development server. Open [http://localhost:5173](http://localhost:5173) to view it in your browser. The page will instantly reload when you make edits.

### `npm run build`
Builds the app for production into the `dist` folder. It performs TypeScript compilation and Vite bundling for maximum performance and minimal payload size.

### `npm run lint`
Runs ESLint across the codebase to catch errors and enforce code style rules.

### `npm run preview`
Locally preview the production build (from the `dist` folder) before deploying.

---

## 🔐 Environment Variables

To properly run the frontend, you need an `.env` file at the root of `frontend/`.

```env
# The base URL of the backend API
VITE_API_URL=http://localhost:5000/api
```

---

## 🎨 Design System & Aesthetics

- **Theme**: Dark mode by default for reduced eye strain and a modern, premium feel.
- **Glassmorphism**: Generous use of translucent, frosted-glass effects (e.g., `backdrop-blur`) on cards, panels, and sidebars.
- **Interactions**: Buttons, list items, and dynamic charts all feature hover states and Framer Motion spring animations to feel highly responsive. 

---

## 🛡️ Routing & Security

The platform utilizes a customized declarative routing system inside `App.tsx`:
- **`ProtectedRoute`**: Ensures the user has a valid JWT session before accessing internal views.
- **`RoleGuard`**: Ensures the user's role (`admin`, `manager`, `employee`) matches the required authorization level for specific pages. Unauthorized accesses are cleanly redirected.
