import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Pages
import DashboardPage from '../pages/DashboardPage';
import NewKitPage from '../pages/NewKitPage';
import KitDetailPage from '../pages/KitDetailPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new"
        element={
          <ProtectedRoute>
            <NewKitPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kit/:id"
        element={
          <ProtectedRoute>
            <KitDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

