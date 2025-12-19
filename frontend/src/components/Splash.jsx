import React from 'react';
import { motion } from 'framer-motion';

export default function Splash() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
       <motion.img src="/logo.jpg" initial={{scale:0}} animate={{scale:1}} className="w-32" />
       <motion.div initial={{width:0}} animate={{width:100}} className="h-1 bg-peps-turquoise mt-4 rounded-full" />
       <p className="mt-2 text-xs font-bold text-peps-turquoise tracking-widest">LOADING WORLD</p>
    </div>
  );
}
