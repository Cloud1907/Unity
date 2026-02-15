import React, { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

const CountUp = ({ to, prefix = '', suffix = '', duration = 1.5, className, play = true }) => {
  const nodeRef = useRef();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !play) return; // Wait for play signal

    // Start from 0
    const controls = animate(0, to, {
      duration: duration,
      onUpdate(value) {
        node.textContent = `${prefix}${Math.round(value)}${suffix}`;
      },
      ease: "easeOut"
    });

    return () => controls.stop();
  }, [play, to, prefix, suffix, duration]);

  return <span ref={nodeRef} className={className} />; // Use passed className
};

export default CountUp;
