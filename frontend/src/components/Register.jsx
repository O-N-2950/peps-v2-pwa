import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gift } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', referral_code: '', role: 'member' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      alert(data.message); // Affiche le bonus
      navigate('/');
    } else {
      alert("Erreur: " + data.error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center p-8">
       <h1 className="text-4xl font-black text-center mb-2 text-peps-primary">Inscription</h1>
       <p className="text-center text-gray-400 mb-8">Rejoignez le club PEP's</p>
       
       <form onSubmit={handleRegister} className="space-y-4">
          <input 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none border border-gray-100" 
            placeholder="Email" 
            type="email" 
            required
            value={form.email} 
            onChange={e=>setForm({...form, email: e.target.value})} 
          />
          <input 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none border border-gray-100" 
            type="password" 
            placeholder="Mot de passe" 
            required
            value={form.password} 
            onChange={e=>setForm({...form, password: e.target.value})} 
          />
          
          <div className="relative">
             <div className="absolute left-4 top-4 text-peps-accent"><Gift size={20}/></div>
             <input 
                className="w-full p-4 pl-12 bg-peps-light/30 border-2 border-dashed border-peps-primary/30 rounded-xl outline-none text-peps-dark font-mono uppercase" 
                placeholder="Code Parrain (Optionnel)" 
                value={form.referral_code} 
                onChange={e=>setForm({...form, referral_code: e.target.value})} 
             />
          </div>
          <p className="text-xs text-center text-gray-400">Code parrain ? Vous gagnez +1 mois gratuit !</p>

          <div className="flex justify-center gap-4 mt-2">
            <label className="text-xs font-bold flex gap-1"><input type="radio" checked={form.role === 'member'} onChange={()=>setForm({...form, role:'member'})}/> Membre</label>
            <label className="text-xs font-bold flex gap-1"><input type="radio" checked={form.role === 'partner'} onChange={()=>setForm({...form, role:'partner'})}/> Partenaire</label>
          </div>

          <button className="w-full bg-black text-white font-bold p-4 rounded-xl shadow-xl hover:scale-[1.02] transition-transform">
            CRÉER MON COMPTE
          </button>
       </form>
       
       <Link to="/login" className="mt-8 text-center block text-sm font-bold text-gray-400">
         Déjà membre ? Se connecter
       </Link>
    </div>
  );
}
