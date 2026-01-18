import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import MemberHome from './components/MemberHome';
import PartnerDashboard from './components/PartnerDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import MapView from './components/MapView';
import Navigation from './components/Navigation';

const ProtectedRoute = ({ allowedRoles }) => {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Outlet />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto pb-16">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<MemberHome />} />
                <Route path="/map" element={<MapView />} />
                
                {/* DASHBOARDS MÉTIER */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
                    <Route path="/partner" element={<PartnerDashboard />} />
                </Route>
                
                <Route element={<ProtectedRoute allowedRoles={['company_admin']} />}>
                    <Route path="/company" element={<CompanyDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['member', 'partner']} />}>
                    <Route path="/member" element={<MemberDashboard />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
        {!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin') && <Navigation />}
      </div>
    </BrowserRouter>
  );
}
