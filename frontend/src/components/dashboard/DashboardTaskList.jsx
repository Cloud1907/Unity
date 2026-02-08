import React from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, ChevronDown } from 'lucide-react';
import WorkspaceGroup from '../WorkspaceGroup';
import UserAvatar from '../ui/shared/UserAvatar';

const getStatusStyle = (status) => {
    switch (status) {
        case 'done': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Tamamlandı' };
        case 'working':
        case 'in_progress':
            return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Devam Ediyor' };
        case 'stuck': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Takıldı' };
        case 'review': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'İncelemede' };
        default: return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', label: 'Yapılacak' };
    }
};

const DashboardTaskList = ({ groupedByWorkspace, activeTab, onTaskClick, users, loadMore, hasMore, loadingMore }) => {
    if (!groupedByWorkspace || groupedByWorkspace.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                <Search size={32} className="opacity-10 mb-3" />
                <h3 className="text-[11px] font-medium opacity-30 italic tracking-widest uppercase">
                    {activeTab === 'active' ? 'Devam eden görev bulunamadı' : 'Tamamlanan görev bulunamadı'}
                </h3>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
        >
            {groupedByWorkspace.map((workspace) => (
                <WorkspaceGroup
                    key={workspace.departmentId}
                    project={{
                        name: workspace.department?.name || 'Çalışma Alanı',
                        color: workspace.department?.color || '#6366f1'
                    }}
                    taskCount={workspace.totalTasks}
                    overdueCount={workspace.overdueCount}
                    defaultExpanded={true}
                    isWorkspace={true}
                >
                    {/* Projects inside workspace */}
                    {workspace.projects.map(({ project, tasks }) => (
                        <WorkspaceGroup
                            key={project?.id}
                            project={project}
                            taskCount={tasks.length}
                            defaultExpanded={activeTab === 'active'}
                            isNested={true}
                        >
                            {/* Table Header inside project */}
                            <div className="grid grid-cols-[1fr_120px_120px_110px_110px] px-6 py-2 bg-slate-50/50 dark:bg-gray-900/40 border-b border-slate-100/50 dark:border-gray-800/30">
                                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-7">Görev</div>
                                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-4">Bitiş</div>
                                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-4">Durum</div>
                                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-4">Kişi</div>
                                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-4">İlerleme</div>
                            </div>

                            {/* Task Rows */}
                            <div className="divide-y divide-slate-50/50 dark:divide-gray-800/20">
                                {tasks.map(task => {
                                    const statusStyle = getStatusStyle(task.status);
                                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => onTaskClick(task)}
                                            className="group grid grid-cols-[1fr_120px_120px_110px_110px] px-6 py-2.5 items-center hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
                                        >
                                            {/* Task Name */}
                                            <div className="flex items-center gap-3 min-w-0 pr-4">
                                                <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center border ${task.status === 'done'
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-500'
                                                    : isOverdue ? 'border-rose-300 bg-rose-50 text-rose-500 animate-pulse' : 'border-slate-200 bg-white text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-400'
                                                    }`}>
                                                    {task.status === 'done' ? <CheckCircle size={10} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                                </div>
                                                <h3 className={`text-[12px] font-medium truncate ${isOverdue ? 'text-rose-500' : 'text-slate-700 dark:text-gray-200'}`} title={task.title}>
                                                    {task.title}
                                                </h3>
                                                {isOverdue && (
                                                    <span className="shrink-0 text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">GECİKTİ</span>
                                                )}
                                            </div>

                                            {/* Due Date */}
                                            <div className="flex items-center gap-1 px-4">
                                                <span className={`text-[11px] ${isOverdue ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                                                </span>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.text.replace('text-', 'bg-')}`} />
                                                    <span className={`text-[10px] font-medium ${statusStyle.text}`}>
                                                        {statusStyle.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Assignees */}
                                            <div className="flex items-center -space-x-1 overflow-hidden px-4">
                                                {(task.assigneeIds || []).slice(0, 3).map((assigneeId) => (
                                                    <UserAvatar
                                                        key={assigneeId}
                                                        userId={assigneeId}
                                                        usersList={users}
                                                        size="xs"
                                                        className="ring-1 ring-white dark:ring-slate-800"
                                                    />
                                                ))}
                                                {(task.assigneeIds || []).length > 3 && (
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[7px] font-bold text-slate-500">
                                                        +{(task.assigneeIds || []).length - 3}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress */}
                                            <div className="flex items-center gap-2 px-4">
                                                <div className="w-full max-w-[40px] h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${task.progress || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400">{task.progress || 0}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </WorkspaceGroup>
                    ))}
                </WorkspaceGroup>
            ))}
            {hasMore && (
                <div className="flex justify-center pt-6 pb-2">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ChevronDown size={14} />
                        )}
                        Daha Fazla Yükle
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default React.memo(DashboardTaskList);
