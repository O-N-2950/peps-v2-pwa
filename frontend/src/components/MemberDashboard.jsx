
import React, { useState, useEffect } from 'react';
import { Gift, Clock, Zap, CheckCircle, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast, { Toaster } from 'react-hot-toast';

export default function MemberDashboard() {
  const [tab, setTab] = useState('privileges');
  const [offers, setOffers] = useState([]);
  const [history, setHistory] = useState([]);
  const [validation, setValidation] = useState(null);
  
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const load = () => {
      fetch('/api/member/privileges/available').then(r=>r.json()).then(setOffers);
      if(token) fetch('/api/member/history', { headers }).then(r=>r.json()).then(setHistory);
  };

  useEffect(() => { load(); }, [tab]);

  const usePrivilege = async (id) => {
    if(!token) return toast.error("Connectez-vous !");
    const res = await fetch(`/api/member/privileges/${id}/use`, { method: 'POST', headers });
    const data = await res.json();
    
    if(data.success) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500', '#FF69B4'] });
        setValidation(data);
        load();
    } else {
        toast.error(data.error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <Toaster position="top-center" />
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10"><h1 className="font-black text-xl text-[#3D9A9A]">PEP's World</h1></div>

      <div className="p-4 space-y-4">
        {tab === 'privileges' && offers.map(o => (
            <div key={o.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="h-32 bg-gray-200 relative">
                    <img src={o.partner.img} className="w-full h-full object-cover"/>
                    <div className="absolute bottom-2 left-2 text-white font-bold shadow-black">{o.partner.name}</div>
                </div>
                <div className="p-4 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-gray-800">{o.title}</div>
                        <div className="text-xs text-[#3D9A9A] font-bold">{o.type}</div>
                    </div>
                    <button onClick={()=>usePrivilege(o.id)} className="bg-black text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition">
                        PROFITER
                    </button>
                </div>
            </div>
        ))}

        {tab === 'history' && history.map((h, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                <div>
                    <div className="font-bold text-sm">{h.partner}</div>
                    <div className="text-xs text-gray-500">{h.title}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] bg-gray-100 px-2 py-1 rounded font-mono mb-1">{h.code.split('-').pop()}</div>
                    <div className="text-[10px] text-gray-400">{h.date}</div>
                </div>
            </div>
        ))}
      </div>

      {validation && (
        <div className="fixed inset-0 bg-[#3D9A9A]/95 z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in">
            <CheckCircle size={80} className="mb-6 animate-bounce"/>
            <h2 className="text-3xl font-black mb-2">ACTIVÉ !</h2>
            <div className="bg-white text-black p-6 rounded-2xl w-full max-w-xs shadow-2xl mb-8">
                <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">{validation.partner_name}</div>
                <div className="font-black text-xl mb-4">{validation.privilege_title}</div>
                <div className="bg-gray-100 p-3 rounded-xl font-mono text-lg font-bold tracking-widest">{validation.code}</div>
                <div className="text-xs text-gray-400 mt-2">{validation.timestamp}</div>
            </div>
            <button onClick={()=>setValidation(null)} className="bg-white text-[#3D9A9A] px-8 py-3 rounded-full font-bold shadow-xl">FERMER</button>
        </div>
      )}

      <div className="fixed bottom-0 w-full bg-white border-t flex justify-around p-2 pb-6 z-40">
         <button onClick={()=>setTab('privileges')} className={`p-2 flex flex-col items-center ${tab==='privileges'?'text-[#3D9A9A]':'text-gray-400'}`}><Gift size={24}/><span className="text-[10px]">Offres</span></button>
         <button onClick={()=>setTab('history')} className={`p-2 flex flex-col items-center ${tab==='history'?'text-[#3D9A9A]':'text-gray-400'}`}><Clock size={24}/><span className="text-[10px]">Historique</span></button>
      </div>
    </div>
  );
}