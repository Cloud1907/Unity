import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    CheckCircle2, TrendingUp, Users, Calendar, ArrowUpRight, Clock, Building2, Layers
} from 'lucide-react';
import { format, subDays, isSameDay, parseISO, startOfWeek, startOfMonth, subYears, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getAvatarUrl } from '../utils/avatarHelper';

// Premium color palette for workspaces
const WORKSPACE_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
    '#06b6d4', '#3b82f6', '#22c55e', '#eab308', '#ef4444'
];

const Reports = () => {
    const { tasks, users, projects, departments, loading } = useData();
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState('week');

    const currentUserId = user?._id || user?.id || localStorage.getItem('userId');

    // Helper: Check if user is in assignees
    const isUserAssigned = (assignees, userId) => {
        if (!assignees || !userId) return false;
        return assignees.some(a => {
            if (typeof a === 'object' && a !== null) {
                const assigneeId = a.userId || a.user?.id || a.user?._id || a._id || a.id;
                return String(assigneeId) === String(userId);
            }
            return String(a) === String(userId);
        });
    };

    // Calculate Start Date based on Time Range
    const startDate = useMemo(() => {
        const now = new Date();
        switch (timeRange) {
            case 'week': return startOfWeek(now, { weekStartsOn: 1 });
            case 'month': return startOfMonth(now);
            case 'year': return subYears(now, 1);
            default: return startOfWeek(now, { weekStartsOn: 1 });
        }
    }, [timeRange]);

    // Get user's workspaces (departments)
    const myWorkspaces = useMemo(() => {
        const userDepts = user?.departments || (user?.department ? [user.department] : []);
        if (user?.role === 'admin') {
            return departments;
        }
        return departments.filter(d => {
            const dId = d._id || d.id;
            return userDepts.some(ud => ud == dId || ud === d.name);
        });
    }, [departments, user]);

    // Workspace Workload Data - Premium chart data
    const workspaceWorkloadData = useMemo(() => {
        return myWorkspaces.map((workspace, index) => {
            const workspaceId = workspace._id || workspace.id;

            // Find projects in this workspace
            const workspaceProjects = projects.filter(p =>
                p.departmentId == workspaceId || p.department === workspace.name
            );
            const projectIds = workspaceProjects.map(p => p._id || p.id);

            // Find tasks in these projects
            const workspaceTasks = tasks.filter(t => projectIds.includes(t.projectId));

            const todo = workspaceTasks.filter(t => t.status === 'todo').length;
            const inProgress = workspaceTasks.filter(t => ['working', 'in_progress', 'review'].includes(t.status)).length;
            const stuck = workspaceTasks.filter(t => t.status === 'stuck').length;
            const done = workspaceTasks.filter(t => t.status === 'done').length;
            const total = workspaceTasks.length;

            return {
                name: workspace.name,
                shortName: workspace.name.length > 12 ? workspace.name.substring(0, 12) + '...' : workspace.name,
                todo,
                inProgress,
                stuck,
                done,
                total,
                active: todo + inProgress + stuck,
                color: WORKSPACE_COLORS[index % WORKSPACE_COLORS.length],
                projects: workspaceProjects.length
            };
        }).filter(w => w.total > 0).sort((a, b) => b.active - a.active);
    }, [myWorkspaces, projects, tasks]);

    // Velocity Data
    const velocityData = useMemo(() => {
        const data = [];
        const now = new Date();
        let daysToLookBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12;

        if (timeRange === 'year') {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const count = tasks.filter(t =>
                    t.status === 'done' &&
                    t.updatedAt &&
                    new Date(t.updatedAt).getMonth() === d.getMonth() &&
                    new Date(t.updatedAt).getFullYear() === d.getFullYear()
                ).length;
                data.push({ name: format(d, 'MMM', { locale: tr }), completed: count });
            }
        } else {
            for (let i = daysToLookBack - 1; i >= 0; i--) {
                const date = subDays(now, i);
                const count = tasks.filter(t =>
                    t.status === 'done' &&
                    t.updatedAt &&
                    isSameDay(parseISO(t.updatedAt), date)
                ).length;
                data.push({
                    name: format(date, 'd MMM', { locale: tr }),
                    completed: count
                });
            }
        }
        return data;
    }, [tasks, timeRange]);

    // Completed Tasks (for list)
    const completedTasks = useMemo(() => {
        return tasks
            .filter(t => {
                const isDone = t.status === 'done';
                const isMyTask = isUserAssigned(t.assignees, currentUserId);
                const taskDate = t.updatedAt || t.createdAt;
                const inDateRange = taskDate && isAfter(parseISO(taskDate), startDate);
                return isDone && isMyTask && inDateRange;
            })
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }, [tasks, currentUserId, startDate]);

    // Total stats for summary cards
    const totalStats = useMemo(() => {
        const allActive = workspaceWorkloadData.reduce((acc, w) => acc + w.active, 0);
        const allDone = workspaceWorkloadData.reduce((acc, w) => acc + w.done, 0);
        const allTotal = workspaceWorkloadData.reduce((acc, w) => acc + w.total, 0);
        return { active: allActive, done: allDone, total: allTotal };
    }, [workspaceWorkloadData]);

    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* HEADER - Compact */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" size={24} />
                            Raporlar & İçgörüler
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Çalışma alanlarının performans özeti
                        </p>
                    </div>

                    {/* Time Range Filter */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        {[
                            { id: 'week', label: 'Bu Hafta' },
                            { id: 'month', label: 'Bu Ay' },
                            { id: 'year', label: 'Son 1 Yıl' }
                        ].map(option => (
                            <button
                                key={option.id}
                                onClick={() => setTimeRange(option.id)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${timeRange === option.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* WORKSPACE WORKLOAD - Premium Cards */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Building2 size={18} className="text-indigo-600" />
                            Çalışma Alanları İş Yükü
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                Aktif
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                Tamamlanan
                            </span>
                        </div>
                    </div>

                    {workspaceWorkloadData.length > 0 ? (
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {workspaceWorkloadData.map((workspace, index) => (
                                    <div
                                        key={workspace.name}
                                        className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group"
                                    >
                                        {/* Color accent bar */}
                                        <div
                                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                                            style={{ backgroundColor: workspace.color }}
                                        />

                                        {/* Workspace name */}
                                        <div className="flex items-center justify-between mb-3 pt-1">
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate" title={workspace.name}>
                                                {workspace.name}
                                            </h4>
                                            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                {workspace.projects} proje
                                            </span>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex-1">
                                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {workspace.active}
                                                </div>
                                                <div className="text-[10px] capitalize tracking-wider text-slate-500">Aktif Görev</div>
                                            </div>
                                            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                                            <div className="flex-1">
                                                <div className="text-2xl font-bold text-emerald-600">
                                                    {workspace.done}
                                                </div>
                                                <div className="text-[10px] capitalize tracking-wider text-slate-500">Tamamlanan</div>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                                                style={{ width: `${workspace.total > 0 ? (workspace.done / workspace.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                                            <span>İlerleme</span>
                                            <span>{workspace.total > 0 ? Math.round((workspace.done / workspace.total) * 100) : 0}%</span>
                                        </div>

                                        {/* Status breakdown mini */}
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                Bekleyen: {workspace.todo}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-amber-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                Süreçte: {workspace.inProgress}
                                            </div>
                                            {workspace.stuck > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-red-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                    Takıldı: {workspace.stuck}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400">
                            <Building2 size={40} className="mx-auto mb-2 opacity-30" />
                            <p>Henüz çalışma alanı verisi yok</p>
                        </div>
                    )}
                </div>

                {/* VELOCITY CHART - Compact */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ArrowUpRight size={18} className="text-emerald-500" />
                            Tamamlanan İşler Trendi
                        </h3>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={velocityData}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={30} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* COMPLETED TASKS LIST - Compact */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-indigo-600" />
                            Tamamlanan Görevlerim
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            {completedTasks.length} görev
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
                        {completedTasks.length > 0 ? completedTasks.slice(0, 8).map(task => {
                            const project = projects.find(p => p._id === task.projectId);
                            return (
                                <div key={task._id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project?.color || '#cbd5e1' }} />
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm text-slate-900 dark:text-white truncate">{task.title}</div>
                                            <div className="text-xs text-slate-500 truncate">{project?.name || 'Proje'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-slate-400 text-xs gap-1 shrink-0 ml-4">
                                        <Clock size={12} />
                                        {format(parseISO(task.updatedAt || task.createdAt), 'd MMM', { locale: tr })}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-6 text-center text-slate-400 text-sm">
                                Bu dönemde tamamlanmış görev yok
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
