import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Map, User, Store } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const role = localStorage.getItem('role');
  const isBoth = localStorage.getItem('is_both') === 'true';
  
  if (['/login', '/register'].includes(location.pathname)) return null;

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex flex-col items-center justify-center w-16 ${isActive ? 'text-[#3D9A9A]' : 'text-gray-400'}`}>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-medium mt-1">{label}</span>
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-4 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-50">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        
        {/* OFFRES : Visible pour Membre OU Hybride (Both) */}
        {(role === 'member' || isBoth) && (
            <NavItem to="/" icon={Home} label="Offres" />
        )}
        
        {/* CARTE : Pour tout le monde */}
        <NavItem to="/map" icon={Map} label="Carte" />

        {/* DASHBOARD : Pour Partenaire OU Hybride */}
        {(role === 'partner' || isBoth) && (
            <NavItem to="/partner" icon={Store} label="Boutique" />
        )}

        {/* ENTREPRISE */}
        {(role === 'company_admin' || role === 'admin') && (
            <NavItem to="/company" icon={LayoutDashboard} label="Pro" />
        )}
        
        {/* ADMIN / PROFIL */}
        <Link to={role === 'admin' ? "/admin" : "/login"} className="flex flex-col items-center justify-center w-16 text-gray-400">
            <User size={24} />
            <span className="text-[10px] font-medium mt-1">{role === 'admin' ? 'Admin' : 'Profil'}</span>
        </Link>

      </div>
    </div>
  );
}
