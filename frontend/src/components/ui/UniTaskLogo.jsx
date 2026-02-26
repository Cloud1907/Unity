import React, { useState, useEffect } from 'react';
import BlurText from '../react-bits/BlurText';

/**
 * UniTask Grid-Mark Logo
 * Based on the official unitask-logo-transparent.html design.
 *
 * Props:
 *   size    – 'xs'|'sm'|'md'|'lg'|'xl'  (default 'md')
 *   variant – 'mark'|'full'|'full-dark'  (default 'mark')
 *   className – extra class on wrapper
 */

const SIZES = {
  xs: { cell: 11, gap: 2, radius: 3, checkStroke: 3.2 },
  sm: { cell: 16, gap: 3, radius: 4, checkStroke: 3 },
  md: { cell: 22, gap: 4, radius: 6, checkStroke: 2.8 },
  lg: { cell: 30, gap: 5, radius: 8, checkStroke: 2.6 },
  xl: { cell: 38, gap: 6, radius: 10, checkStroke: 2.6 },
};

const COLORS = {
  g1: '#5B35F5',
  g2: '#9B7BFF',
  g3: '#C4B0FF',
  g4: '#5B35F5',
};

const GridMark = ({ size = 'md' }) => {
  const s = SIZES[size];
  const cell = s.cell;
  const gap = s.gap;
  const r = s.radius;
  const totalSize = cell * 2 + gap;
  const ck = s.checkStroke;

  // checkmark path scaled to cell
  const checkPath = `M ${cell * 0.14} ${cell * 0.52} L ${cell * 0.41} ${cell * 0.82} L ${cell * 0.9} ${cell * 0.19}`;

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="UniTask logo mark"
    >
      {/* Top-left: deep purple */}
      <rect x={0} y={0} width={cell} height={cell} rx={r} fill={COLORS.g1} />
      {/* Top-right: medium purple */}
      <rect x={cell + gap} y={0} width={cell} height={cell} rx={r} fill={COLORS.g2} />
      {/* Bottom-left: lavender */}
      <rect x={0} y={cell + gap} width={cell} height={cell} rx={r} fill={COLORS.g3} />
      {/* Bottom-right: deep purple with checkmark */}
      <rect x={cell + gap} y={cell + gap} width={cell} height={cell} rx={r} fill={COLORS.g4} />
      <path
        d={checkPath}
        stroke="white"
        strokeWidth={ck}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${cell + gap}, ${cell + gap})`}
      />
    </svg>
  );
};

const UniTaskLogo = ({ 
  size = 'md', 
  variant = 'mark', 
  className = '', 
  hideTagline = false,
  withAnimation = false 
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!withAnimation) return;
    // Restart the animation every 5 seconds
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [withAnimation]);

  if (variant === 'mark') {
    return (
      <div className={className}>
        <GridMark size={size} />
      </div>
    );
  }

  // fontSize relative to cell size
  const s = SIZES[size];
  const fontSize = Math.round(s.cell * 1.45);
  
  let uniColor = "text-[#0E0C22]";
  let taskColor = "text-[#5B35F5]";

  if (variant === 'full-dark') {
    uniColor = "text-white";
    taskColor = "text-[#9B7BFF]";
  } else if (variant === 'sidebar') {
    // Sadece sidebar'da (ve CSS tabanlı dark modda) "Uni" beyaz olacak
    uniColor = "text-[#0E0C22] dark:text-white";
    // Task kısmı da dark modda belirgin bir mora geçsin
    taskColor = "text-[#5B35F5] dark:text-[#9B7BFF]";
  }

  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
      <GridMark size={size} />
      <div className="flex flex-col items-start leading-none" key={withAnimation ? animationKey : 'static'}>
        <div
          className="flex flex-row items-center"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginLeft: '-1px', // Counteract character overhang for perfect alignment
          }}
        >
          {withAnimation ? (
            <>
              <BlurText 
                text="Uni" 
                delay={50} 
                animateBy="letters" 
                className={uniColor} 
              />
              <div style={{ marginLeft: '0.04em' }}>
                <BlurText 
                  text="Task" 
                  delay={50} 
                  delayOffset={3} 
                  animateBy="letters" 
                  className={taskColor}
                />
              </div>
            </>
          ) : (
            <span className="flex items-center">
              <span className={uniColor}>Uni</span>
              <span className={taskColor} style={{ marginLeft: '0.04em' }}>Task</span>
            </span>
          )}
        </div>
        {!hideTagline && (
          <span 
            className={`${(variant === 'full-dark' || variant === 'sidebar') ? "text-slate-400 dark:text-slate-400" : "text-slate-500 dark:text-slate-400"} font-semibold`}
            style={{ 
              fontSize: `${Math.max(fontSize * 0.28, 7.5)}px`,
              letterSpacing: '0'
            }}
          >
            Univera Task Management
          </span>
        )}
      </div>
    </div>
  );
};

export { GridMark };
export default UniTaskLogo;
