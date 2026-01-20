import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import PartnerDashboard from './components/PartnerDashboard';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminDashboardV20 from './components/AdminDashboardV20';
import CompanyDashboard from './components/CompanyDashboard';
import HomeWahoo from './components/HomeWahoo';
import MapPage from './components/MapPage';

const Protected = ({ role }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return <Outlet />;
};

const StripeHandler = () => {
    return <MemberDashboard />;
};

const PublicRoute = () => {
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes V20 */}
        <Route path="/home" element={<HomeWahoo />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<Protected role="partner" />}><Route path="/partner" element={<PartnerDashboard />} /></Route>
        <Route element={<Protected role="member" />}><Route path="/dashboard" element={<StripeHandler />} /></Route>
        <Route element={<Protected role="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/v20" element={<AdminDashboardV20 />} />
        </Route>
        <Route element={<Protected role="company_admin" />}><Route path="/company" element={<CompanyDashboard />} /></Route>
        
        {/* Default Route */}
        <Route path="/" element={<HomeWahoo />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  );
}
