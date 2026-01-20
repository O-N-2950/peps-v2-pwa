import React, { useState, useEffect } from 'react';
export default function AdminDashboardV20() {
  const [stats, setStats] = useState(null);
  useEffect(() => { fetch('/api/admin/stats_v20', {headers:{'Authorization':`Bearer ${localStorage.getItem('token')}`}}).then(r=>r.json()).then(setStats); }, []);
  if(!stats) return <div>...</div>;
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-black mb-8">Admin Global</h1>
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-red-500">
                <div className="text-xs font-bold uppercase">MRR Suisse</div>
                <div className="text-3xl font-black">{stats.mrr_chf} CHF</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                <div className="text-xs font-bold uppercase">MRR Europe</div>
                <div className="text-3xl font-black">{stats.mrr_eur} EUR</div>
            </div>
        </div>
    </div>
  );
}
