import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const CircularGallery = ({ items = [], radius = 300, onClickItem }) => {
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef(null);
  
  const rotateX = useSpring(useMotionValue(0), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 100, damping: 30 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    rotateY.set(x / 10);
    rotateX.set(-y / 10);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  if (!items || items.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[400px] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ perspective: '1000px' }}
    >
      <motion.div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ 
          rotateX, 
          rotateY, 
          transformStyle: 'preserve-3d' 
        }}
      >
        {items.map((item, index) => {
          const angle = (index / items.length) * Math.PI * 2;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          
          return (
            <motion.div
              key={item.id || index}
              className="absolute w-48 h-32 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl p-4 flex flex-col justify-between cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden group"
              style={{
                x,
                z,
                rotateY: `${(angle * 180) / Math.PI}deg`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
              }}
              whileHover={{ scale: 1.1, z: z + 50 }}
              onClick={() => onClickItem?.(item)}
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-indigo-500"></div>
              </div>
              <div className="relative">
                <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">{item.projectName || 'Proje'}</p>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                  {item.title}
                </h4>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[9px] text-slate-400 font-medium">#{item.id}</span>
                <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded uppercase">
                  Bitti
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default CircularGallery;
