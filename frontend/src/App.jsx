import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import MemberHome from './components/MemberHome';
import PartnerDashboard from './components/PartnerDashboard';
import CompanyDashboard from './components/CompanyDashboard';

const ProtectedRoute = ({ allowedRoles }) => {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role) && role !== 'super_admin') return <Navigate to="/" />;
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative">
        <Routes>
          <Route path="/" element={<MemberHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
            <Route path="/partner" element={<PartnerDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['company_admin']} />}>
            <Route path="/company" element={<CompanyDashboard />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
