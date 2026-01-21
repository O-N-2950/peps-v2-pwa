import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PartnerManagement() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('/api/admin/partners', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPartners(res.data.partners || []));
  }, []);

  const handleToggleActive = async (id, currentStatus) => {
    await axios.put(`/api/admin/partners/${id}`, { active: !currentStatus }, { headers: { Authorization: `Bearer ${token}` }});
    toast.success(currentStatus ? "Désactivé" : "Activé");
    setPartners(partners.map(p => p.id === id ? {...p, active: !currentStatus} : p));
  };

  const filtered = partners.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion Partenaires ({partners.length})</h2>
        <div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg w-80"/></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nom</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Catégorie</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ville</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
            </thead>
            <tbody>
                {filtered.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{p.name}</td>
                        <td className="px-6 py-4 text-gray-600">{p.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{p.city || 'N/A'}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${p.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {p.active ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                                {p.active ? 'Actif' : 'Inactif'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleToggleActive(p.id, p.active)} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                            <button className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
