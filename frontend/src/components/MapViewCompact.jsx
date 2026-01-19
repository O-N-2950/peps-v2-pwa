import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Navigation, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icônes Leaflet
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: iconMarker, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Icône personnalisée pour l'utilisateur (bleu)
const UserIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#3D9A9A" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { 
    if (lat && lng) {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapViewCompact({ partners, onPartnerClick }) {
  const [userPos, setUserPos] = useState(null);
  const [geoError, setGeoError] = useState(false);

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
          // Fallback sur Lausanne
          setUserPos({ lat: 46.5197, lng: 6.6323 });
        }
      );
    } else {
      setGeoError(true);
      setUserPos({ lat: 46.5197, lng: 6.6323 });
    }
  }, []);

  // Centre par défaut (Suisse)
  const defaultCenter = [46.8182, 8.2275];
  const mapCenter = userPos ? [userPos.lat, userPos.lng] : defaultCenter;

  return (
    <div className="relative w-full h-[300px] rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
      {geoError && (
        <div className="absolute top-2 left-2 z-[1000] bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full shadow-md">
          📍 Géolocalisation désactivée
        </div>
      )}
      
      <MapContainer 
        center={mapCenter} 
        zoom={userPos ? 13 : 8} 
        style={{height:"100%", width:"100%"}}
        scrollWheelZoom={false}
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
                  <b className="text-[#3D9A9A]">📍 Vous êtes ici</b>
                </div>
              </Popup>
            </Marker>
            <MapRecenter lat={userPos.lat} lng={userPos.lng} />
          </>
        )}

        {partners.map(p => {
          // Vérifier que le partenaire a des coordonnées valides
          if (!p.partner?.lat || !p.partner?.lng) return null;
          
          return (
            <Marker 
              key={p.id} 
              position={[p.partner.lat, p.partner.lng]}
              eventHandlers={{
                click: () => {
                  if (onPartnerClick) onPartnerClick(p.id);
                }
              }}
            >
              <Popup>
                <div className="text-center">
                  <b className="text-[#3D9A9A]">{p.partner.name}</b><br/>
                  <span className="text-xs text-gray-600">{p.partner.category || 'Commerce'}</span><br/>
                  {p.distance && (
                    <span className="font-bold text-sm">{p.distance} km</span>
                  )}
                  <br/>
                  <button 
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${p.partner.lat},${p.partner.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-black text-white text-xs px-2 py-1 rounded mt-1 flex items-center justify-center gap-1 mx-auto hover:bg-gray-800"
                  >
                    <Navigation size={10}/> Y ALLER
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
