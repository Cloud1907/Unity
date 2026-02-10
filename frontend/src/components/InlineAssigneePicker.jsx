import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Search } from 'lucide-react';

import UserAvatar from './ui/shared/UserAvatar';

const InlineAssigneePicker = ({ assigneeIds, assignees, allUsers, onChange, showNames = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    // --- HYBRID OPTIMISTIC STATE ---

    // 1. Local state for 0ms feedback
    const [localSelectedIds, setLocalSelectedIds] = useState([]);
    // 2. Interaction tracker to prevent stale prop updates from overwriting user clicks
    const lastInteractionTime = useRef(0);

    // Initial sync and Background sync
    useEffect(() => {
        const propIds = (assigneeIds || []).map(a =>
            typeof a === 'object' && a != null ? (a.id ?? a.userId ?? a) : Number(a)
        ).filter(Boolean);

        // STALE UPDATE PROTECTION:
        // Only update local state from props if:
        // a) We haven't clicked anything in the last 2 seconds (waiting for server/context sync)
        // b) OR if the picker is closed (reset for next open)
        const now = Date.now();
        if (!isOpen || (now - lastInteractionTime.current > 2000)) {
            setLocalSelectedIds(propIds);
        }
    }, [assigneeIds, isOpen]);

    // --- LOGIC ---

    const toggleAssignee = useCallback((userId) => {
        lastInteractionTime.current = Date.now();

        const userIdNum = Number(userId);
        const isSelected = localSelectedIds.some(id => Number(id) === userIdNum);

        let newIds;
        if (isSelected) {
            newIds = localSelectedIds.filter(id => Number(id) !== userIdNum);
        } else {
            newIds = [...localSelectedIds, userIdNum];
        }

        // 1. INSTANT FEEDBACK (Local)
        setLocalSelectedIds(newIds);

        // 2. GLOBAL UPDATE (Async/Prop-based)
        onChange(newIds);
    }, [localSelectedIds, onChange]);

    // --- UI HELPERS ---

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const popoverHeight = 350;

            let top = rect.bottom + 4;
            let left = rect.left;
            const spaceBelow = viewportHeight - rect.bottom;
            const shouldOpenUp = spaceBelow < popoverHeight || rect.top > viewportHeight / 2;

            let style = { left };
            if (shouldOpenUp) {
                style.bottom = viewportHeight - rect.top + 4;
                style.top = null;
                style.transformOrigin = 'bottom left';
            } else {
                style.top = top;
                style.bottom = null;
                style.transformOrigin = 'top left';
            }
            setPosition(style);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filteredUsers = useMemo(() => {
        const sourceUsers = allUsers || [];
        if (!searchTerm) return sourceUsers;
        const lowSearch = searchTerm.toLowerCase();
        return sourceUsers.filter(u => u.fullName?.toLowerCase().includes(lowSearch));
    }, [allUsers, searchTerm]);

    const resolvedAssignees = useMemo(() => {
        return localSelectedIds.map(aid => {
            const userInGlobal = allUsers?.find(u => Number(u.id) === Number(aid));
            if (userInGlobal) return userInGlobal;
            if (Array.isArray(assignees)) {
                const userInProp = assignees.find(u => Number(u.id ?? u.userId) === Number(aid));
                if (userInProp) return userInProp;
            }
            return { id: aid, fullName: '...', avatar: null };
        });
    }, [localSelectedIds, allUsers, assignees]);

    const pickerContent = (
        <div
            ref={pickerRef}
            className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-800 min-w-[240px] py-2 animate-in fade-in duration-200 flex flex-col max-h-[350px]"
            style={position}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Kullanıcı ara..."
                        className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-1">
                {filteredUsers.map(user => (
                    <button
                        key={user.id}
                        onClick={() => toggleAssignee(user.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <UserAvatar user={user} size="md" className="w-6 h-6" />
                        <span className="flex-1 text-left text-gray-900 dark:text-gray-100 truncate">{user.fullName}</span>
                        {localSelectedIds.some(id => Number(id) === Number(user.id)) && (
                            <span className="text-indigo-600 font-bold">✓</span>
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
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`flex items-center transition-transform ${showNames ? 'flex-wrap gap-2' : '-space-x-1.5 hover:scale-105'}`}
            >
                {resolvedAssignees.slice(0, showNames ? undefined : 3).map(assignee => (
                    showNames ? (
                        <div key={assignee.id} className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm">
                            <UserAvatar
                                user={assignee}
                                size="xs"
                                className="w-5 h-5"
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{assignee.fullName}</span>
                        </div>
                    ) : (
                        <UserAvatar
                            key={assignee.id}
                            user={assignee}
                            size="sm"
                            className="w-5 h-5 border-white ring-1 ring-gray-200"
                        />
                    )
                ))}
                {!showNames && resolvedAssignees.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                        <span className="text-[8px] font-semibold text-gray-600">+{resolvedAssignees.length - 3}</span>
                    </div>
                )}
                <div className={`rounded-full bg-white border border-dashed border-gray-300 flex items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 transition-all shadow-sm ${showNames ? 'w-7 h-7' : 'w-5 h-5'}`}>
                    <Plus size={showNames ? 14 : 10} className="text-gray-400" />
                </div>
            </button>
            {isOpen && ReactDOM.createPortal(pickerContent, document.body)}
        </>
    );
};

export default React.memo(InlineAssigneePicker);
