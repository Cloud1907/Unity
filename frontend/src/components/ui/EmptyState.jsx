import React from 'react';
import { Button } from './button';
import { Search, FolderPlus, FileQuestion, Layout, CheckSquare, Plus } from 'lucide-react';

const icons = {
    tasks: CheckSquare,
    search: Search,
    project: FolderPlus,
    general: Layout,
    unknown: FileQuestion
};

const EmptyState = ({
    title,
    description,
    icon = 'general',
    action,
    className
}) => {
    const IconComponent = icons[icon] || icons.unknown;

    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 ${className}`}>
            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-gray-50 dark:ring-slate-800">
                <IconComponent
                    size={48}
                    className="text-gray-300 dark:text-gray-600"
                    strokeWidth={1.5}
                />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-8 mx-auto leading-relaxed">
                {description}
            </p>
            {action && (
                <Button
                    onClick={action.onClick}
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                    {action.icon || <Plus size={16} className="mr-2" />}
                    {action.label}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
