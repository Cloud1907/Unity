import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';

const InlineDropdown = ({ value, options, onChange, colorKey = 'color', labelKey = 'label' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            });
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

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const currentOption = options.find(opt => opt.id === value);
    const isPlaceholder = !currentOption;

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
                        onChange(option.id);
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option[colorKey] }}
                    />
                    <span className="text-gray-900 dark:text-gray-200">{option[labelKey]}</span>
                    {value === option.id && (
                        <span className="ml-auto text-[#6366f1] dark:text-[#818cf8]">✓</span>
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-sm border ${isPlaceholder
                    ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                style={!isPlaceholder ? {
                    backgroundColor: currentOption[colorKey],
                    color: currentOption.textColor || 'white'
                } : {}}
            >
                <span className="truncate whitespace-nowrap flex-1 text-left">{isPlaceholder ? 'Seç...' : currentOption[labelKey]}</span>
                <ChevronDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
            {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
        </>
    );
};

export default React.memo(InlineDropdown);
