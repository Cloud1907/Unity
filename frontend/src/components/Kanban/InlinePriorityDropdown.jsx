import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PRIORITY_CONFIG } from './constants';

// Inline Priority Dropdown with Portal
const InlinePriorityDropdown = ({ currentPriority, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = 140;
      const popoverHeight = 200;
      let top = rect.bottom + 4;
      let left = rect.left;
      if (top + popoverHeight > viewportHeight) top = Math.max(8, rect.top - popoverHeight - 8);
      if (left + popoverWidth > viewportWidth) left = Math.max(8, viewportWidth - popoverWidth - 12);
      setPosition({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentConfig = PRIORITY_CONFIG[currentPriority] || PRIORITY_CONFIG.medium;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="px-2 py-0.5 rounded text-xs font-bold transition-all hover:scale-105"
        style={{
          backgroundColor: `${currentConfig.color}15`,
          color: currentConfig.color,
          border: `1px solid ${currentConfig.color}30`
        }}
      >
        {currentConfig.icon} {currentConfig.label}
      </button>

      {isOpen && document.body && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[140px] py-1 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 999999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <span>{config.icon}</span>
              <span style={{ color: config.color }}>{config.label}</span>
              {currentPriority === key && <span className="ml-auto text-blue-600">✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default InlinePriorityDropdown;
