import React, { useState } from 'react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (data.token) {
        // 1. Stockage des infos critiques
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        
        // Gestion du cas hybride (V10)
        if (data.is_both) localStorage.setItem('is_both', 'true');
        else localStorage.removeItem('is_both');
        
        // 2. REDIRECTION STRICTE SELON LE RÔLE (Le Bug était ici)
        switch(data.role) {
            case 'admin':
                window.location.href = '/admin';
                break;
            case 'partner':
                window.location.href = '/partner';
                break;
            case 'company_admin':
                window.location.href = '/company';
                break;
            case 'member':
            default:
                window.location.href = '/'; // Dashboard Membre par défaut
                break;
        }
      } else {
        setError(data.error || "Erreur de connexion");
      }
    } catch (err) {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const fill = (email, pass) => setForm({email, password: pass});

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-black text-center mb-6 text-[#3D9A9A]">Connexion</h1>
        <p className="text-xs text-gray-400 text-center mb-6">Espace sécurisé PEP's</p>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-xs font-bold rounded text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            className="w-full p-4 bg-gray-50 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-[#3D9A9A]" 
            placeholder="Email" 
            type="text"
            value={form.email} 
            onChange={e=>setForm({...form, email:e.target.value})} 
          />
          <input 
            className="w-full p-4 bg-gray-50 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-[#3D9A9A]" 
            type="password" 
            placeholder="Mot de passe" 
            value={form.password} 
            onChange={e=>setForm({...form, password:e.target.value})} 
          />
          <button disabled={loading} className="w-full bg-black text-white p-4 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50">
            {loading ? '...' : 'SE CONNECTER'}
          </button>
        </form>

        {/* Comptes de Test */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 font-mono space-y-2">
            <p className="font-bold text-center mb-2 text-gray-800">COMPTES DE TEST V10 :</p>
            <div onClick={()=>fill('admin@peps.swiss','123456')} className="cursor-pointer hover:text-[#3D9A9A] flex justify-between"><span>👑 Admin</span><span>admin@peps.swiss</span></div>
            <div onClick={()=>fill('partner@peps.swiss','123456')} className="cursor-pointer hover:text-[#3D9A9A] flex justify-between"><span>🏪 Partner</span><span>partner@peps.swiss</span></div>
            <div onClick={()=>fill('company@peps.swiss','123456')} className="cursor-pointer hover:text-[#3D9A9A] flex justify-between"><span>🏢 Company</span><span>company@peps.swiss</span></div>
            <div onClick={()=>fill('both@peps.swiss','123456')} className="cursor-pointer hover:text-[#3D9A9A] flex justify-between"><span>🔄 Hybride</span><span>both@peps.swiss</span></div>
        </div>

        <div className="mt-6 text-center">
          <a href="/register" className="text-xs text-gray-400 hover:text-[#3D9A9A]">Pas de compte ? S'inscrire</a>
        </div>
      </div>
    </div>
  );
}
