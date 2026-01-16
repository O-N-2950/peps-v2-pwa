import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Home, LayoutDashboard, Calendar } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || ['/','/login','/register'].includes(location.pathname)) return null;

  const logout = () => { localStorage.clear(); window.location.href = '/'; };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 z-50 flex justify-between items-center h-16 max-w-md mx-auto">
      <Link to="/" className="font-black text-xl text-[#14b8a6] hidden md:block">PEP's</Link>
      <div className="flex w-full justify-between md:w-auto md:gap-8">
        {role === 'member' && <><Link to="/offers" className="flex flex-col items-center text-xs text-gray-500 hover:text-[#14b8a6]"><Home size={20}/> Offres</Link><Link to="/member-profile" className="flex flex-col items-center text-xs text-gray-500 hover:text-[#14b8a6]"><User size={20}/> Profil</Link></>}
        {role === 'partner' && <><Link to="/partner" className="flex flex-col items-center text-xs text-gray-500 hover:text-[#f97316]"><LayoutDashboard size={20}/> Stats</Link><Link to="/partner/bookings" className="flex flex-col items-center text-xs text-gray-500 hover:text-[#f97316]"><Calendar size={20}/> Agenda</Link></>}
        {role === 'admin' && <Link to="/admin" className="flex flex-col items-center text-xs text-red-500 font-bold"><LayoutDashboard size={20}/> Admin</Link>}
        <button onClick={logout} className="flex flex-col items-center text-xs text-gray-300 hover:text-red-500"><LogOut size={20}/> Sortir</button>
      </div>
    </nav>
  );
}
