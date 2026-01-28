import { motion } from 'framer-motion';

/**
 * Composant PageTransition
 * 
 * Ajoute des transitions fluides entre les pages (style iOS/Android)
 * 
 * Utilisation :
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 */

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: -20,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
