import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from './ui/calendar';
import { tr } from 'date-fns/locale';
import { toSkyISOString } from '../utils/dateUtils';

const InlineDatePicker = ({ value, onChange, placeholder = '', icon: Icon = Calendar }) => {
    const [isOpen, setIsOpen] = useState(false);
    const datePickerRef = useRef(null);
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const popoverWidth = 300;
            const popoverHeight = 350;

            // Default position: below
            let top = rect.bottom + 4;
            let left = rect.left;



            // Space Constraints
            const spaceBelow = viewportHeight - rect.bottom;
            // Force OPEN UP if not enough space below (regardless of midline)
            // Or if in lower half and plenty of space above
            const shouldOpenUp = spaceBelow < popoverHeight || rect.top > viewportHeight / 2;

            let style = { left };
            let animationClass = '';

            if (shouldOpenUp) {
                const bottom = viewportHeight - rect.top + 4;
                style.bottom = bottom;
                style.top = null;
                style.transformOrigin = 'bottom left';
                animationClass = 'slide-in-from-bottom-2';
            } else {
                style.top = top;
                style.bottom = null;
                style.transformOrigin = 'top left';
                animationClass = 'slide-in-from-top-2';
            }

            // Horizontal Overflow Check
            if (left + popoverWidth > viewportWidth) {
                left = Math.max(10, viewportWidth - popoverWidth - 15);
            }
            left = Math.max(10, left);

            style.left = left;

            setPosition({ ...style, animationClass });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target) &&
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

    const formatDate = (dateString) => {
        if (!dateString) return placeholder;
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const isOverdue = value && new Date(value) < new Date();

    const pickerContent = (
        <div
            ref={datePickerRef}
            className={`fixed z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-2 animate-in fade-in ${position.animationClass || 'slide-in-from-top-2'} duration-200`}
            style={{
                top: position.top !== null ? position.top : 'auto',
                bottom: position.bottom !== null ? position.bottom : 'auto',
                left: position.left,
                transformOrigin: position.transformOrigin
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <CalendarComponent
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                    if (date) {
                        onChange(toSkyISOString(date));
                    }
                    setIsOpen(false);
                }}
                locale={tr}
                initialFocus
            />
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
                className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all hover:bg-gray-100 ${!value ? 'text-gray-400 font-normal' : (isOverdue ? 'text-red-600' : 'text-gray-600')
                    }`}
            >
                <Icon size={12} className={!value ? 'opacity-50' : ''} />
                <span>{formatDate(value)}</span>
            </button>
            {isOpen && ReactDOM.createPortal(pickerContent, document.body)}
        </>
    );
};

export default InlineDatePicker;
