import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: shadow, iconSize: [25,41], iconAnchor: [12,41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
  const [offers, setOffers] = useState([]);
  const [pos, setPos] = useState([47.1368, 7.2468]);

  useEffect(() => {
    fetch('/api/offers').then(r=>r.json()).then(setOffers);
    if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p => setPos([p.coords.latitude, p.coords.longitude]));
  }, []);

  return (
    <div className="h-screen w-full relative z-0">
       <Link to="/" className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-full shadow-lg text-peps-turquoise"><ArrowLeft size={24}/></Link>
       <MapContainer center={pos} zoom={13} style={{height:"100%", width:"100%"}}>
           <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
           {offers.filter(o => o.partner.lat).map(o => (
               <Marker key={o.id} position={[o.partner.lat, o.partner.lng]}>
                   <Popup><b>{o.partner.name}</b><br/>{o.title}</Popup>
               </Marker>
           ))}
       </MapContainer>
    </div>
  );
}
