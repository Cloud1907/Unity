import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SplitText = ({ 
  text, 
  className = '', 
  delay = 0.05,
  duration = 0.5,
  staggerChildren = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const words = text.split(' ');

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: staggerChildren ? delay : 0, 
        delayChildren: 0
      },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
    },
  };

  return (
    <motion.span
      style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em' }}
      variants={container}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          style={{ display: 'inline-block' }}
          variants={child}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default SplitText;
