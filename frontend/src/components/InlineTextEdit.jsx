import React, { useState, useRef, useEffect } from 'react';

const InlineTextEdit = ({ value, onSave, placeholder = 'Görev adı girin...', className = '', inputClassName = '', startEditing = false, multiLine = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        setText(value);
    }, [value]);

    useEffect(() => {
        if (startEditing) {
            setIsEditing(true);
        }
    }, [startEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // Select all text if it's "Yeni Görev" or empty to allow quick replace
            if (text === 'Yeni Görev') {
                inputRef.current.select();
            }
            adjustHeight();
        }
    }, [isEditing]);

    const adjustHeight = () => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
    };

    const handleSave = () => {
        if (text && text.trim() && text !== value) {
            onSave(text);
        } else {
            setText(value); // Revert if empty or unchanged
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setText(value);
            setIsEditing(false);
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);
        adjustHeight();
    };

    if (isEditing) {
        return (
            <div className="w-full h-full flex items-center" onClick={(e) => e.stopPropagation()}>
                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleChange}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className={inputClassName || `w-full bg-white dark:bg-slate-800 border border-indigo-500 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-hidden leading-normal ${className}`}
                    style={{ minHeight: '28px' }}
                />
            </div>
        );
    }

    // Multi-line mode uses line-clamp for 2 lines max, otherwise truncate
    const displayClass = multiLine
        ? 'w-full h-full cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 text-xs transition-colors flex items-center'
        : 'w-full h-full cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 text-xs transition-colors flex items-center truncate';

    const textClass = multiLine
        ? 'line-clamp-2 leading-snug'
        : 'truncate';

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            className={`${displayClass} ${className}`}
            title={value || placeholder} // Tooltip shows full text on hover
        >
            <span className={textClass}>
                {text || <span className="text-gray-400 italic">{placeholder}</span>}
            </span>
        </div>
    );
};

export default InlineTextEdit;
