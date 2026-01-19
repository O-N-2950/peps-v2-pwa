import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import PartnerDashboard from './components/PartnerDashboard';
import MemberDashboard from './components/MemberDashboard';

const Protected = ({ role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/" />;
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected role="partner" />}><Route path="/partner" element={<PartnerDashboard />} /></Route>
        <Route element={<Protected role="member" />}><Route path="/" element={<MemberDashboard />} /></Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
