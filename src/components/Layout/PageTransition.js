import { motion, useReducedMotion } from 'framer-motion';
export default function PageTransition({ children }) {
  const reduced = useReducedMotion();
  return <motion.div initial={false} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.15 }}>{children}</motion.div>;
}
