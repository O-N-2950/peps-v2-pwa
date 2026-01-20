import React, { useState, useEffect } from 'react';
import GroupManager from './GroupManager';
import PackageSelector from './PackageSelector';
import SearchResults from './SearchResults';
import { Search, Gift, User, LogOut } from 'lucide-react';

export default function MemberDashboard() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('home');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [offers, setOffers] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
      if(token) fetch('/api/member/profile', { headers: {'Authorization': `Bearer ${token}`} }).then(r=>r.json()).then(setProfile);
  }, []);

  useEffect(() => {
    if (tab === 'search') {
        const t = setTimeout(() => {
            fetch(`/api/partners/search?q=${query}&category=${cat}`).then(r=>r.json()).then(setOffers);
        }, 300);
        return () => clearTimeout(t);
    }
  }, [query, cat, tab]);

  if(!profile) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
       {/* Header */}
       <div className="bg-[#3D9A9A] text-white p-6">
           <div className="flex justify-between items-center">
               <div>
                   <h1 className="font-black text-xl">Bonjour {profile.name}</h1>
                   {profile.premium ? (
                       <div className="text-xs bg-white/20 inline-block px-2 py-1 rounded mt-1">✨ MEMBRE PREMIUM</div>
                   ) : (
                       <div className="text-xs bg-red-500/80 inline-block px-2 py-1 rounded mt-1">GRATUIT</div>
                   )}
               </div>
               <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="p-2"><LogOut size={20}/></button>
           </div>
       </div>

       {/* Tabs */}
       <div className="bg-white border-b flex">
           <button onClick={()=>setTab('home')} className={`flex-1 p-4 font-bold text-sm ${tab==='home'?'border-b-2 border-[#3D9A9A] text-[#3D9A9A]':'text-gray-400'}`}><User size={16} className="inline mr-1"/> ACCUEIL</button>
           <button onClick={()=>setTab('search')} className={`flex-1 p-4 font-bold text-sm ${tab==='search'?'border-b-2 border-[#3D9A9A] text-[#3D9A9A]':'text-gray-400'}`}><Search size={16} className="inline mr-1"/> RECHERCHE</button>
           <button onClick={()=>setTab('privileges')} className={`flex-1 p-4 font-bold text-sm ${tab==='privileges'?'border-b-2 border-[#3D9A9A] text-[#3D9A9A]':'text-gray-400'}`}><Gift size={16} className="inline mr-1"/> PRIVILÈGES</button>
       </div>

       {/* Content */}
       <div className="p-4">
           {tab === 'home' && (
               <div>
                   {profile.premium ? (
                       <div className="mb-6">
                           <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold mb-4 text-center">✨ ABONNEMENT ACTIF</div>
                           {profile.owner && <GroupManager />}
                       </div>
                   ) : (
                       <div>
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                               <h2 className="font-bold text-lg mb-2">Devenez Membre Premium</h2>
                               <p className="text-sm text-gray-600 mb-4">Accédez à tous les privilèges exclusifs de nos partenaires.</p>
                           </div>
                           <PackageSelector />
                       </div>
                   )}
               </div>
           )}

           {tab === 'search' && (
               <div>
                   <input className="w-full p-4 bg-white rounded-xl border mb-4" placeholder="Rechercher un partenaire..." value={query} onChange={e=>setQuery(e.target.value)}/>
                   <SearchResults offers={offers} />
               </div>
           )}

           {tab === 'privileges' && (
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <h2 className="font-bold text-lg mb-4">Mes Privilèges Utilisés</h2>
                   <p className="text-sm text-gray-500">Historique à venir...</p>
               </div>
           )}
       </div>
    </div>
  );
}
