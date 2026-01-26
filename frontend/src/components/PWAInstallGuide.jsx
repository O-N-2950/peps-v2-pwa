import { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Download, Share, Home, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallGuide({ isOpen, onClose }) {
  const [device, setDevice] = useState('desktop');
  const [browser, setBrowser] = useState('chrome');
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Détecter le device et le navigateur
    const ua = navigator.userAgent;
    
    // Détection device
    if (/iPhone|iPad|iPod/.test(ua)) {
      setDevice('ios');
      setBrowser('safari');
    } else if (/Android/.test(ua)) {
      setDevice('android');
      setBrowser('chrome');
    } else {
      setDevice('desktop');
    }

    // Détection browser
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      setBrowser('safari');
    } else if (/Firefox/.test(ua)) {
      setBrowser('firefox');
    } else if (/Edg/.test(ua)) {
      setBrowser('edge');
    } else {
      setBrowser('chrome');
    }
  }, []);

  const getInstructions = () => {
    if (device === 'ios') {
      return [
        {
          icon: <Share size={40} className="text-blue-500" />,
          title: "1. Appuyez sur le bouton Partager",
          description: "En bas de votre écran Safari, appuyez sur l'icône de partage (carré avec flèche vers le haut)"
        },
        {
          icon: <Home size={40} className="text-green-500" />,
          title: "2. Sélectionnez 'Sur l'écran d'accueil'",
          description: "Faites défiler et appuyez sur 'Sur l'écran d'accueil' dans le menu"
        },
        {
          icon: <CheckCircle size={40} className="text-purple-500" />,
          title: "3. Confirmez l'ajout",
          description: "Appuyez sur 'Ajouter' en haut à droite. L'icône PEP'S apparaîtra sur votre écran d'accueil !"
        }
      ];
    } else if (device === 'android') {
      return [
        {
          icon: <Download size={40} className="text-blue-500" />,
          title: "1. Ouvrez le menu",
          description: "Appuyez sur les trois points verticaux en haut à droite de Chrome"
        },
        {
          icon: <Home size={40} className="text-green-500" />,
          title: "2. Sélectionnez 'Installer l'application'",
          description: "Appuyez sur 'Installer l'application' ou 'Ajouter à l'écran d'accueil'"
        },
        {
          icon: <CheckCircle size={40} className="text-purple-500" />,
          title: "3. Confirmez l'installation",
          description: "Appuyez sur 'Installer'. L'icône PEP'S apparaîtra sur votre écran d'accueil !"
        }
      ];
    } else {
      return [
        {
          icon: <Download size={40} className="text-blue-500" />,
          title: "1. Cliquez sur l'icône d'installation",
          description: "Dans la barre d'adresse, cliquez sur l'icône d'installation (ordinateur avec flèche)"
        },
        {
          icon: <Monitor size={40} className="text-green-500" />,
          title: "2. Confirmez l'installation",
          description: "Cliquez sur 'Installer' dans la popup qui apparaît"
        },
        {
          icon: <CheckCircle size={40} className="text-purple-500" />,
          title: "3. Lancez PEP'S",
          description: "L'application s'ouvrira automatiquement et sera accessible depuis votre bureau ou menu démarrer !"
        }
      ];
    }
  };

  const instructions = getInstructions();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl bg-white rounded-3xl shadow-2xl z-[9999] overflow-hidden"
          >
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] text-white p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4">
                {device === 'ios' ? <Smartphone size={48} /> : device === 'android' ? <Smartphone size={48} /> : <Monitor size={48} />}
                <div>
                  <h2 className="text-3xl font-bold">Installez PEP'S sur votre appareil</h2>
                  <p className="text-sm opacity-90 mt-1">
                    Accès instantané à tous vos privilèges, même hors ligne !
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-8">
                {instructions.map((_, index) => (
                  <div key={index} className="flex items-center flex-1">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ 
                        scale: step >= index + 1 ? 1 : 0.8,
                        backgroundColor: step >= index + 1 ? '#38B2AC' : '#E5E7EB'
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    >
                      {index + 1}
                    </motion.div>
                    {index < instructions.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: step > index + 1 ? 1 : 0 }}
                        className="flex-1 h-1 bg-[#38B2AC] mx-2 origin-left"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="space-y-6">
                {instructions.map((instruction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className={`flex gap-4 p-6 rounded-2xl transition-all ${
                      step === index + 1 
                        ? 'bg-gradient-to-r from-[#38B2AC]/10 to-[#F26D7D]/10 border-2 border-[#38B2AC] shadow-lg' 
                        : 'bg-gray-50'
                    }`}
                    onClick={() => setStep(index + 1)}
                  >
                    <div className="flex-shrink-0">
                      {instruction.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {instruction.title}
                      </h3>
                      <p className="text-gray-600">
                        {instruction.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6"
              >
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  ✨ Pourquoi installer PEP'S ?
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span><strong>Accès instantané</strong> : Lancez PEP'S en un clic depuis votre écran d'accueil</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span><strong>Fonctionne hors ligne</strong> : Consultez vos privilèges même sans connexion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span><strong>Notifications</strong> : Recevez des alertes pour les nouveaux privilèges près de vous</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span><strong>Expérience native</strong> : Interface fluide comme une vraie application</span>
                  </li>
                </ul>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={onClose}
                className="w-full mt-6 bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] text-white py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg"
              >
                J'ai compris, installer maintenant ! 🚀
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
