import React, { useState } from 'react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    });
    const data = await res.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('is_both', data.is_both ? 'true' : 'false');
      
      // Redirection Intelligente V10
      if (data.role === 'admin') window.location.href = '/admin';
      else if (data.role === 'company_admin') window.location.href = '/company';
      else if (data.role === 'partner') window.location.href = '/partner'; 
      else window.location.href = '/'; 
    } else {
      alert("Erreur: " + (data.error || "Problème connexion"));
    }
  };

  const fill = (email, pass) => setForm({email, password: pass});

  return (
    <div className="min-h-screen flex flex-col justify-center p-8 bg-white">
      <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-[#3D9A9A] mb-2">Connexion</h1>
          <p className="text-gray-400 text-sm">Espace sécurisé PEP's</p>
      </div>
      
      <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto space-y-4">
        <input className="w-full p-4 bg-gray-50 rounded-xl border font-bold" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input className="w-full p-4 bg-gray-50 rounded-xl border font-bold" type="password" placeholder="Mot de passe" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <button className="w-full bg-black text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition">SE CONNECTER</button>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 w-full max-w-sm mx-auto">
        <p className="font-bold text-gray-900 text-xs uppercase mb-2 text-center">Comptes de Test V10 :</p>
        <div className="space-y-2 text-xs text-gray-600 font-mono">
            <div onClick={()=>fill('admin@peps.swiss','admin123')} className="flex justify-between cursor-pointer hover:text-[#3D9A9A]"><span>👑 Admin</span><span>admin@peps.swiss</span></div>
            <div onClick={()=>fill('partner@peps.swiss','123456')} className="flex justify-between cursor-pointer hover:text-[#3D9A9A]"><span>🏪 Partner</span><span>partner@peps.swiss</span></div>
            <div onClick={()=>fill('company@peps.swiss','123456')} className="flex justify-between cursor-pointer hover:text-[#3D9A9A]"><span>🏢 Company</span><span>company@peps.swiss</span></div>
            <div onClick={()=>fill('both@peps.swiss','123456')} className="flex justify-between cursor-pointer text-[#3D9A9A] font-bold bg-[#3D9A9A]/10 p-1 rounded"><span>🔄 Hybride</span><span>both@peps.swiss</span></div>
        </div>
      </div>
      
      <a href="/register" className="mt-6 block text-center text-sm font-bold text-gray-400 hover:text-[#3D9A9A]">Pas de compte ? S'inscrire</a>
    </div>
  );
}