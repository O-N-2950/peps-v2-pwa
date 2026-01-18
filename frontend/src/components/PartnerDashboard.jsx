import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PartnerDashboard() {
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugLog, setDebugLog] = useState([]); // Log visible à l'écran

  const addLog = (msg) => {
    const line = `${new Date().toLocaleTimeString()} > ${msg}`;
    console.log(line);
    setDebugLog(prev => [...prev, line]);
  };

  useEffect(() => {
    addLog("🚀 MOUNT V13.0 - Starting Fetch...");
    
    const token = localStorage.getItem('token');
    if (!token) {
        addLog("❌ No Token Found");
        setError("Non connecté");
        setLoading(false);
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    const loadData = async () => {
        try {
            // 1. Profil
            addLog("📡 Fetching Profile...");
            const resProfile = await fetch('/api/partner/profile', { headers });
            addLog(`📥 Profile Status: ${resProfile.status}`);
            
            if (resProfile.status === 401 || resProfile.status === 403) {
                throw new Error("Session expirée (401/403). Reconnectez-vous.");
            }
            
            const txtProfile = await resProfile.text();
            if (!resProfile.ok) throw new Error(`Erreur API Profil: ${txtProfile}`);
            
            const dataProfile = JSON.parse(txtProfile);
            setProfile(dataProfile);
            addLog(`✅ Profile Loaded: ${dataProfile.name}`);

            // 2. Offres
            addLog("📡 Fetching Offers...");
            const resOffers = await fetch('/api/partner/offers', { headers });
            if (resOffers.ok) {
                const dataOffers = await resOffers.json();
                setOffers(dataOffers || []);
                addLog(`✅ Offers Loaded (${dataOffers.length})`);
            } else {
                addLog(`⚠️ Offers Failed: ${resOffers.status}`);
            }

        } catch (err) {
            addLog(`🔥 CRASH: ${err.message}`);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    loadData();
  }, []);

  // --- RENDU ---

  if (loading) return (
    <div className="p-10 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p>Chargement V13...</p>
        <div className="mt-4 text-left bg-black text-green-400 p-4 rounded font-mono text-xs">
            {debugLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur V13</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="bg-black text-white px-6 py-3 rounded-xl font-bold">
            Se reconnecter
        </button>
        <div className="mt-8 text-left bg-black text-red-400 p-4 rounded-xl font-mono text-xs overflow-auto max-h-60 border-2 border-red-500">
            {debugLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
    </div>
  );

  return (
    <div className="p-6 pb-24 min-h-screen bg-gray-50">
      {/* TRACEUR VISUEL V13 */}
      <div className="fixed top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 z-50">V13 LIVE</div>

      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-black text-[#3D9A9A]">Bonjour {profile?.name}</h1>
            <p className="text-gray-400 text-sm">{profile?.category || 'Partenaire'}</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
            <LayoutDashboard size={20} className="text-[#3D9A9A]" />
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1"><Users size={14}/> Followers</div>
            <div className="text-3xl font-black text-gray-900">{profile?.stats?.followers || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1"><Zap size={14}/> Offres</div>
            <div className="text-3xl font-black text-gray-900">{offers.length}</div>
        </div>
      </div>

      {/* OFFRES */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-800">Vos Offres Actives</h2>
            <Link to="/partner/create-offer" className="text-xs font-bold text-[#3D9A9A] bg-[#3D9A9A]/10 px-3 py-1 rounded-full">+ Créer</Link>
        </div>
        
        {offers.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center border border-dashed border-gray-300">
                <p className="text-gray-400 text-sm mb-3">Aucune offre en ligne</p>
            </div>
        ) : (
            <div className="space-y-3">
                {offers.map(offer => (
                    <div key={offer.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-900">{offer.title}</h3>
                            <div className="flex gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${offer.type === 'flash' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {offer.type === 'flash' ? 'FLASH' : 'CLUB'}
                                </span>
                            </div>
                        </div>
                        <ArrowRight size={18} className="text-gray-300"/>
                    </div>
                ))}
            </div>
        )}
      </div>
      
      {/* LOGS DE SUCCÈS DISCRETS */}
      <details className="mt-8 opacity-50">
        <summary className="text-xs">Logs Techniques V13</summary>
        <div className="bg-white p-2 text-[10px] font-mono mt-2">
            {debugLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </details>
    </div>
  );
}
