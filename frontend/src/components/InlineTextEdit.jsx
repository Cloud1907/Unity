import React, { useState, useRef, useEffect } from 'react';

const InlineTextEdit = ({ value, onSave, placeholder = 'Görev adı girin...', className = '' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        setText(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (text.trim() && text !== value) {
            onSave(text);
        } else {
            setText(value); // Revert if empty or unchanged
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setText(value);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="w-full h-full flex items-center" onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`w-full h-full bg-white border border-indigo-500 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 flex items-center ${className}`}
                />
            </div>
        );
    }

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            className={`w-full h-full cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 text-xs transition-colors flex items-center ${className}`}
            title="Düzenlemek için tıklayın"
        >
            {value || <span className="text-gray-400 italic">{placeholder}</span>}
        </div>
    );
};

export default InlineTextEdit;
