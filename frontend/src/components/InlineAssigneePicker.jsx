import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl } from '../utils/avatarHelper';

const getUserColor = (user) => {
    if (user?.color) return user.color;
    const colors = ['#e2445c', '#00c875', '#fdab3d', '#579bfc', '#a25ddc', '#784bd1', '#ff642e', '#F59E0B'];
    const index = (user?.fullName?.length || 0) % colors.length;
    return colors[index];
};

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

    const assignees = allUsers.filter(u => {
        const uid = u.id || u._id;
        return assigneeIds?.some(aid => String(aid) === String(uid));
    });

    const toggleAssignee = (userId) => {
        const isSelected = assignees.some(u => String(u.id || u._id) === String(userId));

        const newAssignees = isSelected
            ? assigneeIds.filter(id => String(id) !== String(userId))
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
                        <Avatar className="w-6 h-6 border border-white">
                            <AvatarImage src={user.avatar ? getAvatarUrl(user.avatar) : ''} />
                            <AvatarFallback
                                className="text-[10px] text-white font-bold"
                                style={{ backgroundColor: getUserColor(user) }}
                            >
                                {user.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-left text-gray-900">{user.fullName}</span>
                        {assigneeIds?.some(aid => String(aid) === String(user.id || user._id)) && (
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
                    <Avatar key={assignee.id || assignee._id} className="w-5 h-5 border border-white ring-1 ring-gray-200 hover:z-10 transition-transform" title={assignee.fullName}>
                        <AvatarImage src={assignee.avatar ? getAvatarUrl(assignee.avatar) : ''} />
                        <AvatarFallback
                            className="text-[10px] text-white font-bold"
                            style={{ backgroundColor: getUserColor(assignee) }}
                        >
                            {assignee.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
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
