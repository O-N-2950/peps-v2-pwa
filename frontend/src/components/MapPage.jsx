import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import { Navigation, MapPin, Filter, Search, Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icônes Leaflet
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: iconMarker, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Icône personnalisée pulsante (Turquoise)
const PulseIcon = (category) => L.divIcon({
  className: 'custom-pulse-marker',
  html: `
    <div class="relative">
      <div class="absolute inset-0 bg-[#38B2AC] rounded-full animate-ping opacity-75"></div>
      <div class="relative bg-[#38B2AC] rounded-full w-8 h-8 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
        ${getCategoryEmoji(category)}
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Icône utilisateur
const UserIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#F26D7D" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

function getCategoryEmoji(category) {
  const emojis = {
    'Boulangerie / Pâtisserie': '🥖',
    'Restaurant': '🍽️',
    'Coiffure': '✂️',
    'Mode': '👗',
    'Beauté': '💄',
    'Sport': '⚽',
    'Santé': '🏥',
    'Services': '🔧',
    'Loisirs': '🎭',
    'Alimentation': '🛒'
  };
  return emojis[category] || '🏪';
}

function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { 
    if (lat && lng) {
      map.flyTo([lat, lng], 13, { duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapViewWahoo({ partners = [], onPartnerClick, showFilters = true }) {
  const [userPos, setUserPos] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserPos({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          setGeoError(true);
          // Fallback sur Courgenay (premier partenaire)
          setUserPos({ lat: 47.4088, lng: 7.1124 });
        }
      );
    } else {
      setGeoError(true);
      setUserPos({ lat: 47.4088, lng: 7.1124 });
    }
  }, []);

  // Extraire les catégories uniques
  const categories = ['all', ...new Set(partners.map(p => p.category).filter(Boolean))];

  // Filtrer les partenaires
  const filteredPartners = partners.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const defaultCenter = [47.4088, 7.1124];
  const mapCenter = userPos ? [userPos.lat, userPos.lng] : defaultCenter;

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#38B2AC]">
      {/* Header avec titre et compteur */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">🗺️ Carte Interactive PEP'S</h3>
            <p className="text-sm opacity-90">
              {filteredPartners.length} partenaire{filteredPartners.length > 1 ? 's' : ''} actif{filteredPartners.length > 1 ? 's' : ''}
            </p>
          </div>
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="bg-white text-[#38B2AC] px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Filter size={20} />
              Filtres
            </button>
          )}
        </div>
      </div>

      {/* Panel de filtres */}
      {showFilterPanel && (
        <div className="absolute top-20 left-4 right-4 z-[1000] bg-white rounded-xl shadow-2xl p-4 max-w-md">
          <h4 className="font-bold text-lg mb-3 text-[#38B2AC]">🔍 Recherche & Filtres</h4>
          
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un partenaire, une ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#38B2AC] focus:outline-none"
            />
          </div>

          {/* Filtres par catégorie */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Catégories :</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#38B2AC] text-white shadow-lg scale-105'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat === 'all' ? '🌟 Tous' : `${getCategoryEmoji(cat)} ${cat}`}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowFilterPanel(false)}
            className="mt-4 w-full bg-[#F26D7D] text-white py-2 rounded-lg font-bold hover:bg-[#e05a6a] transition-colors"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* Bouton de géolocalisation */}
      {userPos && (
        <button
          onClick={() => {
            const map = document.querySelector('.leaflet-container');
            if (map) {
              // Trigger recenter
              setUserPos({...userPos});
            }
          }}
          className="absolute bottom-4 right-4 z-[1000] bg-[#F26D7D] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
          title="Me localiser"
        >
          <Locate size={24} />
        </button>
      )}
      
      <MapContainer 
        center={mapCenter} 
        zoom={userPos ? 13 : 8} 
        style={{height:"100%", width:"100%", paddingTop: "80px"}}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {userPos && (
          <>
            <Marker position={[userPos.lat, userPos.lng]} icon={UserIcon}>
              <Popup>
                <div className="text-center">
                  <b className="text-[#F26D7D] text-lg">📍 Vous êtes ici</b>
                  <p className="text-xs text-gray-600 mt-1">Position actuelle</p>
                </div>
              </Popup>
            </Marker>
            <MapRecenter lat={userPos.lat} lng={userPos.lng} />
          </>
        )}

        {filteredPartners.map(p => {
          // Vérifier que le partenaire a des coordonnées valides
          if (!p.latitude || !p.longitude) return null;
          
          return (
            <Marker 
              key={p.id} 
              position={[p.latitude, p.longitude]}
              icon={PulseIcon(p.category)}
              eventHandlers={{
                click: () => {
                  if (onPartnerClick) onPartnerClick(p.id);
                }
              }}
            >
              <Popup className="custom-popup">
                <div className="text-center p-2">
                  <div className="text-3xl mb-2">{getCategoryEmoji(p.category)}</div>
                  <b className="text-[#38B2AC] text-lg">{p.name}</b><br/>
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {p.category || 'Commerce'}
                  </span><br/>
                  <p className="text-sm text-gray-700 mt-2">📍 {p.city}</p>
                  {p.distance && (
                    <p className="font-bold text-sm text-[#F26D7D]">
                      📏 {p.distance} km
                    </p>
                  )}
                  <button 
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] text-white text-sm px-4 py-2 rounded-full mt-3 flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform shadow-lg font-bold"
                  >
                    <Navigation size={16}/> Y ALLER
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* CSS pour l'animation pulse */}
      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
