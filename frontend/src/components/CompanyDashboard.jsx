import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, Users, CheckCircle, Plus } from 'lucide-react';

export default function CompanyDashboard() {
  const [info, setInfo] = useState(null);
  const [packs, setPacks] = useState([]);
  const [activeTab, setActiveTab] = useState('PME'); // PME | CORP
  const [email, setEmail] = useState('');
  const [view, setView] = useState('team'); // 'team' | 'shop'

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/company/info', { headers: {'Authorization': `Bearer ${token}`} }).then(r=>r.json()).then(setInfo);
    fetch('/api/packs').then(r=>r.json()).then(setPacks);
  }, []);

  const buy = async (pack) => {
    if(!confirm(`Confirmer l'achat du pack ${pack.name} (${pack.price} CHF) ?`)) return;
    const token = localStorage.getItem('token');
    const res = await fetch('/api/company/buy-pack', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ pack_id: pack.id })
    });
    if(res.ok) window.location.reload();
  };

  const addMember = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/company/add-member', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ email })
    });
    if(res.ok) { alert("Membre ajouté !"); window.location.reload(); }
    else alert("Erreur (Quota atteint ou Email pris)");
  };

  if(!info) return <div className="p-10 text-center animate-pulse">Chargement...</div>;

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto">
      <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl mb-8 flex justify-between items-center">
        <div>
            <h1 className="font-black text-2xl flex items-center gap-3"><Building2 className="text-peps-primary"/> {info.name}</h1>
            <p className="text-gray-400 mt-1">Espace Gestion RH</p>
        </div>
        <div className="text-right">
            <p className="text-xs uppercase tracking-wider opacity-70">Licences Dispo</p>
            <p className="text-5xl font-black text-peps-primary">{info.credits}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
        <button onClick={()=>setView('team')} className={`font-bold pb-2 ${view==='team'?'border-b-2 border-black':''}`}>Mon Équipe</button>
        <button onClick={()=>setView('shop')} className={`font-bold pb-2 ${view==='shop'?'border-b-2 border-black':''}`}>Recharger Crédits</button>
      </div>

      {view === 'team' ? (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-2">
                <input className="flex-1 p-3 bg-gray-50 rounded-lg outline-none" placeholder="Email collaborateur..." value={email} onChange={e=>setEmail(e.target.value)}/>
                <button onClick={addMember} className="bg-black text-white p-3 rounded-lg"><Plus size={20}/></button>
            </div>
            {info.members.map((m, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between">
                    <span className="font-bold text-sm">{m.email}</span>
                    <span className="text-xs text-gray-400">Inscrit le {m.joined}</span>
                </div>
            ))}
        </div>
      ) : (
        <div>
            <div className="flex gap-2 mb-4">
                {['PME', 'CORP'].map(t => (
                    <button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-1 rounded-full text-xs font-bold ${activeTab===t?'bg-black text-white':'bg-gray-200'}`}>{t}</button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packs.filter(p => p.cat === activeTab).map(pack => (
                    <div key={pack.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gray-100 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-gray-500">{pack.cat}</div>
                        <h3 className="font-black text-lg text-gray-800">{pack.name}</h3>
                        <div className="text-2xl font-black text-peps-primary my-2">{pack.price}.-</div>
                        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> {pack.credits} Licences</div>
                        <button onClick={()=>buy(pack)} className="w-full bg-gray-900 text-white py-2 rounded-xl font-bold text-sm hover:bg-peps-primary">ACHETER</button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
