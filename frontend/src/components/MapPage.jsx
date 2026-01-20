import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconMarker from 'leaflet/dist/images/marker-icon.png';
const DefaultIcon = L.icon({ iconUrl: iconMarker, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPage() {
  const [partners, setPartners] = useState([]);
  useEffect(() => { fetch('/api/partners/search_v2?q=').then(r=>r.json()).then(setPartners) }, []);

  return (
    <div className="h-screen w-full relative">
        <Link to="/" className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-full shadow-lg text-[#3D9A9A]"><ArrowLeft/></Link>
        <MapContainer center={[46.8, 8.2]} zoom={8} style={{height:"100%", width:"100%"}}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MarkerClusterGroup chunkedLoading>
                {partners.map(p => (
                    <Marker key={p.id} position={[p.lat, p.lng]}><Popup><b>{p.name}</b><br/>{p.city}</Popup></Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    </div>
  );
}
