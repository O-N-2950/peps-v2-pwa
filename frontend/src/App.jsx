
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import PartnerDashboard from './components/PartnerDashboard';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import MapView from './components/MapView';

const Protected = ({ role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" />;
  if (role && userRole !== role && userRole !== 'admin') return <Navigate to="/" />;
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected role="partner" />}><Route path="/partner" element={<PartnerDashboard />} /></Route>
        <Route element={<Protected role="admin" />}><Route path="/admin" element={<AdminDashboard />} /></Route>
        <Route element={<Protected role="company_admin" />}><Route path="/company" element={<CompanyDashboard />} /></Route>
        <Route element={<Protected role="member" />}>
          <Route path="/" element={<MemberDashboard />} />
          <Route path="/map" element={<MapView />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}