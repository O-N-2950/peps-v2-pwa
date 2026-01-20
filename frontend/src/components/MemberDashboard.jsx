import React, { useState, useEffect } from 'react';
import { Search, Gift, User, Crown, CreditCard, LogOut, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import SearchResults from './SearchResults';

export default function MemberDashboard() {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState({ active: false });
  const [validation, setValidation] = useState(null);
  
  const token = localStorage.getItem('token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('success') === 'subscription_active') {
        toast.success("Abonnement activé ! Bienvenue au Club.");
        confetti({ particleCount: 300, spread: 100 });
        window.history.replaceState({}, document.title, "/");
    }
    
    if (token) fetch('/api/member/status', { headers }).then(r=>r.json()).then(setStatus);
  }, []);

  useEffect(() => {
    if (tab === 'search') {
        const t = setTimeout(() => {
            fetch(`/api/partners/search?q=${query}&category=${cat}`).then(r=>r.json()).then(setOffers);
        }, 300);
        return () => clearTimeout(t);
    }
  }, [query, cat, tab]);

  const subscribe = async () => {
      if (!token) return window.location.href = '/login';
      const toastId = toast.loading("Redirection Stripe...");
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST', headers });
      const d = await res.json();
      toast.dismiss(toastId);
      if(d.url) window.location.href = d.url;
      else toast.error("Erreur: " + (d.error || "Service indisponible"));
  };

  const manageSub = async () => {
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers });
      const d = await res.json();
      if(d.url) window.location.href = d.url;
      else toast.error("Erreur Portail");
  };

  const usePrivilege = async (id) => {
      if(!token) return toast.error("Connectez-vous !");
      
      const res = await fetch(`/api/member/privileges/${id}/use`, { method: 'POST', headers });
      const d = await res.json();
      
      if(d.success) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          setValidation(d);
      } else if (d.error === "ABO_REQUIRED") {
          toast((t) => (
            <div className="flex flex-col gap-2 text-center">
                <span className="font-bold">💎 Réservé aux membres Premium</span>
                <button onClick={subscribe} className="bg-black text-white px-4 py-2 rounded text-xs font-bold mt-1">
                    S'abonner (49.-/an)
                </button>
            </div>
          ), { icon: '🔒', duration: 5000 });
      } else {
          toast.error(d.error);
      }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans">
      <Toaster position="top-center" />
      
      <div className="bg-white p-4 shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-center mb-3">
            <h1 className="font-black text-xl text-[#3D9A9A]">PEP's World</h1>
            {status.active ? (
                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={10} fill="currentColor"/> PREMIUM</span>
            ) : (
                <button onClick={subscribe} className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">S'ABONNER</button>
            )}
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
            <input className="w-full bg-gray-100 p-3 pl-10 rounded-xl text-sm font-bold outline-none" 
                   placeholder="Rechercher..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {['all', 'Restaurant', 'Beauté', 'Sport', 'Boutique'].map(c => (
                <button key={c} onClick={()=>setCat(c)} className={`px-3 py-1 rounded-full text-xs font-bold ${cat===c?'bg-[#3D9A9A] text-white':'bg-gray-100'}`}>{c}</button>
            ))}
        </div>
      </div>

      <div className="p-4">
        {tab === 'search' && <SearchResults results={offers} onAction={usePrivilege} />}
        
        {tab === 'profile' && (
            <div className="p-6 bg-white rounded-2xl shadow-sm text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center"><User size={40} className="text-gray-400"/></div>
                <h2 className="font-bold text-lg">Mon Compte</h2>
                <p className={`text-sm font-bold mb-6 ${status.active?'text-green-600':'text-red-500'}`}>
                    Statut : {status.active ? 'Premium Actif' : 'Gratuit'}
                </p>
                
                {status.active ? (
                    <button onClick={manageSub} className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold mb-2 flex items-center justify-center gap-2"><CreditCard size={16}/> Gérer Abonnement</button>
                ) : (
                    <button onClick={subscribe} className="w-full bg-[#635BFF] text-white py-3 rounded-xl font-bold mb-2 shadow-lg">S'ABONNER (49.-/an)</button>
                )}
                <button onClick={()=>{localStorage.clear(); window.location.href='/login'}} className="mt-8 text-red-400 text-xs font-bold flex items-center justify-center gap-1 mx-auto"><LogOut size={12}/> Déconnexion</button>
            </div>
        )}
      </div>

      {validation && (
        <div className="fixed inset-0 bg-[#3D9A9A]/95 z-50 flex flex-col items-center justify-center p-6 text-white text-center">
            <CheckCircle size={80} className="mb-6 animate-bounce"/>
            <h2 className="text-3xl font-black mb-2">ACTIVÉ !</h2>
            <div className="bg-white text-black p-4 rounded-xl w-full max-w-xs mb-6">
                <div className="font-mono text-xl font-bold tracking-widest">{validation.code}</div>
            </div>
            <button onClick={()=>setValidation(null)} className="bg-white text-[#3D9A9A] px-10 py-4 rounded-full font-bold shadow-xl">FERMER</button>
        </div>
      )}

      <div className="fixed bottom-0 w-full bg-white border-t flex justify-around p-2 pb-safe z-40 shadow-lg">
        <button onClick={()=>setTab('search')} className={`p-2 ${tab==='search'?'text-[#3D9A9A]':'text-gray-300'}`}><Search/></button>
        <button onClick={()=>setTab('profile')} className={`p-2 ${tab==='profile'?'text-[#3D9A9A]':'text-gray-300'}`}><User/></button>
      </div>
    </div>
  );
}
