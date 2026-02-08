import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Building2, Folder, Clock } from 'lucide-react';

/**
 * WorkspaceGroup - Collapsible workspace/project container for dashboard tasks
 * Supports two-level hierarchy: Workspace (Department) -> Project -> Tasks
 * 
 * Props:
 * - isWorkspace: true for top-level workspace (department) grouping
 * - isNested: true for project groups inside a workspace
 * - overdueCount: number of overdue tasks in this workspace (optional)
 */
const WorkspaceGroup = ({
    project,
    children,
    taskCount = 0,
    overdueCount = 0,
    defaultExpanded = true,
    isWorkspace = false,
    isNested = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const itemColor = project?.color || '#6366f1';
    const itemName = project?.name || (isWorkspace ? 'Çalışma Alanı' : 'Proje');

    // Workspace (top-level) styling
    if (isWorkspace) {
        return (
            <div className="mb-6">
                {/* Workspace Header - Prominent */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-indigo-100/50 dark:border-slate-700 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-slate-750 dark:hover:to-slate-800 transition-all group shadow-sm"
                >
                    {/* Expand Icon */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-indigo-500 dark:text-indigo-400"
                    >
                        <ChevronRight size={18} />
                    </motion.div>

                    {/* Workspace Icon & Color */}
                    <div className="relative">
                        <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                        <div
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800"
                            style={{ backgroundColor: itemColor }}
                        />
                    </div>

                    {/* Workspace Name */}
                    <span className="text-[14px] font-bold text-slate-800 dark:text-white flex-1 text-left truncate">
                        {itemName}
                    </span>

                    {/* Overdue Count Badge (subtle) */}
                    {overdueCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">
                            <Clock size={10} />
                            {overdueCount} geciken
                        </span>
                    )}

                    {/* Task Count Badge */}
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-1 rounded-full">
                        {taskCount} görev
                    </span>
                </button>

                {/* Projects inside Workspace (Collapsible) */}
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 ml-4 pl-4 border-l-2 border-indigo-100 dark:border-slate-700 space-y-3">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Nested Project styling (inside workspace)
    if (isNested) {
        return (
            <div className="mb-2">
                {/* Project Header - Subtle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/70 dark:bg-slate-800/50 rounded-lg border border-slate-100/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                >
                    {/* Expand Icon */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-slate-400"
                    >
                        <ChevronRight size={14} />
                    </motion.div>

                    {/* Project Color Indicator */}
                    <div
                        className="w-2.5 h-2.5 rounded shrink-0"
                        style={{ backgroundColor: itemColor }}
                    />

                    {/* Project Name */}
                    <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 flex-1 text-left truncate">
                        {itemName}
                    </span>

                    {/* Task Count Badge */}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {taskCount}
                    </span>
                </button>

                {/* Task List (Collapsible) */}
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="mt-1 bg-white/50 dark:bg-slate-800/30 rounded-lg border border-slate-50/50 dark:border-slate-700/30 overflow-hidden">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Default: Project-level styling (for backwards compatibility)
    return (
        <div className="mb-4">
            {/* Project Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-100/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all group"
            >
                {/* Expand Icon */}
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-400"
                >
                    <ChevronRight size={16} />
                </motion.div>

                {/* Project Color Indicator */}
                <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: itemColor }}
                />

                {/* Project Name */}
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left truncate">
                    {itemName}
                </span>

                {/* Task Count Badge */}
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {taskCount}
                </span>
            </button>

            {/* Task List (Collapsible) */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(WorkspaceGroup);

