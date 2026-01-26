import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallFAB({ onOpenGuide }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si la PWA est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
      return;
    }

    // Vérifier si l'utilisateur a déjà dismissé le FAB
    const dismissed = localStorage.getItem('pwa_fab_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Stratégie de déclenchement progressive selon Gemini
    const sessionCount = parseInt(localStorage.getItem('pwa_session_count') || '0');
    const pageViews = parseInt(sessionStorage.getItem('pwa_page_views') || '0');
    
    // Incrémenter les compteurs
    sessionStorage.setItem('pwa_page_views', (pageViews + 1).toString());
    
    if (sessionCount === 0) {
      localStorage.setItem('pwa_session_count', '1');
    }

    // Afficher le FAB après engagement (2ème session OU 3+ pages vues)
    if (sessionCount >= 2 || pageViews >= 3) {
      setTimeout(() => setIsVisible(true), 2000); // Délai de 2s pour ne pas être intrusif
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa_fab_dismissed', 'true');
  };

  const handleInstallClick = () => {
    // Incrémenter le compteur de sessions pour la prochaine visite
    const sessionCount = parseInt(localStorage.getItem('pwa_session_count') || '0');
    localStorage.setItem('pwa_session_count', (sessionCount + 1).toString());
    
    onOpenGuide();
  };

  if (isPWAInstalled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 group"
        >
          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] text-white px-4 py-2 rounded-full shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          >
            <span className="font-semibold">Installer l'Application</span>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#F26D7D]" />
          </motion.div>

          {/* FAB Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstallClick}
            className="relative bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-shadow"
          >
            <Smartphone size={28} className="animate-pulse" />
            
            {/* Badge "Nouveau" */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
            >
              NEW
            </motion.div>
          </motion.button>

          {/* Bouton de fermeture */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={handleDismiss}
            className="absolute -top-2 -left-2 bg-gray-800 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors shadow-lg"
          >
            <X size={14} />
          </motion.button>

          {/* Animation de pulsation */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] rounded-full -z-10"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
