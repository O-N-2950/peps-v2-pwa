import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// IMPORTS DES COMPOSANTS
import Login from './components/Login';
import Register from './components/Register';
import MemberHome from './components/MemberHome';
import PartnerDashboard from './components/PartnerDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import MapView from './components/MapView';
// import PartnerRegister from './components/PartnerRegister'; // Composant non existant
import Navigation from './components/Navigation';

// 🟢 L'IMPORT QUI MANQUAIT SÛREMENT
import AdminDashboard from './components/AdminDashboard'; 

// PROTECTION DES ROUTES
const ProtectedRoute = ({ allowedRoles }) => {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  
  // 1. Pas connecté -> Login
  if (!token) return <Navigate to="/login" replace />;
  
  // 2. Rôle Admin -> Accès total (Passe-partout)
  if (role === 'admin') return <Outlet />;

  // 3. Vérification Rôle spécifique
  if (allowedRoles && !allowedRoles.includes(role)) {
      if(role === 'partner') return <Navigate to="/partner" replace />;
      if(role === 'company_admin') return <Navigate to="/company" replace />;
      return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-y-auto pb-16">
            <Routes>
            {/* ROUTES PUBLIQUES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* <Route path="/partner-register" element={<PartnerRegister />} /> */}
            
            {/* ROUTE MEMBRE (ACCUEIL) */}
            <Route path="/" element={<MemberHome />} />
            <Route path="/map" element={<MapView />} />
            
            {/* ROUTES PROTÉGÉES */}
            
            {/* 🔴 ROUTE ADMIN (LA CORRECTION EST ICI) */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            
            {/* PARTENAIRE */}
            <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
                <Route path="/partner" element={<PartnerDashboard />} />
            </Route>
            
            {/* ENTREPRISE */}
            <Route element={<ProtectedRoute allowedRoles={['company_admin']} />}>
                <Route path="/company" element={<CompanyDashboard />} />
            </Route>
            
            {/* CATCH-ALL 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>

        {/* Barre de navigation (cachée sur login/admin) */}
        {!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin') && <Navigation />}
      </div>
    </BrowserRouter>
  );
}
