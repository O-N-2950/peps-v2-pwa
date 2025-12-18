import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AiButton({ onClick, loading }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={loading}
      className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-indigo-500/30 w-full group disabled:opacity-70"
    >
      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-300 fill-current" />}
      <span>{loading ? 'Rédaction...' : '✨ Magic Writer'}</span>
    </motion.button>
  );
}
