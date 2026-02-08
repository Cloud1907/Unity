import React, { useMemo } from 'react';
import { useDataState } from '../contexts/DataContext';
import UserAvatar from './ui/shared/UserAvatar';
import { cn } from '../lib/utils';
import { User, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';

const PersonFilterBar = ({ filters, onFilterChange, boardMembers }) => {
    const { users } = useDataState();

    const displayUsers = boardMembers && boardMembers.length > 0 ? boardMembers : users;

    const selectedAssignees = filters.assignee || [];

    const handleToggle = (userId) => {
        const newAssignees = selectedAssignees.includes(userId)
            ? selectedAssignees.filter(id => id !== userId)
            : [...selectedAssignees, userId];

        onFilterChange({ ...filters, assignee: newAssignees });
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onFilterChange({ ...filters, assignee: [] });
    };

    // Sort users alphabetically
    const sortedUsers = useMemo(() => {
        return [...displayUsers].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'tr'));
    }, [displayUsers]);

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
            <PopoverContent className="w-64 p-0 shadow-2xl border-gray-200 dark:border-slate-800" align="start">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span>Kişiye Göre Filtrele</span>
                    {selectedAssignees.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Temizle
                        </button>
                    )}
                </div>

                <div className="max-h-64 overflow-y-auto py-1">
                    {sortedUsers.map(user => (
                        <button
                            key={user.id}
                            onClick={() => handleToggle(user.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group",
                                selectedAssignees.includes(user.id)
                                    ? "bg-blue-50/50 dark:bg-blue-900/20"
                                    : "text-gray-700 dark:text-gray-300"
                            )}
                        >
                            <UserAvatar
                                user={user}
                                size="sm"
                                className="w-6 h-6"
                                showTooltip={false}
                            />
                            <span className={cn(
                                "truncate flex-1 text-left",
                                selectedAssignees.includes(user.id) ? "font-medium text-blue-700 dark:text-blue-400" : ""
                            )}>
                                {user.fullName}
                            </span>
                            {selectedAssignees.includes(user.id) && (
                                <Check size={14} className="text-blue-600 dark:text-blue-400" />
                            )}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default PersonFilterBar;

