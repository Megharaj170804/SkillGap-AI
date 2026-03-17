import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import AIChatBot from './components/AIChatBot';

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

// New Pages
import AILearningPath from './pages/AILearningPath';
import CareerAdvice from './pages/CareerAdvice';
import TeamInsights from './pages/TeamInsights';
import ProjectSkillMapper from './pages/ProjectSkillMapper';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes — existing */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/employees" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin', 'manager']}>
                <EmployeeList />
              </RoleGuard>
            </ProtectedRoute>
          } />

          <Route path="/employees/add" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AddEmployee />
              </RoleGuard>
            </ProtectedRoute>
          } />

          <Route path="/employees/:id" element={
            <ProtectedRoute><EmployeeDetail /></ProtectedRoute>
          } />

          <Route path="/employees/:id/learning" element={
            <ProtectedRoute><LearningPath /></ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          {/* New AI routes */}
          <Route path="/ai/learning-path/:id" element={
            <ProtectedRoute><AILearningPath /></ProtectedRoute>
          } />

          <Route path="/ai/career-advice/:id" element={
            <ProtectedRoute><CareerAdvice /></ProtectedRoute>
          } />

          <Route path="/ai/team-insights" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin', 'manager']}>
                <TeamInsights />
              </RoleGuard>
            </ProtectedRoute>
          } />

          <Route path="/project-mapper" element={
            <ProtectedRoute><ProjectSkillMapper /></ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <Analytics />
              </RoleGuard>
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
