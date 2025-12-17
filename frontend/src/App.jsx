import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// CORRECTION : On renomme l'icône Home en HomeIcon pour éviter le conflit avec la page Home
import { MapPin, Home as HomeIcon, Heart, User, Zap, Plus, Settings, Sparkles, LogOut } from 'lucide-react';
import io from 'socket.io-client';

const socket = io();

// --- LOGIN ---
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      navigate('/admin');
    } else {
      alert('Erreur: ' + data.error);
    }
  };

  return (
    <div className="p-8 flex flex-col justify-center h-screen bg-white">
      <h1 className="text-2xl font-bold mb-6 text-center text-peps-primary">Connexion PEP's</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg bg-gray-50" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Mot de passe" className="w-full p-3 border rounded-lg bg-gray-50" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="w-full bg-peps-primary text-white font-bold p-3 rounded-lg shadow-lg">Se connecter</button>
      </form>
      <div className="mt-6 text-center text-xs text-gray-400 bg-gray-100 p-3 rounded">
        <p>Compte de Démo :</p>
        <p className="font-mono text-gray-600">admin@peps.swiss / admin123</p>
      </div>
      <Link to="/" className="block mt-4 text-center text-gray-400 text-sm">Retour à l'accueil</Link>
    </div>
  );
}

// --- ADMIN ---
function Admin() {
  const [form, setForm] = useState({ title: '', price: '', old_price: '', discount: '', stock: 5, description: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => { if (!token) navigate('/login'); }, [token]);

  const generateAI = async () => {
    if (!form.title) return alert("Entrez d'abord un titre !");
    const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ context: form.title })
    });
    const data = await res.json();
    setForm({ ...form, description: data.text });
  };

  const submitOffer = async () => {
    await fetch('/api/admin/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    alert('Offre créée !');
    navigate('/');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-red-500"><LogOut size={20}/></button>
      </div>
      <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
        <h2 className="font-bold text-peps-primary flex items-center"><Plus size={16} className="mr-2"/> Nouvelle Offre Flash</h2>
        <input className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Titre (ex: Table 2 pers)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <div className="flex gap-2">
            <textarea className="w-full p-3 border rounded-xl bg-gray-50 h-24 text-sm" placeholder="Description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <button onClick={generateAI} className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-2 rounded-xl flex flex-col items-center justify-center w-24 text-xs font-bold shadow-lg shadow-purple-200"><Sparkles size={20} className="mb-1" /> IA</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <input className="p-3 border rounded-xl bg-gray-50" placeholder="Prix (24.-)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            <input className="p-3 border rounded-xl bg-gray-50" placeholder="Ancien (48.-)" value={form.old_price} onChange={e => setForm({...form, old_price: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <input className="p-3 border rounded-xl bg-gray-50" placeholder="Remise (-50%)" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
            <input className="p-3 border rounded-xl bg-gray-50" type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} />
        </div>
        <button onClick={submitOffer} className="w-full bg-black text-white font-bold p-4 rounded-xl shadow-lg active:scale-95 transition-transform">Publier</button>
      </div>
    </div>
  );
}

// --- HOME ---
function Home() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/offers').then(res => res.json()).then(data => { setOffers(data); setLoading(false); });
    socket.on('stock_update', (data) => {
      setOffers(current => current.map(o => o.id === data.id ? { ...o, stock: data.new_stock } : o));
    });
    return () => socket.off('stock_update');
  }, []);

  const handleReserve = async (id) => {
    const res = await fetch(`/api/reserve/${id}`, { method: 'POST' });
    const data = await res.json();
    if(data.success) alert("✅ Réservation confirmée !"); else alert("❌ Stock épuisé !");
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative">
      <header className="px-5 pt-12 pb-4 bg-white shadow-sm z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">PEP's</h1>
          <p className="text-xs text-gray-500 flex items-center mt-0.5"><MapPin size={10} className="mr-1 text-peps-primary" /> Bienne, Centre</p>
        </div>
        <Link to="/login" className="w-9 h-9 rounded-full bg-peps-light text-peps-dark flex items-center justify-center font-bold text-xs border border-peps-primary/20"><User size={16} /></Link>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-24">
        {loading ? <div className="text-center py-10 animate-pulse text-xs text-gray-400">Chargement...</div> : (
          <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4">
            <AnimatePresence>
            {offers.filter(o => o.stock > 0).map((offer) => (
              <motion.div key={offer.id} layout initial={{opacity:0, x:50}} animate={{opacity:1, x:0}} exit={{opacity:0, scale:0.8}} className="min-w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gray-200 relative">
                  <img src={offer.img} className="w-full h-full object-cover" alt="" />
                  {offer.urgent && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">URGENT</span>}
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-sm">{offer.partner}</h3>
                    <span className="text-peps-primary font-bold bg-peps-light px-1.5 py-0.5 rounded text-[10px]">{offer.discount}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{offer.title}</p>
                  {offer.description && <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">{offer.description}</p>}
                  <div className="mt-3 flex justify-between items-center">
                     <div><span className="font-bold text-base text-gray-900">{offer.price}</span><span className="text-xs text-gray-400 line-through ml-1">{offer.old}</span><div className="text-[10px] text-red-500 font-bold mt-1">Stock: {offer.stock}</div></div>
                     <button onClick={() => handleReserve(offer.id)} className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95">Réserver</button>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe pt-2 px-6 shadow-2xl max-w-md mx-auto">
        <div className="flex justify-between items-center h-16">
          <NavIcon icon={HomeIcon} label="Accueil" active={true} />
          <NavIcon icon={MapPin} label="Carte" />
          <div className="w-8"></div>
          <NavIcon icon={Heart} label="Favoris" />
          <Link to="/admin"><NavIcon icon={Settings} label="Admin" /></Link>
          <button className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 bg-gray-900 rounded-full shadow-lg shadow-gray-900/40 flex items-center justify-center text-white"><Zap size={24} fill="currentColor" className="text-yellow-400" /></button>
        </div>
      </nav>
    </div>
  );
}
// Utilisation de HomeIcon pour l'icône dans la barre de navigation
function NavIcon({ icon: Icon, label, active }) { return <div className={`flex flex-col items-center justify-center w-12 ${active ? 'text-peps-primary' : 'text-gray-300'}`}><Icon size={22} /><span className="text-[9px] font-medium mt-1">{label}</span></div>; }

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
