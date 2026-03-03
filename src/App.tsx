import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './client/auth/login';
import Signup from './client/auth/signup';
import CrashDashboard from './client/dashboard/CrashDashboard';
import AdminDashboard from './admin-panel/dashboard';
import DevModeToggle from './dev-tools/devModeToggle';
import { AuthProvider, useAuth } from './client/auth/sessionManager';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireAdmin && !user.isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Dashboard Route - Protected */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <CrashDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Route - Protected & Admin Only */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          
          {/* Dev Tools Overlay */}
          <DevModeToggle />
        </div>
      </Router>
    </AuthProvider>
  );
}
