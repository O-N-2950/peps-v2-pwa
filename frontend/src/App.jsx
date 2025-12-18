import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import WahooCard from './components/WahooCard';

// --- COMPOSANT DE SÉCURITÉ (Middleware Frontend) ---
const ProtectedRoute = ({ allowedRoles }) => {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;
  return <Outlet />;
};

// --- PLACEHOLDERS DASHBOARDS (À REMPLACER PLUS TARD) ---
const MemberHome = () => {
    const [offers, setOffers] = useState([]);
    useEffect(() => { fetch('/api/offers').then(r=>r.json()).then(setOffers) }, []);
    return (
        <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pb-24">
            <h1 className="col-span-full font-black text-2xl mb-2">Offres Flash 🔥</h1>
            {offers.map(o => <WahooCard key={o.id} offer={o} onReserve={()=>{}} />)}
        </div>
    );
};
const PartnerDash = () => <div className="p-10 text-center font-bold text-xl">🏠 Espace Partenaire</div>;
const CompanyDash = () => <div className="p-10 text-center font-bold text-xl">🏢 Espace Entreprise</div>;
const AdminDash = () => <div className="p-10 text-center font-bold text-xl text-red-600">🛡️ SUPER ADMIN</div>;
const Login = () => <div className="p-10 text-center">Login (Utilisez votre composant existant)</div>;

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-50 min-h-screen text-gray-900 font-sans">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* PUBLIC / MEMBRES */}
          <Route path="/" element={<MemberHome />} />
          
          {/* ROUTES PROTÉGÉES PAR RÔLE */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/admin" element={<AdminDash />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['partner', 'super_admin']} />}>
            <Route path="/partner" element={<PartnerDash />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['company_admin', 'super_admin']} />}>
            <Route path="/company" element={<CompanyDash />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
