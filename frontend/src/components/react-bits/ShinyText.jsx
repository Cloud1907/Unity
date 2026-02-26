import React from 'react';
import { motion } from 'framer-motion';

const ShinyText = ({ 
  text, 
  className = '',
  shimmerWidth = '100px',
  shimmerColor = 'rgba(255, 255, 255, 0.3)',
  duration = 3
}) => {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{
        background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
        backgroundSize: `${shimmerWidth} 100%`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '-${shimmerWidth} 0',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
      }}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
