import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const GreetingAnimation = React.memo(({ text }) => {
  const [start, setStart] = useState(false);

  useEffect(() => {
    // Force a small delay to ensure DOM is ready and browser "sees" the initial state
    const timer = setTimeout(() => setStart(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      className="flex items-center gap-2"
      initial="hidden"
      animate={start ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: 0.15 } },
        hidden: {}
      }}
    >
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
            visible: { 
              opacity: 1, 
              y: 0, 
              filter: 'blur(0px)',
              transition: { duration: 0.6, ease: "easeOut" } 
            }
          }}
        >
          {word}
        </motion.span>
      ))}
      <motion.div
        variants={{
          hidden: { scale: 0, opacity: 0, rotate: -90 },
          visible: { 
            scale: 1, 
            opacity: 1, 
            rotate: 0,
            transition: { type: "spring", stiffness: 200, damping: 10 }
          }
        }}
      >
        <Sparkles className="text-amber-400 fill-amber-300" size={24} />
      </motion.div>
    </motion.div>
  );
});

export default GreetingAnimation;

