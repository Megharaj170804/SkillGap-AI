import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeDetail from './pages/EmployeeDetail';
import LearningPath from './pages/LearningPath';
import AddEmployee from './pages/AddEmployee';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';

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

          {/* Protected routes */}
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

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
