import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Zap, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function OfferManagement() {
  const [offers, setOffers] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('/api/admin/offers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOffers(res.data.offers || []));
  }, []);

  const handleDelete = async (id) => {
    if(!confirm("Supprimer ?")) return;
    await axios.delete(`/api/admin/offers/${id}`, { headers: { Authorization: `Bearer ${token}` }});
    toast.success("Supprimé");
    setOffers(offers.filter(o => o.id !== id));
  };

  return (
    <div>
      <Toaster />
      <h2 className="text-2xl font-bold mb-6">Offres Actives</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map(o => (
            <div key={o.id} className="bg-white p-5 rounded-xl shadow-sm border relative">
                <div className="flex justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${o.type === 'flash' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                        {o.type}
                    </span>
                    <button onClick={()=>handleDelete(o.id)}><Trash2 size={16} className="text-gray-400 hover:text-red-600"/></button>
                </div>
                <h3 className="font-bold text-lg">{o.title}</h3>
                <div className="mt-2 text-sm text-gray-500">{o.partner_name}</div>
            </div>
        ))}
      </div>
    </div>
  );
}
