import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  // Génération Device ID stable (sans npm install pour la stabilité)
  const getDeviceId = () => {
    let id = localStorage.getItem('device_id');
    if (!id) {
        // ID unique aléatoire persistant
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem('device_id', id);
    }
    return id;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, device_id: getDeviceId() }) // On envoie l'ID
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      if (data.role === 'company_admin') navigate('/company');
      else if (data.role === 'partner') navigate('/partner');
      else navigate('/');
    } else {
      alert("Erreur: " + data.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-8 bg-white">
      <h1 className="text-3xl font-black text-center mb-6 text-peps-primary">Connexion</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100" type="password" placeholder="Mot de passe" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <button className="w-full bg-black text-white p-4 rounded-xl font-bold">ENTRER</button>
      </form>
      <Link to="/register" className="mt-4 block text-center text-sm text-gray-500">Pas de compte ? S'inscrire</Link>
    </div>
  );
}
