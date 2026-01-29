import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../lib/utils';
import { User, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { getAvatarUrl } from '../utils/avatarHelper';

const PersonFilterBar = ({ filters, onFilterChange }) => {
    const { users } = useData();

    const selectedAssignees = filters.assignee || [];

    const handleToggle = (userId) => {
        const newAssignees = selectedAssignees.includes(userId)
            ? selectedAssignees.filter(id => id !== userId)
            : [...selectedAssignees, userId];

        onFilterChange({ ...filters, assignee: newAssignees });
    };

    const handleClear = (e) => {
        e.stopPropagation(); // Stop propagation to prevent closing popover if inside button
        onFilterChange({ ...filters, assignee: [] });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "gap-2 rounded-md px-3 py-1.5 border h-8 text-xs font-medium transition-colors ml-3",
                        selectedAssignees.length > 0
                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}
                >
                    <User size={14} />
                    <span>Kişi</span>
                    {selectedAssignees.length > 0 && (
                        <span className="ml-1 flex items-center justify-center bg-blue-600 text-white rounded-full min-w-[16px] h-4 px-1 text-[9px]">
                            {selectedAssignees.length}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold text-gray-500">Kişiye Göre Filtrele</span>
                    {selectedAssignees.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            Temizle
                        </button>
                    )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                    {users.map(user => (
                        <button
                            key={user._id || user.id}
                            onClick={() => handleToggle(user._id || user.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors group",
                                selectedAssignees.includes(user._id || user.id)
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200"
                            )}
                        >
                            <div className="relative">
                                <Avatar className="w-6 h-6 border border-gray-100 dark:border-gray-700">
                                    <AvatarImage src={user.avatar ? getAvatarUrl(user.avatar) : ''} />
                                    <AvatarFallback
                                        className="text-[10px] font-bold text-white"
                                        style={{ backgroundColor: user.color || '#6366f1' }}
                                    >
                                        {user.fullName?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {selectedAssignees.includes(user._id || user.id) && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 border border-white dark:border-slate-900">
                                        <Check size={8} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <span className="truncate flex-1 text-left">{user.fullName}</span>
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default PersonFilterBar;
