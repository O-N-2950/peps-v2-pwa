import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Zap, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PartnerDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch('/api/partner/my-stats', {headers}).then(r => r.json()),
      fetch('/api/partner/followers-evolution', {headers}).then(r => r.json()),
      fetch('/api/partner/growth-suggestions', {headers}).then(r => r.json())
    ]).then(([s, c, g]) => {
      setStats(s);
      setChartData(c.labels.map((l, i) => ({name: l, val: c.data[i]})));
      setSuggestions(g.suggestions || []);
      setLoading(false);
    });
  }, []);

  if(loading) return <div className="p-10 text-center animate-pulse">Chargement Intelligence...</div>;

  return (
    <div className="p-6 pb-24 max-w-xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
         <LayoutDashboard className="text-peps-turquoise"/> {stats.name}
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-peps-turquoise">
            <div className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1"><Users size={14}/> Followers</div>
            <div className="text-4xl font-black text-gray-900 mt-1">{stats.followers_count}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-peps-pink">
            <div className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1"><TrendingUp size={14}/> Score</div>
            <div className="text-4xl font-black text-gray-900 mt-1">{stats.engagement_score}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 h-64">
        <h3 className="font-bold text-sm mb-4">Croissance Audience (7j)</h3>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="val" stroke="#3D9A9A" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
            </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="font-black text-lg mb-3 flex items-center gap-2"><Sparkles className="text-yellow-500 fill-current"/> Coach IA</h3>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
            <motion.div key={i} initial={{x:-10, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:i*0.1}} 
                className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${s.priority===1?'border-red-500':'border-green-500'}`}>
                <h4 className="font-bold text-sm flex items-center gap-2">{s.icon} {s.action}</h4>
                <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
            </motion.div>
        ))}
      </div>
    </div>
  );
}