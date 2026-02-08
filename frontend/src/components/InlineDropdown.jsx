import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';

const InlineDropdown = ({ value, options, onChange, colorKey = 'color', labelKey = 'label', softBadge = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Optimistic Update Hook
    const optimistic = useOptimisticUpdate(value, onChange);

    // Shake animation class on error
    const shakeClass = optimistic.isError ? "animate-shake ring-2 ring-red-500 ring-offset-1" : "";
    const pendingClass = optimistic.isPending ? "opacity-70 cursor-wait" : "";

    useLayoutEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const popoverWidth = 160;
            const popoverHeight = options.length * 40 + 20;

            let top = rect.bottom + 4;
            let left = rect.left;

            if (top + popoverHeight > viewportHeight) {
                top = Math.max(8, rect.top - popoverHeight - 8);
            }
            if (left + popoverWidth > viewportWidth) {
                left = Math.max(8, viewportWidth - popoverWidth - 12);
            }

            setPosition({ top, left });
        }
    }, [isOpen, options.length]);

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

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const currentOption = options.find(opt => opt.id === optimistic.value);
    const isPlaceholder = !currentOption;

    // Soft Badge Color Mapping (Design System)
    const getSoftBadgeColors = (option) => {
        const colorMap = {
            // Priority colors
            low: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
            medium: { bg: 'bg-indigo-50/50', text: 'text-indigo-700', border: 'border-indigo-200/50' },
            high: { bg: 'bg-orange-50/50', text: 'text-orange-700', border: 'border-orange-200/50' },
            urgent: { bg: 'bg-red-50/50', text: 'text-red-700', border: 'border-red-200/50' },
            // T-Shirt sizes (soft versions)
            small: { bg: 'bg-green-50/50', text: 'text-green-700', border: 'border-green-200/50' },
            medium_tshirt: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
            large: { bg: 'bg-purple-50/50', text: 'text-purple-700', border: 'border-purple-200/50' },
            xlarge: { bg: 'bg-orange-50/50', text: 'text-orange-700', border: 'border-orange-200/50' },
            xxlarge: { bg: 'bg-rose-50/50', text: 'text-rose-700', border: 'border-rose-200/50' },
        };
        return colorMap[option.id] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
                top: position.top,
                left: position.left
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {options.map((option) => (
                <button
                    key={option.id}
                    onClick={() => {
                        optimistic.update(option.id);
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: option[colorKey] }}
                    />
                    {option.icon && <span className="shrink-0 opacity-70">{option.icon}</span>}
                    <span className="text-gray-900 dark:text-gray-200">{option[labelKey]}</span>
                    {optimistic.value === option.id && (
                        <span className="ml-auto text-[#6366f1] dark:text-[#818cf8]">✓</span>
                    )}
                </button>
            ))}
        </div>
    );

    // Soft Badge rendering (for Priority & T-Shirt columns)
    if (softBadge && currentOption) {
        const colors = getSoftBadgeColors(currentOption);
        return (
            <>
                <button
                    ref={buttonRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className={`group inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-normal transition-all ${colors.bg} ${colors.text} border ${colors.border} hover:shadow-sm ${shakeClass} ${pendingClass}`}
                >
                    {currentOption.icon && <span className="shrink-0">{currentOption.icon}</span>}
                    <span className="truncate whitespace-nowrap flex-1 text-left">{currentOption[labelKey]}</span>
                    <ChevronDown size={11} className="opacity-40 group-hover:opacity-80 transition-opacity" />
                </button>
                {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
            </>
        );
    }

    // Original solid badge (for Status column)
    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`group inline-flex items-center gap-2 px-2 py-1 rounded text-[11px] font-medium transition-all hover:shadow-sm border ${isPlaceholder
                    ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'border-transparent'
                    } ${shakeClass} ${pendingClass}`}
                style={!isPlaceholder ? {
                    backgroundColor: currentOption[colorKey],
                    color: currentOption.textColor || 'white'
                } : {}}
            >
                <span className="truncate whitespace-nowrap flex-1 text-left">{isPlaceholder ? 'Seç...' : currentOption[labelKey]}</span>
                <ChevronDown size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
            {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
        </>
    );
};

export default React.memo(InlineDropdown);
