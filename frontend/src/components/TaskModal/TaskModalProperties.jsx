import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Trash2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Calendar as CalendarComponent } from '../ui/calendar';
import InlineLabelPicker from '../InlineLabelPicker';
import InlineAssigneePicker from '../InlineAssigneePicker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { toSkyISOString } from '../../utils/dateUtils';
import { extractIds } from '../../utils/entityUtils';
import { statuses, priorities } from '../../constants/taskConstants';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import { useDataState } from '../../contexts/DataContext';

const TaskModalPropertiesInner = ({
    taskData,
    setTaskData,
    onUpdate,
    filteredUsers,
    workspaceId,
    currentUser,
    onDeleteClick,
    isSubtask,
    isMobile = false,
    className = ''
}) => {
    const { labels } = useDataState();
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const statusMenuRef = useRef(null);

    // Optimistic Hooks for Fields
    const status = useOptimisticUpdate(taskData.status, (val) => onUpdate(taskData.id, { status: val }));
    const priority = useOptimisticUpdate(taskData.priority, (val) => onUpdate(taskData.id, { priority: val }));
    const progress = useOptimisticUpdate(taskData.progress || 0, (val) => onUpdate(taskData.id, { progress: val }));
    const startDate = useOptimisticUpdate(taskData.startDate, (val) => onUpdate(taskData.id, { startDate: val }));
    const dueDate = useOptimisticUpdate(taskData.dueDate, (val) => onUpdate(taskData.id, { dueDate: val }));

    const currentStatus = statuses.find(s => s.id === status.value) || statuses[0];

    // Click outside listener for status menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
                setShowStatusMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Error Shake Animation Helper
    const getShakeClass = (hookState) => hookState.isError ? "animate-shake border-red-500" : "";

    const baseClasses = isMobile
        ? 'w-full bg-white dark:bg-slate-950 p-4 flex flex-col gap-5 overflow-y-auto'
        : 'w-80 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-6 flex flex-col gap-6 overflow-y-auto';

    return (
        <div className={`${baseClasses} ${className}`}>

            {/* Status Dropdown - Hide for Subtasks */}
            {!isSubtask && (
                <div className={cn("space-y-3 relative", getShakeClass(status))} ref={statusMenuRef}>
                    <label className="text-xs font-bold text-slate-400">Durum</label>
                    <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        disabled={status.isPending}
                        className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 transition-colors shadow-sm",
                            status.isPending && "opacity-70 cursor-wait"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentStatus.color }} />
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{currentStatus.label}</span>
                        </div>
                        <ChevronDown size={16} className="text-slate-400" />
                    </button>

                    {showStatusMenu && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-1.5 z-10 animate-in zoom-in-95 duration-150">
                            {statuses.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        status.update(s.id);
                                        setShowStatusMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.label}</span>
                                    {status.value === s.id && <CheckCircle2 size={14} className="ml-auto text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Priority - Hide for Subtasks */}
            {!isSubtask && (
                <div className={cn("space-y-3", getShakeClass(priority))}>
                    <label className="text-xs font-bold text-slate-400">Öncelik</label>
                    <div className="grid grid-cols-2 gap-2">
                        {priorities.map(p => (
                            <button
                                key={p.id}
                                disabled={priority.isPending}
                                onClick={() => priority.update(p.id)}
                                className={cn(
                                    "flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all border",
                                    priority.value === p.id
                                        ? 'border-transparent shadow-sm scale-105'
                                        : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 opacity-70 hover:opacity-100',
                                    priority.isPending && "cursor-wait opacity-50"
                                )}
                                style={priority.value === p.id ? { backgroundColor: p.color, color: p.textColor } : {}}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress - Manual Slider */}
            <div className={cn("space-y-3", getShakeClass(progress))}>
                <label className="text-xs font-bold text-slate-400">İlerleme</label>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Tamamlanma</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress.value}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                            className="h-3 rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${progress.value}%` }}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress.value}
                        onChange={(e) => progress.setValue(parseInt(e.target.value))}
                        onMouseUp={(e) => progress.update(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
                        style={{
                            background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${progress.value}%, rgb(226 232 240) ${progress.value}%, rgb(226 232 240) 100%)`
                        }}
                    />
                </div>
            </div>

            {/* Assignees */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400">Atananlar</label>
                <div className="flex flex-wrap gap-2">
                    <InlineAssigneePicker
                        showNames={true}
                        assigneeIds={extractIds(taskData.assignees, 'userId')}
                        assignees={taskData.assignees || []}
                        allUsers={filteredUsers}
                        workspaceId={workspaceId}
                        onChange={(newIds) => {
                            // Fire-and-forget: InlineAssigneePicker manages its own local state
                            // so we don't need to setTaskData here (no redundant state layer)
                            const optimisticAssignees = newIds.map(id => {
                                const user = filteredUsers.find(u => Number(u.id) === Number(id));
                                if (user) return user;
                                return { id: Number(id), userId: Number(id), fullName: '...', avatar: null };
                            }).sort((a, b) => Number(a.id) - Number(b.id));

                            onUpdate(taskData.id, { assigneeIds: newIds }, { assignees: optimisticAssignees, assigneeIds: newIds.map(Number).sort((a, b) => a - b) });
                        }}
                    />
                </div>
            </div>

            {/* Labels - Hide for Subtasks */}
            {!isSubtask && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400">Etiketler</label>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 min-h-[42px] flex items-center">
                        <InlineLabelPicker
                            taskId={taskData.id}
                            projectId={taskData.projectId}
                            currentLabels={taskData.labels || []}
                            onUpdate={(tid, newLabels) => {
                                // Fire-and-forget: InlineLabelPicker manages its own local state
                                const globalLabels = labels || [];
                                const optimisticLabels = newLabels.map(id => {
                                    const match = globalLabels.find(l => Number(l.id) === Number(id));
                                    if (match) {
                                        return { id: match.id, labelId: match.id, name: match.name, color: match.color, projectId: match.projectId };
                                    }
                                    return { id: Number(id), labelId: Number(id), name: 'Etiket', color: '#808080' }; 
                                });
                                onUpdate(tid, { labelIds: newLabels }, { labels: optimisticLabels, labelIds: newLabels });
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Start Date */}
            <div className={cn("space-y-3", getShakeClass(startDate))}>
                <label className="text-xs font-bold text-slate-400">Başlangıç Tarihi</label>
                <div className="relative">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
                                    !startDate.value && "text-slate-400"
                                )}
                            >
                                <Calendar size={16} className="mr-2 text-slate-400" />
                                {startDate.value ? (
                                    format(new Date(startDate.value), "d MMMM yyyy", { locale: tr })
                                ) : (
                                    <span>Tarih seçin</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[99999]" align="start" side="bottom">
                            <CalendarComponent
                                mode="single"
                                selected={startDate.value ? new Date(startDate.value) : undefined}
                                onSelect={(date) => {
                                    const iso = toSkyISOString(date);
                                    startDate.update(iso);
                                }}
                                initialFocus
                                locale={tr}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Due Date */}
            <div className={cn("space-y-3", getShakeClass(dueDate))}>
                <label className="text-xs font-bold text-slate-400">Son Tarih</label>
                <div className="relative">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
                                    !dueDate.value && "text-slate-400"
                                )}
                            >
                                <Calendar size={16} className="mr-2 text-slate-400" />
                                {dueDate.value ? (
                                    format(new Date(dueDate.value), "d MMMM yyyy", { locale: tr })
                                ) : (
                                    <span>Tarih seçin</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[99999]" align="start" side="bottom">
                            <CalendarComponent
                                mode="single"
                                selected={dueDate.value ? new Date(dueDate.value) : undefined}
                                onSelect={(date) => {
                                    const iso = toSkyISOString(date);
                                    dueDate.update(iso);
                                }}
                                initialFocus
                                locale={tr}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            
            {/* Completed Date (Read Only - Shows if set) */}
            {taskData.completedAt && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400">Tamamlandı</label>
                    <div className="flex items-center text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-900/40">
                        <CheckCircle2 size={16} className="mr-2" />
                        {format(new Date(taskData.completedAt), "d MMMM yyyy HH:mm", { locale: tr })}
                    </div>
                </div>
            )}

            {/* Delete Button (Owner Only) */}
            {(currentUser?.role === 'admin' || taskData.createdBy === currentUser?.id || (!taskData.createdBy && taskData.assignedBy === currentUser?.id)) && (
                <div className="pt-6 mt-auto border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onDeleteClick}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        Görevi Sil
                    </button>
                </div>
            )}
        </div>
    );
};

export const TaskModalProperties = React.memo(TaskModalPropertiesInner);
