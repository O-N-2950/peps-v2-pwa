import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import PartnerDashboard from './components/PartnerDashboard';
import PartnerDashboardV21 from './components/PartnerDashboardV21';
import MemberDashboard from './components/MemberDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import HomeWahoo from './components/HomeWahoo';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import MapPage from './components/MapPage';
import PartnerDetailPage from './pages/PartnerDetailPage';
import PartnerRegistrationPage from './pages/PartnerRegistrationPage';
import PartnerBookingDashboard from './pages/PartnerBookingDashboard';
import MemberBookingPage from './pages/MemberBookingPage';
import AvantagesPage from './pages/AvantagesPage';

// Admin Components V20
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import PartnerManagement from './pages/PartnerManagement';
import OfferManagement from './pages/OfferManagement';

const ProtectedRoute = ({ role, children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  // (Ajoutez ici la vérification du rôle si nécessaire)
  return children ? children : <Outlet />;
};

const StripeHandler = () => {
    return <MemberDashboard />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/home" element={<HomeWahoo />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/partner/:id" element={<PartnerDetailPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/avantages" element={<AvantagesPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/partner" element={<PartnerRegistrationPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute role="partner" />}>
         <Route path="/partner-dashboard" element={<PartnerDashboard />} />
          <Route path="/dashboard-v21" element={<PartnerDashboardV21 />} />  <Route path="/partner/bookings" element={<PartnerBookingDashboard partnerId={1} />} />
        </Route>
        
        <Route element={<ProtectedRoute role="member" />}>
          <Route path="/dashboard" element={<StripeHandler />} />
          <Route path="/book/:partnerId" element={<MemberBookingPage memberId={1} />} />
        </Route>
        
        {/* Routes Admin V20 */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="partners" element={<PartnerManagement />} />
            <Route path="offers" element={<OfferManagement />} />
        </Route>
        
        <Route element={<ProtectedRoute role="company_admin" />}>
          <Route path="/company" element={<CompanyDashboard />} />
        </Route>
        
        {/* Default Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
