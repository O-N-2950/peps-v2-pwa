import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import MemberHome from './components/MemberHome';
import MemberDashboard from './components/MemberDashboard';
import PartnerDashboard from './components/PartnerDashboard';
import PartnerBookings from './components/PartnerBookings';
import AdminDashboard from './components/AdminDashboard';
import MapView from './components/MapView';

const ProtectedRoute = ({ allowedRoles }) => {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative overflow-hidden">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/map" element={<MapView />} />
          
          <Route element={<ProtectedRoute allowedRoles={['member']} />}>
            <Route path="/offers" element={<MemberHome />} />
            <Route path="/member-profile" element={<MemberDashboard />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
            <Route path="/partner" element={<PartnerDashboard />} />
            <Route path="/partner/bookings" element={<PartnerBookings />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/bookings" element={<AdminDashboard />} />
          </Route>
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}
