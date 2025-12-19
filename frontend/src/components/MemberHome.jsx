import React, { useState, useEffect } from 'react';
import { User, MapPin, Map, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import WahooCard from './WahooCard';
import io from 'socket.io-client';

const socket = io();

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MemberHome() {
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Géolocalisation GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.error('GPS error:', err)
      );
    }

    // Chargement offres
    fetch('/api/offers').then(r=>r.json()).then(data => {
      setOffers(data);
      setLoading(false);
    });

    // WebSocket pour stock en temps réel
    socket.on('stock_update', (d) => {
      setOffers(prev => prev.map(o => o.id === d.id ? {...o, stock: d.new_stock} : o));
    });

    return () => socket.off('stock_update');
  }, []);

  useEffect(() => {
    let result = [...offers];

    // Filtrage par type
    if (filterType !== 'all') {
      result = result.filter(o => o.type === filterType);
    }

    // Recherche
    if (search) {
      result = result.filter(o =>
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.partner.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Calcul distance et tri
    if (userPos) {
      result = result.map(o => ({
        ...o,
        distance: o.partner.lat ? haversine(userPos.lat, userPos.lng, o.partner.lat, o.partner.lng) : 999
      })).sort((a, b) => a.distance - b.distance);
    }

    setFilteredOffers(result);
  }, [offers, userPos, search, filterType]);

  const handleReserve = async (offer) => {
    const token = localStorage.getItem('token');
    if(!token) return window.location.href = '/login';
    const res = await fetch(`/api/reserve/${offer.id}`, {
      method: 'POST',
      headers: {'Authorization': `Bearer ${token}`}
    });
    if(res.ok) alert(`✅ ${offer.title} réservé !`);
    else alert('❌ Erreur réservation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="font-black text-2xl text-peps-turquoise">PEP's Digital</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={12} className="text-peps-pink"/>
              {userPos ? 'Position GPS activée' : 'Géolocalisation...'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/map" className="bg-peps-turquoise text-white p-3 rounded-full shadow-lg">
              <Map size={20}/>
            </Link>
            <Link to="/login" className="bg-gray-100 p-3 rounded-full">
              <User size={20}/>
            </Link>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            type="text"
            placeholder="Rechercher une offre ou un partenaire..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-peps-turquoise focus:outline-none"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Tout', icon: '🌍' },
            { value: 'flash', label: 'Flash', icon: '⚡' },
            { value: 'permanent', label: 'Club', icon: '♾️' },
            { value: 'daily', label: 'Du Jour', icon: '📅' },
            { value: 'weekly', label: 'Hebdo', icon: '📆' },
            { value: 'seasonal', label: 'Saison', icon: '🍂' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterType === f.value
                  ? 'bg-peps-turquoise text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Liste des offres */}
      <div className="p-4 pb-24">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-peps-turquoise border-t-transparent rounded-full mx-auto mb-2"></div>
            Chargement des offres...
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Filter size={48} className="mx-auto mb-2 opacity-50"/>
            Aucune offre trouvée
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map(o => (
              <WahooCard
                key={o.id}
                offer={o}
                onReserve={handleReserve}
                dist={o.distance ? o.distance.toFixed(1) : '?'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
