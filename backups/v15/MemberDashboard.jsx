import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Zap } from 'lucide-react';
import Countdown from 'react-countdown';
import confetti from 'canvas-confetti';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function MemberDashboard() {
  const [offers, setOffers] = useState([]);
  const [geo, setGeo] = useState(null);
  const token = localStorage.getItem('token');

  const initPush = async () => {
    const reg = await navigator.serviceWorker.ready;
    const { key } = await fetch('/api/push/vapid-key').then(r=>r.json());
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
    await fetch('/api/member/push/subscribe', {
        method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(sub)
    });
    alert("🔔 Notifications activées !");
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => {
        setGeo(pos.coords);
        fetch('/api/member/flash-offers/nearby', {
            method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }).then(r=>r.json()).then(setOffers);
    });
  }, []);

  const claim = async (id) => {
    const res = await fetch(`/api/member/flash-offers/${id}/claim`, { method: 'POST', headers: {'Authorization': `Bearer ${token}`} });
    const d = await res.json();
    if(d.success) { confetti(); alert(`✅ RÉSERVÉ ! Code: ${d.qr}`); window.location.reload(); }
    else alert("❌ " + d.error);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-24">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-black text-[#3D9A9A]">Offres Flash</h1>
        <button onClick={initPush} className="bg-white p-2 rounded-full shadow"><Bell/></button>
      </div>
      {!geo && <div className="text-center text-gray-400">📍 Recherche GPS...</div>}
      <div className="space-y-4">
        {offers.map(o => (
            <div key={o.id} className="bg-white rounded-2xl shadow-lg border-2 border-red-100 overflow-hidden relative">
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 absolute top-0 right-0 rounded-bl-xl">FLASH</div>
                <div className="p-5">
                    <h3 className="font-black text-xl">{o.partner}</h3>
                    <h4 className="text-lg font-bold mt-1">{o.title}</h4>
                    <div className="flex justify-between text-xs text-gray-500 mt-2 mb-4">
                        <span className="flex gap-1"><MapPin size={12}/> {o.dist} km</span>
                        <span className="text-red-500 font-bold"><Countdown date={o.end}/></span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="text-3xl font-black text-[#3D9A9A]">{o.discount}</div>
                        <button onClick={()=>claim(o.id)} className="bg-black text-white px-6 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition">JE PRENDS ({o.left})</button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
