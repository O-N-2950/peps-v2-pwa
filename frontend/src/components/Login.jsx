import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        
        // Redirection selon le rôle
        if (data.role === 'partner') navigate('/partner');
        else if (data.role === 'company_admin') navigate('/company');
        else if (data.role === 'super_admin') navigate('/admin');
        else navigate('/');
      } else {
        alert('Login échoué !');
      }
    } catch (err) {
      alert('Erreur réseau');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-peps-primary to-peps-secondary p-6">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-gray-900 mb-2 text-center">PEP's</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Connexion Partenaire</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-peps-primary"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-peps-primary"
            required
          />
          <button
            type="submit"
            className="w-full bg-peps-primary text-white font-bold p-4 rounded-xl shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> SE CONNECTER
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-600">
          <p className="font-bold mb-2">Comptes de démo :</p>
          <p>👤 Partner: partner@peps.swiss / partner123</p>
          <p>🏢 Company: company@peps.swiss / company123</p>
          <p>👥 Member: member@peps.swiss / member123</p>
        </div>
      </div>
    </div>
  );
}
