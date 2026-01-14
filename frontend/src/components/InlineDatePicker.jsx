import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from './ui/calendar';
import { tr } from 'date-fns/locale';

const InlineDatePicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const datePickerRef = useRef(null);
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
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
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const isOverdue = value && new Date(value) < new Date();

    const pickerContent = (
        <div
            ref={datePickerRef}
            className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
                top: position.top,
                left: position.left
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <CalendarComponent
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                    if (date) {
                        const newDate = new Date(date);
                        newDate.setHours(12, 0, 0, 0);
                        onChange(newDate.toISOString());
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
                className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all hover:bg-gray-100 ${isOverdue ? 'text-red-600' : 'text-gray-600'
                    }`}
            >
                <Calendar size={12} />
                <span>{formatDate(value)}</span>
            </button>
            {isOpen && ReactDOM.createPortal(pickerContent, document.body)}
        </>
    );
};

export default InlineDatePicker;
