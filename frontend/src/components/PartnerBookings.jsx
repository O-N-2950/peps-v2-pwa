import React, { useState, useEffect } from 'react';

export default function PartnerBookings() {
  const [list, setList] = useState([]);
  useEffect(() => {
    fetch('/api/partner/bookings', {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}})
      .then(r=>r.json()).then(setList);
  }, []);

  return (
    <div className="p-6 pb-24 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black mb-6">Agenda</h1>
      <div className="space-y-3">
        {list.map(b => (
            <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                    <div className="font-bold text-gray-900">{b.date} à {b.time}</div>
                    <div className="text-sm text-gray-600">{b.client}</div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded uppercase ${b.status==='confirmed'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{b.status}</div>
            </div>
        ))}
        {list.length === 0 && <div className="text-center text-gray-400">Aucune réservation.</div>}
      </div>
    </div>
  );
}
