import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    alert('Offre créée ! 🎉');
    setForm({ title: '', price: '', old_price: '', discount: '', stock: 5, description: '' });
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-peps-primary">Admin PEP's</h1>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-gray-400 hover:text-gray-600">
          <LogOut size={20} />
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <input type="text" placeholder="Titre de l'offre" className="w-full p-3 border rounded-lg" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <input type="text" placeholder="Prix (ex: 24.-)" className="w-full p-3 border rounded-lg" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
        <input type="text" placeholder="Ancien prix (ex: 48.-)" className="w-full p-3 border rounded-lg" value={form.old_price} onChange={e => setForm({...form, old_price: e.target.value})} />
        <input type="text" placeholder="Réduction (ex: -50%)" className="w-full p-3 border rounded-lg" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
        <input type="number" placeholder="Stock" className="w-full p-3 border rounded-lg" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
        
        <textarea placeholder="Description" className="w-full p-3 border rounded-lg" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3"></textarea>
        
        <button onClick={generateAI} className="w-full bg-peps-accent text-black font-bold p-3 rounded-lg flex items-center justify-center gap-2">
          <Sparkles size={16} /> Générer avec IA
        </button>
        
        <button onClick={submitOffer} className="w-full bg-peps-primary text-white font-bold p-3 rounded-lg">Créer l'offre</button>
      </div>
    </div>
  );
}

// --- HOME ---
function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/offers').then(res => res.json()).then(data => {
        setOffers(data);
        setLoading(false);
    }).catch(err => console.error(err));

    socket.on('stock_update', (data) => {
      setOffers(currentOffers => currentOffers.map(offer => 
        offer.id === data.id ? { ...offer, stock: data.new_stock } : offer
      ));
    });

    return () => socket.off('stock_update');
  }, []);

  const handleReserve = async (id) => {
    const res = await fetch(`/api/reserve/${id}`, { method: 'POST' });
    const data = await res.json();
    if(data.success) {
       alert("Réservation confirmée ! 🎉");
    } else {
       alert("Trop tard ! Stock épuisé.");
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative">
      <header className="px-5 pt-12 pb-4 bg-white shadow-sm z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">PEP's</h1>
          <p className="text-xs text-gray-500 flex items-center mt-0.5">
            <MapPin size={10} className="mr-1 text-peps-primary" /> Bienne, Centre
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-peps-light text-peps-dark flex items-center justify-center font-bold text-xs border border-peps-primary/20">ON</div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-24">
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
            <Zap size={14} className="text-peps-accent mr-1 fill-current" /> En direct (Live DB)
          </h2>
          
          {loading ? (
             <div className="text-center text-gray-400 text-xs py-10 animate-pulse">Connexion aux serveurs...</div>
          ) : (
          <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4">
            <AnimatePresence>
            {offers.filter(o => o.stock > 0).map((offer, i) => (
              <motion.div 
                key={offer.id}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="min-w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="h-32 bg-gray-200 relative">
                  <img src={offer.img} className="w-full h-full object-cover" alt={offer.partner} />
                  {offer.urgent && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">URGENT</span>}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded">{offer.dist}</div>
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-sm">{offer.partner}</h3>
                    <span className="text-peps-primary font-bold bg-peps-light px-1.5 py-0.5 rounded text-[10px]">{offer.discount}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{offer.title}</p>
                  <div className="mt-3 flex justify-between items-center">
                     <div>
                        <span className="font-bold text-base text-gray-900">{offer.price}</span>
                        <span className="text-xs text-gray-400 line-through ml-1">{offer.old}</span>
                        <div className="text-[10px] text-red-500 font-bold mt-1">Stock: {offer.stock}</div>
                     </div>
                     <button onClick={() => handleReserve(offer.id)} className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Réserver</button>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
          )}
        </div>
        
        {/* Section Favoris (Statique pour l'instant) */}
        <div>
           <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Vos Favoris</h2>
           <div className="bg-white p-4 rounded-xl text-center text-gray-400 text-xs border border-gray-100">
              <Link to="/login" className="text-peps-primary font-bold">Connectez-vous</Link> pour voir vos favoris
           </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe pt-2 px-6 shadow-2xl max-w-md mx-auto">
        <div className="flex justify-between items-center h-16">
          <NavIcon icon={HomeIcon} label="Accueil" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavIcon icon={MapPin} label="Carte" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <div className="w-8"></div>
          <NavIcon icon={Heart} label="Favoris" active={activeTab === 'fav'} onClick={() => setActiveTab('fav')} />
          <NavIcon icon={User} label="Profil" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <Link to="/login" className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 bg-gray-900 rounded-full shadow-lg shadow-gray-900/40 flex items-center justify-center text-white transform transition hover:scale-105 active:scale-95">
             <Zap size={24} fill="currentColor" className="text-yellow-400" />
          </Link>
        </div>
      </nav>
    </div>
  );
}

function NavIcon({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-12 transition-colors ${active ? 'text-peps-primary' : 'text-gray-300'}`}>
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[9px] font-medium mt-1">{label}</span>
    </button>
  );
}

// --- MAIN APP ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
