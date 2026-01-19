import React, { useState, useEffect, useRef } from 'react';
import { Gift, Clock, Zap, CheckCircle, MapPin, LogOut, User, Star, Loader2, Search, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import MapViewCompact from './MapViewCompact';

// Fonction Haversine pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lat2 || !lon1 || !lon2) return null;
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MemberDashboard() {
  const [tab, setTab] = useState('privileges');
  // Initialisation sécurisée avec tableaux vides
  const [offers, setOffers] = useState([]);
  const [history, setHistory] = useState([]);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // V18.1 Search
  const [searchResults, setSearchResults] = useState([]);
  
  // V18.3 Géolocalisation
  const [userPos, setUserPos] = useState(null);
  const offerRefs = useRef({});
  
  const token = localStorage.getItem('token');

  // Log de cycle de vie pour le débogage
  useEffect(() => { console.log("🚀 MemberDashboard Mounted"); }, []);

  // Géolocalisation au chargement
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (error) => {
          console.log('Géolocalisation refusée ou indisponible');
        }
      );
    }
  }, []);

  const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
          // 1. Récupération des offres
          const resOffers = await fetch('/api/member/privileges/available');
          if (!resOffers.ok) throw new Error(`Erreur API Offres: ${resOffers.status}`);
          const dataOffers = await resOffers.json();
          // Sécurité : Force le type tableau
          setOffers(Array.isArray(dataOffers) ? dataOffers : []);

          // 2. Récupération historique (si connecté)
          if (token) {
              const resHistory = await fetch('/api/member/history', { 
                headers: { 'Authorization': `Bearer ${token}` } 
              });
              if (resHistory.ok) {
                  const dataHistory = await resHistory.json();
                  setHistory(Array.isArray(dataHistory) ? dataHistory : []);
              }
          }
      } catch (err) {
          console.error("🔥 Erreur chargement:", err);
          setError(err.message);
          toast.error("Impossible de charger les données");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { loadData(); }, [token]); // Recharger si le token change

  const usePrivilege = async (id) => {
    if(!token) return toast.error("Connectez-vous pour profiter des privilèges !");
    
    const toastId = toast.loading("Validation en cours...");
    try {
        const res = await fetch(`/api/member/privileges/${id}/use`, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const data = await res.json();
        toast.dismiss(toastId);

        if(data.success) {
            toast.success("Privilège validé !");
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#3D9A9A', '#E06B7D', '#FFD700'] });
            setValidation(data);
            // Rafraîchir l'historique en arrière-plan
            const resHist = await fetch('/api/member/history', { headers: { 'Authorization': `Bearer ${token}` } });
            if(resHist.ok) setHistory(await resHist.json());
        } else {
            toast.error(data.error || "Erreur validation");
        }
    } catch (e) {
        toast.dismiss(toastId);
        toast.error("Erreur réseau");
    }
  };

  // Calculer les distances et trier les offres
  const getOffersWithDistance = (offersList) => {
    if (!userPos) return offersList;
    
    return offersList.map(o => {
      if (o.partner?.lat && o.partner?.lng) {
        const dist = calculateDistance(userPos.lat, userPos.lng, o.partner.lat, o.partner.lng);
        return { ...o, distance: dist ? Math.round(dist * 10) / 10 : null };
      }
      return { ...o, distance: null };
    }).sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  };

  // Scroll vers une offre spécifique
  const scrollToOffer = (offerId) => {
    const element = offerRefs.current[offerId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight temporaire
      element.classList.add('ring-4', 'ring-[#3D9A9A]', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-[#3D9A9A]', 'ring-opacity-50');
      }, 2000);
    }
  };

  // --- RENDU SÉCURISÉ ---

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-[#3D9A9A]">
      <Loader2 className="animate-spin w-10 h-10 mb-4" />
      <p className="font-bold">Chargement PEP's...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-red-500 text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-800">Une erreur est survenue</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={loadData} className="bg-[#3D9A9A] text-white px-6 py-3 rounded-full font-bold shadow-lg">
        Réessayer
      </button>
    </div>
  );

  // Offres à afficher (avec recherche ou toutes)
  const displayedOffers = searchResults.length > 0 ? searchResults : offers;
  const offersWithDistance = getOffersWithDistance(displayedOffers);

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans">
      <Toaster position="top-center" />
      
      {/* HEADER */}
      <div className="bg-[#3D9A9A] p-4 shadow-sm sticky top-0 z-10 space-y-3">
         <div className="flex justify-between items-center">
         <h1 className="font-black text-xl text-white tracking-tight">PEP's World</h1>
         <div className="flex gap-2">
            <Link to="/map" className="p-2 bg-gray-100 rounded-full"><MapPin size={20} className="text-gray-600"/></Link>
            {token ? (
                <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition">
                    <LogOut size={18} />
                </button>
            ) : (
                <Link to="/login" className="bg-black text-white px-3 py-2 rounded-full text-xs font-bold">Connexion</Link>
            )}
         </div>
         </div>
         
         {/* V18.1 SearchBar */}
         <SearchBar onResults={setSearchResults} />
      </div>

      {/* CONTENU */}
      <div className="p-4 space-y-4">
        
        {/* LISTE DES OFFRES */}
        {tab === 'privileges' && (
            <div className="space-y-4">
                {/* V18.3 CARTE INTERACTIVE */}
                {offersWithDistance.length > 0 && (
                  <div className="mb-6">
                    <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin size={20} className="text-[#3D9A9A]"/>
                      Partenaires à proximité
                    </h2>
                    <MapViewCompact 
                      partners={offersWithDistance} 
                      onPartnerClick={scrollToOffer}
                    />
                  </div>
                )}

                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">Offres disponibles</h2>
                    <span className="text-xs bg-[#3D9A9A]/10 text-[#3D9A9A] font-bold px-2 py-1 rounded-full">{offersWithDistance.length}</span>
                </div>

                {offersWithDistance.length === 0 && <div className="text-center py-10 text-gray-400">Aucune offre pour le moment.</div>}

                {offersWithDistance.map(o => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        key={o.id}
                        ref={el => offerRefs.current[o.id] = el}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 group transition-all duration-300"
                    >
                        <div className="h-32 bg-gray-200 relative">
                            {/* Protection contre les images manquantes */}
                            {o.partner?.img ? (
                                <img src={o.partner.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={o.partner?.name} onError={(e) => e.target.style.display = 'none'}/>
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold">Image</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            {/* Protection contre les noms manquants */}
                            <div className="absolute bottom-2 left-3 text-white font-bold text-lg shadow-black">{o.partner?.name || 'Partenaire Inconnu'}</div>
                            {o.type && <div className={`absolute top-2 right-2 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase shadow-sm ${o.type === 'flash' ? 'bg-red-500 animate-pulse' : 'bg-[#3D9A9A]'}`}>{o.type}</div>}
                            
                            {/* V18.3 Distance Badge */}
                            {o.distance !== null && (
                              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[#3D9A9A] text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                                <MapPin size={12} />
                                {o.distance} km
                              </div>
                            )}
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <div className="flex-1 pr-2">
                                <div className="font-bold text-gray-800 leading-tight">{o.title}</div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{o.desc || "Privilège exclusif"}</div>
                            </div>
                            <button onClick={() => usePrivilege(o.id)} className="bg-black text-white px-4 py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform shrink-0 flex items-center gap-1">
                                <Zap size={14} className="fill-current text-yellow-400"/> PROFITER
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}

        {/* HISTORIQUE */}
        {tab === 'history' && (
            <div className="space-y-4">
                <h2 className="font-bold text-gray-700">Historique</h2>
                {!token && <div className="text-center py-10 text-gray-500">Connectez-vous pour voir votre historique.</div>}
                {token && history.length === 0 && <div className="text-center py-10 text-gray-400">Aucune utilisation récente.</div>}
                
                {history.map((h, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                        <div>
                            <div className="font-bold text-sm text-gray-800">{h.partner}</div>
                            <div className="text-xs text-gray-500">{h.title}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded font-mono font-bold mb-1 border border-green-100">
                                {h.code ? h.code.split('-').slice(-2).join('-') : 'VALIDÉ'}
                            </div>
                            <div className="text-[9px] text-gray-400">{h.date}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* MODAL DE VALIDATION */}
      {validation && (
        <div className="fixed inset-0 bg-[#3D9A9A]/95 z-[100] flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in duration-300">
            <div className="bg-white/20 p-6 rounded-full mb-6 animate-bounce">
                <CheckCircle size={64} className="text-white"/>
            </div>
            <h2 className="text-4xl font-black mb-2 tracking-tighter">ACTIVÉ !</h2>
            <p className="text-white/80 text-sm mb-8">Montrez cet écran au partenaire</p>
            
            <div className="bg-white text-black p-6 rounded-3xl w-full max-w-xs shadow-2xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#3D9A9A] to-[#E06B7D]"></div>
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">{validation.partner_name}</div>
                <div className="font-black text-xl mb-6 text-[#3D9A9A] leading-tight">{validation.privilege_title}</div>
                
                <div className="bg-gray-100 p-4 rounded-2xl font-mono text-2xl font-black tracking-widest border-2 border-dashed border-gray-300 text-center break-all">
                    {validation.code ? validation.code.split('-').slice(-2).join('-') : 'CODE'}
                </div>
                <div className="text-[10px] text-gray-400 mt-3 font-mono text-center">{validation.timestamp}</div>
            </div>
            
            <button onClick={() => setValidation(null)} className="bg-white text-[#3D9A9A] px-10 py-4 rounded-full font-bold shadow-xl hover:bg-gray-50 transition-colors active:scale-95">
                FERMER
            </button>
        </div>
      )}

      {/* NAVIGATION BASSE */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around p-2 pb-safe z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
         <button onClick={() => setTab('privileges')} className={`p-2 flex flex-col items-center w-16 transition-colors ${tab === 'privileges' ? 'text-[#3D9A9A]' : 'text-gray-300'}`}>
            <Gift size={24} strokeWidth={tab === 'privileges' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Offres</span>
         </button>
         
         <button onClick={() => setTab('history')} className={`p-2 flex flex-col items-center w-16 transition-colors ${tab === 'history' ? 'text-[#3D9A9A]' : 'text-gray-300'}`}>
            <Clock size={24} strokeWidth={tab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Historique</span>
         </button>

         <button className="p-2 flex flex-col items-center w-16 text-gray-300 opacity-50 cursor-not-allowed">
            <Star size={24} />
            <span className="text-[10px] font-medium mt-1">Favoris</span>
         </button>
      </div>
    </div>
  );
}
