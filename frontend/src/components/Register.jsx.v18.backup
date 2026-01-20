import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Store, Layers } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', role: 'member' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('is_both', data.is_both ? 'true' : 'false');
      
      if (data.role === 'partner') navigate('/partner');
      else navigate('/');
    } else { alert("Erreur: " + data.error); }
  };

  const Option = ({ id, icon: Icon, title, desc }) => (
    <div onClick={() => setForm({...form, role: id})}
         className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${form.role === id ? 'border-[#3D9A9A] bg-teal-50' : 'border-gray-100 hover:border-gray-300'}`}>
      <div className={`p-2 rounded-full ${form.role === id ? 'bg-[#3D9A9A] text-white' : 'bg-gray-200 text-gray-500'}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="font-bold text-sm text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 leading-tight">{desc}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center p-6">
       <h1 className="text-3xl font-black text-center mb-2 text-[#3D9A9A]">Créer un compte</h1>
       <p className="text-center text-gray-400 mb-8 text-sm">Rejoignez la communauté PEP's</p>
       
       <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto w-full">
          <div className="space-y-3 mb-6">
            <Option id="member" icon={User} title="Membre" desc="Je veux profiter des offres" />
            <Option id="partner" icon={Store} title="Partenaire" desc="Je suis un commerçant" />
            <Option id="both" icon={Layers} title="Partenaire + Membre" desc="Je suis commerçant ET je veux profiter des offres" />
          </div>

          <input className="w-full p-4 bg-gray-50 rounded-xl border outline-none" placeholder="Email" type="email" required value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
          <input className="w-full p-4 bg-gray-50 rounded-xl border outline-none" type="password" placeholder="Mot de passe" required value={form.password} onChange={e=>setForm({...form, password: e.target.value})} />
          
          <button className="w-full bg-black text-white font-bold p-4 rounded-xl shadow-xl hover:scale-[1.02] transition-transform">
            CRÉER MON COMPTE
          </button>
       </form>
       
       <Link to="/login" className="mt-8 text-center block text-sm font-bold text-gray-400">Déjà un compte ? Connexion</Link>
    </div>
  );
}