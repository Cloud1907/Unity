import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const InlineAssigneePicker = ({ assigneeIds, allUsers, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);
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
            if (pickerRef.current && !pickerRef.current.contains(event.target) &&
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

    const assignees = allUsers.filter(u => assigneeIds?.includes(u._id));

    const toggleAssignee = (userId) => {
        const newAssignees = assigneeIds?.includes(userId)
            ? assigneeIds.filter(id => id !== userId)
            : [...(assigneeIds || []), userId];
        onChange(newAssignees);
    };

    const pickerContent = (
        <div
            ref={pickerRef}
            className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[200px] py-2 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
                top: position.top,
                left: position.left
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">
                Atanan Kişiler
            </div>
            <div className="max-h-48 overflow-y-auto">
                {allUsers.map(user => (
                    <button
                        key={user.id || user._id}
                        onClick={() => toggleAssignee(user.id || user._id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                    >
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[10px]">
                                {user.fullName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-left text-gray-900">{user.fullName}</span>
                        {assigneeIds?.includes(user.id || user._id) && (
                            <span className="text-[#6366f1]">✓</span>
                        )}
                    </button>
                ))}
            </div>
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
                className="flex items-center -space-x-1.5 hover:scale-105 transition-transform"
            >
                {assignees.slice(0, 3).map(assignee => (
                    <Avatar key={assignee.id || assignee._id} className="w-5 h-5 border border-white ring-1 ring-gray-200 hover:z-10">
                        <AvatarImage src={assignee.avatar} alt={assignee.fullName} />
                        <AvatarFallback className="text-[10px]">
                            {assignee.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                ))}
                {assignees.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                        <span className="text-[8px] font-semibold text-gray-600">
                            +{assignees.length - 3}
                        </span>
                    </div>
                )}
                {assignees.length === 0 && (
                    <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#6366f1] hover:bg-blue-50">
                        <Plus size={10} className="text-gray-400" />
                    </div>
                )}
                {assignees.length > 0 && (
                    <div className="w-5 h-5 rounded-full bg-white border border-dashed border-gray-300 flex items-center justify-center hover:border-[#6366f1] hover:bg-blue-50 z-10 ring-2 ring-white ml-[-2px] shadow-sm transform hover:scale-110 transition-all">
                        <Plus size={10} className="text-gray-400 hover:text-[#6366f1]" />
                    </div>
                )}
            </button>
            {isOpen && ReactDOM.createPortal(pickerContent, document.body)}
        </>
    );
};

export default React.memo(InlineAssigneePicker);
