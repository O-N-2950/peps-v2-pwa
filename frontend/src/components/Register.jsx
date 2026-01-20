import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', address: '', city: '', dob: '' });

  const submit = async (e) => {
      e.preventDefault();
      const res = await fetch('/api/register', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ...form, token: params.get('token') })
      });
      const d = await res.json();
      if(d.success) {
          localStorage.setItem('token', d.token);
          localStorage.setItem('role', d.role);
          window.location.href = '/';
      } else alert(d.error || "Erreur");
  };

  return (
      <div className="p-8 bg-white min-h-screen flex flex-col justify-center">
          <h1 className="text-3xl font-black text-[#3D9A9A] mb-6">Inscription Complète</h1>
          {params.get('token') && (
              <div className="bg-teal-50 border border-[#3D9A9A] rounded-xl p-4 mb-6 text-sm">
                  <p className="font-bold text-[#3D9A9A]">✨ Vous avez été invité à rejoindre un groupe !</p>
                  <p className="text-gray-600 mt-1">Complétez votre inscription pour activer votre accès.</p>
              </div>
          )}
          <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                  <input className="p-3 border rounded-xl" placeholder="Prénom" required onChange={e=>setForm({...form, first_name:e.target.value})}/>
                  <input className="p-3 border rounded-xl" placeholder="Nom" required onChange={e=>setForm({...form, last_name:e.target.value})}/>
              </div>
              <input className="w-full p-3 border rounded-xl" placeholder="Email" type="email" required onChange={e=>setForm({...form, email:e.target.value})}/>
              <input className="w-full p-3 border rounded-xl" placeholder="Mot de passe" type="password" required onChange={e=>setForm({...form, password:e.target.value})}/>
              
              <div className="text-xs font-bold text-gray-400 uppercase mt-4">Infos Légales</div>
              <input className="w-full p-3 border rounded-xl" placeholder="Adresse complète" required onChange={e=>setForm({...form, address:e.target.value})}/>
              <div className="grid grid-cols-2 gap-2">
                  <input className="p-3 border rounded-xl" placeholder="Ville" required onChange={e=>setForm({...form, city:e.target.value})}/>
                  <input className="p-3 border rounded-xl" type="date" required onChange={e=>setForm({...form, dob:e.target.value})}/>
              </div>
              <button className="w-full bg-black text-white py-4 rounded-xl font-bold mt-4">VALIDER</button>
          </form>
          <Link to="/login" className="mt-8 text-center block text-sm font-bold text-gray-400">Déjà un compte ? Connexion</Link>
      </div>
  );
}
