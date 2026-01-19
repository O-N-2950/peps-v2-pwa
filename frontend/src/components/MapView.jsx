import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ArrowLeft, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix icônes Leaflet
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: iconMarker, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], 13); }, [lat, lng]);
  return null;
}

export default function MapView() {
  const [partners, setPartners] = useState([]);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        
        // Charger les partenaires proches
        fetch(`/api/partners/nearby?lat=${latitude}&lng=${longitude}&radius=20`)
            .then(r => r.json())
            .then(setPartners);
      });
    }
  }, []);

  return (
    <div className="h-screen w-full relative z-0">
       <Link to="/" className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-full shadow-lg text-[#3D9A9A]">
           <ArrowLeft size={24} />
       </Link>

       <MapContainer center={[46.8182, 8.2275]} zoom={8} style={{height:"100%", width:"100%"}}>
           <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
           
           {userPos && (
               <>
                   <Marker position={[userPos.lat, userPos.lng]}>
                       <Popup>📍 Vous êtes ici</Popup>
                   </Marker>
                   <MapRecenter lat={userPos.lat} lng={userPos.lng} />
               </>
           )}

           {partners.map(p => (
               <Marker key={p.id} position={[p.lat, p.lng]}>
                   <Popup>
                       <div className="text-center">
                           <b className="text-[#3D9A9A]">{p.name}</b><br/>
                           {p.category}<br/>
                           <span className="font-bold">{p.distance} km</span>
                           <br/>
                           <button className="bg-black text-white text-xs px-2 py-1 rounded mt-1 flex items-center justify-center gap-1 mx-auto">
                               <Navigation size={10}/> Y ALLER
                           </button>
                       </div>
                   </Popup>
               </Marker>
           ))}
       </MapContainer>
    </div>
  );
}
