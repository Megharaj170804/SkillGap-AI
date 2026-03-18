import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import AIChatBot from './components/AIChatBot';

// Layouts
import AdminLayout from './components/layouts/AdminLayout';
import ManagerLayout from './components/layouts/ManagerLayout';
import EmployeeLayout from './components/layouts/EmployeeLayout';

// Existing Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeDetail from './pages/EmployeeDetail';
import LearningPath from './pages/LearningPath';
import AddEmployee from './pages/AddEmployee';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
// New AI Routes (Existing)
import AILearningPath from './pages/AILearningPath';
import CareerAdvice from './pages/CareerAdvice';
import TeamInsights from './pages/TeamInsights';
import ProjectSkillMapper from './pages/ProjectSkillMapper';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';

// Lazy loading the massive new persona bundles to maintain perf
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminDepartments = lazy(() => import('./pages/admin/AdminDepartments'));
const AdminSkillsMatrix = lazy(() => import('./pages/admin/AdminSkillsMatrix'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminAICenter = lazy(() => import('./pages/admin/AdminAICenter'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

const ManagerOverview = lazy(() => import('./pages/manager/ManagerOverview'));
const ManagerSkillCoverage = lazy(() => import('./pages/manager/ManagerSkillCoverage'));
const ManagerAIInsights = lazy(() => import('./pages/manager/ManagerAIInsights'));
const ManagerProjectPlanner = lazy(() => import('./pages/manager/ManagerProjectPlanner'));
const ManagerProgressTracker = lazy(() => import('./pages/manager/ManagerProgressTracker'));
const ManagerAlerts = lazy(() => import('./pages/manager/ManagerAlerts'));
const ManagerReports = lazy(() => import('./pages/manager/ManagerReports'));

const EmployeeOverview = lazy(() => import('./pages/employee/EmployeeOverview'));
const EmployeeSkills = lazy(() => import('./pages/employee/EmployeeSkills'));
const EmployeeLearning = lazy(() => import('./pages/employee/EmployeeLearning'));
const EmployeeCareer = lazy(() => import('./pages/employee/EmployeeCareer'));
const EmployeeAchievements = lazy(() => import('./pages/employee/EmployeeAchievements'));
const EmployeeSettings = lazy(() => import('./pages/employee/EmployeeSettings'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminOverview /> </Suspense>} />
            <Route path="employees" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminEmployees /> </Suspense>} />
            <Route path="departments" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminDepartments /> </Suspense>} />
            <Route path="skills-matrix" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminSkillsMatrix /> </Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminAnalytics /> </Suspense>} />
            <Route path="ai-center" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminAICenter /> </Suspense>} />
            <Route path="reports" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminReports /> </Suspense>} />
            <Route path="settings" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <AdminSettings /> </Suspense>} />
          </Route>

          {/* Manager Routes */}
          <Route path="/manager" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['manager']}>
                <ManagerLayout />
              </RoleGuard>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <ManagerOverview /> </Suspense>} />
            <Route path="skill-coverage" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <ManagerSkillCoverage /> </Suspense>} />
            <Route path="ai-insights" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <ManagerAIInsights /> </Suspense>} />
            <Route path="project-planner" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <ManagerProjectPlanner /> </Suspense>} />
            <Route path="progress-tracker" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <ManagerProgressTracker /> </Suspense>} />
            <Route path="alerts" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <ManagerAlerts /> </Suspense>} />
            <Route path="reports" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <ManagerReports /> </Suspense>} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['employee']}>
                <EmployeeLayout />
              </RoleGuard>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <EmployeeOverview /> </Suspense>} />
            <Route path="skills" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <EmployeeSkills /> </Suspense>} />
            <Route path="learning" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <EmployeeLearning /> </Suspense>} />
            <Route path="career" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <EmployeeCareer /> </Suspense>} />
            <Route path="achievements" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <EmployeeAchievements /> </Suspense>} />
            <Route path="settings" element={<Suspense fallback={<div className="spinner" style={{margin:'4rem auto'}} />}> <EmployeeSettings /> </Suspense>} />
          </Route>

          {/* Legacy / Shared Routes - wrapped with standard Navbar */}
          <Route path="/*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/dashboard" element={ <ProtectedRoute><Dashboard /></ProtectedRoute> } />
                <Route path="/profile" element={ <ProtectedRoute><Profile /></ProtectedRoute> } />
                
                {/* Legacy features */}
                <Route path="/employees" element={<ProtectedRoute><RoleGuard allowedRoles={['admin', 'manager']}><EmployeeList /></RoleGuard></ProtectedRoute>} />
                <Route path="/employees/add" element={<ProtectedRoute><RoleGuard allowedRoles={['admin']}><AddEmployee /></RoleGuard></ProtectedRoute>} />
                <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
                <Route path="/employees/:id/learning" element={<ProtectedRoute><LearningPath /></ProtectedRoute>} />
                <Route path="/ai/learning-path/:id" element={<ProtectedRoute><AILearningPath /></ProtectedRoute>} />
                <Route path="/ai/career-advice/:id" element={<ProtectedRoute><CareerAdvice /></ProtectedRoute>} />
                <Route path="/ai/team-insights" element={<ProtectedRoute><RoleGuard allowedRoles={['admin', 'manager']}><TeamInsights /></RoleGuard></ProtectedRoute>} />
                <Route path="/project-mapper" element={<ProtectedRoute><ProjectSkillMapper /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><RoleGuard allowedRoles={['admin']}><Analytics /></RoleGuard></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </>
          } />
        </Routes>

        {/* Global components */}
        <AIChatBot />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15,15,26,0.97)',
              color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.3)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
