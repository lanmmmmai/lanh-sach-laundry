import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import StaffManagement from './pages/StaffManagement';
import Branches from './pages/Branches';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Timesheet from './pages/Timesheet';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="create-order" element={<CreateOrder />} />
        <Route path="services" element={<ProtectedRoute requireAdmin={true}><Services /></ProtectedRoute>} />
        <Route path="staff" element={<ProtectedRoute requireAdmin={true}><StaffManagement /></ProtectedRoute>} />
        <Route path="branches" element={<ProtectedRoute requireAdmin={true}><Branches /></ProtectedRoute>} />
        <Route path="timesheet" element={<Timesheet />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
