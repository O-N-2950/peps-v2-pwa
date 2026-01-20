import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import PartnerDashboard from './components/PartnerDashboard';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import MapView from './components/MapView';

// 🛡️ GARDIEN DES ROUTES CORRIGÉ
const Protected = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // 1. Pas connecté -> Login
  if (!token) return <Navigate to="/login" replace />;

  // 2. Admin -> Accès TOTAL (Passe-droit)
  if (userRole === 'admin') return <Outlet />;

  // 3. Vérification stricte du rôle
  if (allowedRoles && !allowedRoles.includes(userRole)) {
      // Redirection de sécurité vers le dashboard approprié au rôle réel
      if (userRole === 'partner') return <Navigate to="/partner" replace />;
      if (userRole === 'company_admin') return <Navigate to="/company" replace />;
      return <Navigate to="/" replace />; // Member
  }

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route Publique */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route element={<Protected allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* PARTENAIRE */}
        <Route element={<Protected allowedRoles={['partner']} />}>
            <Route path="/partner" element={<PartnerDashboard />} />
        </Route>

        {/* ENTREPRISE */}
        <Route element={<Protected allowedRoles={['company_admin']} />}>
            <Route path="/company" element={<CompanyDashboard />} />
        </Route>

        {/* MEMBRE (Accessible à tous, y compris Partners/Admin pour voir le côté client) */}
        <Route element={<Protected allowedRoles={['member', 'partner', 'admin', 'company_admin']} />}>
            <Route path="/" element={<MemberDashboard />} />
            <Route path="/map" element={<MapView />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
