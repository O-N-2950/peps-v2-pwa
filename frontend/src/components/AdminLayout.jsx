import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Gift, Users, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#3D9A9A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6"><h1 className="text-2xl font-black text-[#3D9A9A]">PEP's Admin</h1></div>
        <nav className="flex-1 px-4 space-y-2">
          <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/admin/partners" icon={Store} label="Partenaires" />
          <NavItem to="/admin/offers" icon={Gift} label="Offres" />
          <NavItem to="/admin/members" icon={Users} label="Membres" />
        </nav>
        <div className="p-4 border-t"><button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-600 w-full hover:bg-red-50 rounded-lg"><LogOut size={20}/> Déconnexion</button></div>
      </div>
      <div className="flex-1 ml-64 p-8 overflow-y-auto"><Outlet /></div>
    </div>
  );
}
