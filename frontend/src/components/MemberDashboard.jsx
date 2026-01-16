import React, { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';

export default function MemberDashboard() {
  const [data, setData] = useState({upcoming:[], history:[]});
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    fetch('/api/member/bookings', { headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`} })
      .then(r=>r.json()).then(setData);
  }, []);

  const list = tab === 'upcoming' ? data.upcoming : data.history;

  return (
    <div className="p-6 pb-24 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black mb-6 text-[#14b8a6]">Mon Agenda</h1>
      <div className="flex bg-white p-1 rounded-xl mb-6 shadow-sm">
        {['upcoming', 'history'].map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase ${tab===t?'bg-[#14b8a6] text-white':'text-gray-500'}`}>{t}</button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map(b => (
            <div key={b.id} className="bg-white p-4 rounded-xl border-l-4 border-[#14b8a6] shadow-sm">
                <div className="flex justify-between font-bold"><span>{b.partner}</span><span>{b.time}</span></div>
                <div className="text-sm text-gray-600 mb-2">{b.service} • {b.date}</div>
                <div className="text-xs text-gray-400 flex gap-1"><MapPin size={12}/> {b.address}</div>
            </div>
        ))}
        {list.length === 0 && <div className="text-center text-gray-400 py-10">Aucun rendez-vous.</div>}
      </div>
    </div>
  );
}
🚦 8. ROUTING & LOGIN (App.jsx)
Fichier : /frontend/src/App.jsx (Remplacez TOUT)

JavaScript

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
