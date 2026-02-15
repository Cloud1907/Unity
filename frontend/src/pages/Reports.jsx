import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    CheckCircle2, TrendingUp, Users, Calendar, ArrowUpRight, Clock, Building2, Layers, User, Briefcase
} from 'lucide-react';
import { format, subDays, isSameDay, parseISO, startOfWeek, startOfMonth, subYears, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getAvatarUrl } from '../utils/avatarHelper';

// Premium color palette for workspaces
const WORKSPACE_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
    '#06b6d4', '#3b82f6', '#22c55e', '#eab308', '#ef4444'
];

// Priority Colors for Pie Chart
const PRIORITY_COLORS = {
    urgent: '#cc0000',
    high: '#ff9900',
    medium: '#555555',
    low: '#808080'
};

const Reports = () => {
    const { tasks, users, projects, departments, loading, fetchTasks } = useData();
    const { user } = useAuth();
    
    // View State
    const [timeRange, setTimeRange] = useState('week');
    const [viewScope, setViewScope] = useState('me'); // 'me' | 'group'
    const [showAllGroups, setShowAllGroups] = useState(false); // Admin only toggle

    const currentUserId = user?.id || parseInt(localStorage.getItem('userId'));
    const didFetchRef = React.useRef(false); // Ref to prevent double-fetching in React Strict Mode

    // ANALYTICS FIX: Optimized data loading
    useEffect(() => {
        const loadCompleteData = async () => {
            // Prevent multiple fetches if already fetched or if we sufficient data
            if (didFetchRef.current) return;
            didFetchRef.current = true;

            if (process.env.NODE_ENV === 'development') {
                console.log('[Reports] Syncing tasks for analytics...');
            }
            
            // Don't reset to avoid UI flash. 
            // Fetch 500 items max for meaningful but lighter data.
            // Note: If you have > 500 tasks, analytics will be partial but acceptable for speed.
            await fetchTasks(null, { reset: false, pageSize: 500 }); 
        };

        loadCompleteData();
    }, [fetchTasks]);

    // Helper: Check if user is in assignees
    const isUserAssigned = (assignees, userId) => {
        if (!assignees || !userId) return false;
        return assignees.some(a => {
            if (typeof a === 'object' && a !== null) {
                const assigneeId = a.userId || a.user?.id || a.id;
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
            case 'all': return new Date(0); // Epoch start
            default: return startOfWeek(now, { weekStartsOn: 1 });
        }
    }, [timeRange]);

    // Get visible workspaces based on user role and settings
    const visibleWorkspaces = useMemo(() => {
        const userDepts = user?.departments || (user?.department ? [user.department] : []);
        
        // If admin AND explicitly asked to show all groups
        if (user?.role === 'admin' && showAllGroups) {
            return departments;
        }

        // Default behavior: Show only user's departments (even for admins unless toggled)
        return departments.filter(d => {
            const dId = d.id;
            return userDepts.some(ud => ud == dId || ud === d.name);
        });
    }, [departments, user, showAllGroups]);

    // Map tasks by project for performance
    const tasksByProject = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            if (!map[t.projectId]) map[t.projectId] = [];
            map[t.projectId].push(t);
        });
        return map;
    }, [tasks]);

    // Filtered Tasks based on Scope and Workspaces
    // Used ONLY for bottom charts (Completed Analysis)
    const scopeTasks = useMemo(() => {
        let filtered = tasks;

        // 1. Filter by Workspace (Limit to visible workspaces projects)
        // This applies to both 'me' and 'group' scopes to ensure we only show data for relevant contexts
        const visibleProjectIds = projects
            .filter(p => visibleWorkspaces.some(w => w.id == p.departmentId || w.name === p.department))
            .map(p => p.id);
        filtered = filtered.filter(t => visibleProjectIds.includes(t.projectId));

        // 2. Filter by User (if viewScope is me)
        if (viewScope === 'me') {
            filtered = filtered.filter(t => isUserAssigned(t.assignees, currentUserId));
        }

        return filtered;
    }, [tasks, viewScope, visibleWorkspaces, projects, currentUserId]);

    // Workspace Workload Data - Premium chart data
    // Unaffected by 'me' scope filter - always shows group workload
    const workspaceWorkloadData = useMemo(() => {
        const now = new Date();

        return visibleWorkspaces.map((workspace, index) => {
            const workspaceProjects = projects.filter(p =>
                p.departmentId == workspace.id || p.department === workspace.name
            );

            // Fetch all tasks for these projects (Group view)
            const workspaceTasks = workspaceProjects.flatMap(p => tasksByProject[p.id] || []);

            // Stats
            const todo = workspaceTasks.filter(t => t.status === 'todo').length;
            const inProgress = workspaceTasks.filter(t => ['working', 'in_progress', 'review'].includes(t.status)).length;
            const stuck = workspaceTasks.filter(t => t.status === 'stuck').length;

            const completedInRange = workspaceTasks.filter(t => {
                if (t.status !== 'done') return false;
                const d = t.updatedAt || t.createdAt;
                if (!d) return false;
                try {
                    const dateObj = typeof d === 'string' ? parseISO(d) : new Date(d);
                    return isAfter(dateObj, startDate);
                } catch (e) {
                    return false;
                }
            });
            const done = completedInRange.length;

            const overdue = workspaceTasks.filter(t => {
                if (t.status === 'done' || !t.dueDate) return false;
                return new Date(t.dueDate) < now;
            }).length;

            return {
                name: workspace.name,
                todo,
                inProgress,
                stuck,
                done,
                total: workspaceTasks.length,
                overdue,
                active: todo + inProgress + stuck,
                color: WORKSPACE_COLORS[index % WORKSPACE_COLORS.length],
                projects: workspaceProjects.length
            };
        }).filter(w => w.total > 0).sort((a, b) => b.active - a.active);
    }, [visibleWorkspaces, projects, tasksByProject, startDate]);

    // Completed Tasks List (from Scope)
    const completedTasksList = useMemo(() => {
        return scopeTasks.filter(t => {
            if (t.status !== 'done') return false;
            const d = t.updatedAt || t.createdAt;
            return d && isAfter(parseISO(d), startDate);
        }).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }, [scopeTasks, startDate]);

    // Completed by Project Chart Data (from Scope)
    const completedByProjectData = useMemo(() => {
        const projectCounts = {};
        completedTasksList.forEach(t => {
            const pName = projects.find(p => p.id === t.projectId)?.name || 'Bilinmeyen';
            projectCounts[pName] = (projectCounts[pName] || 0) + 1;
        });
        
        return Object.entries(projectCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 projects
    }, [completedTasksList, projects]);

    // Completed by Priority Chart Data (from Scope)
    const completedByPriorityData = useMemo(() => {
        const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
        completedTasksList.forEach(t => {
            const p = t.priority || 'medium';
            if (counts[p] !== undefined) counts[p]++;
        });

        return Object.entries(counts)
            .filter(([_, count]) => count > 0)
            .map(([name, value]) => ({ 
                name: name === 'urgent' ? 'Acil' : name === 'high' ? 'Yüksek' : name === 'medium' ? 'Orta' : 'Düşük',
                value, 
                color: PRIORITY_COLORS[name] 
            }));
    }, [completedTasksList]);

    // Total stats for summary cards (Based on Workload Data - so it shows Group Health)
    const totalStats = useMemo(() => {
        const active = workspaceWorkloadData.reduce((acc, w) => acc + w.active, 0);
        const done = workspaceWorkloadData.reduce((acc, w) => acc + w.done, 0);
        const overdue = workspaceWorkloadData.reduce((acc, w) => acc + w.overdue, 0);
        const total = active + done;
        return {
            active,
            done,
            overdue,
            ratio: total > 0 ? Math.round((done / total) * 100) : 0
        };
    }, [workspaceWorkloadData]);

    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" size={24} />
                            Raporlar & İçgörüler
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Performans ve iş yükü analizi
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                         {/* Admin: Show All Groups Toggle */}
                         {user?.role === 'admin' && (
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors select-none">
                                <input 
                                    type="checkbox" 
                                    checked={showAllGroups} 
                                    onChange={(e) => setShowAllGroups(e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                Tüm Grupları Göster
                            </label>
                        )}

                        {/* Time Range Filter */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            {[
                                { id: 'week', label: 'Bu Hafta' },
                                { id: 'month', label: 'Bu Ay' },
                                { id: 'year', label: 'Son 1 Yıl' },
                                { id: 'all', label: 'Tümü' }
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
                </div>

                {/* SUMMARY STATS - General Health Portfolio (GROUP LEVEL) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                            <Layers size={40} className="text-indigo-600" />
                        </div>
                        <div className="text-2xl font-semibold text-slate-900 dark:text-white">{totalStats.active}</div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Açık Görevler
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={40} className="text-emerald-600" />
                        </div>
                        <div className="text-2xl font-semibold text-emerald-600">{totalStats.done}</div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Tamamlanan
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                            <Clock size={40} className="text-rose-600" />
                        </div>
                        <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
                            {totalStats.overdue}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Gecikenler
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                            <TrendingUp size={40} className="text-blue-600" />
                        </div>
                        <div className="text-2xl font-semibold text-indigo-600">{totalStats.ratio}%</div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Başarı Oranı
                        </div>
                    </div>
                </div>

                {/* WORKSPACE WORKLOAD - (FULL WIDTH - GROUP LEVEL) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {workspaceWorkloadData.map((workspace, index) => (
                                    <div
                                        key={workspace.name}
                                        className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group"
                                    >
                                        <div
                                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                                            style={{ backgroundColor: workspace.color }}
                                        />

                                        <div className="flex items-center justify-between mb-3 pt-1">
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate" title={workspace.name}>
                                                {workspace.name}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                {workspace.overdue > 0 && (
                                                    <div className="flex items-center gap-1 text-[10px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-900/40 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-800/20 shadow-sm">
                                                        <Clock size={10} />
                                                        {workspace.overdue} Geciken
                                                    </div>
                                                )}
                                                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                    {workspace.projects} proje
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex-1">
                                                <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                                                    {workspace.active}
                                                </div>
                                                <div className="text-[10px] capitalize tracking-wider text-slate-500">Aktif Görev</div>
                                            </div>
                                            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                                            <div className="flex-1">
                                                <div className="text-2xl font-semibold text-emerald-600">
                                                    {workspace.done}
                                                </div>
                                                <div className="text-[10px] capitalize tracking-wider text-slate-500">Tamamlanan</div>
                                            </div>
                                        </div>

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

                {/* --- SEPARATOR --- */}
                <div className="border-t border-slate-200 dark:border-slate-800 my-4"></div>

                {/* COMPLETED TASKS ANALYSIS SECTION - (FILTERABLE) */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                             <CheckCircle2 className="text-emerald-500" size={24} />
                             Tamamlanan İşler Analizi
                        </h2>

                        {/* Scope Toggle */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                            <button
                                onClick={() => setViewScope('me')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    viewScope === 'me' 
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <User size={14} />
                                Kendim
                            </button>
                            <button
                                onClick={() => setViewScope('group')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    viewScope === 'group' 
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Briefcase size={14} />
                                Çalışma Grubu
                            </button>
                        </div>
                    </div>
                
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* COMPLETED BY PROJECT */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Layers size={18} className="text-blue-500" />
                                Proje Bazlı Dağılım
                            </h3>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={completedByProjectData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* COMPLETED BY PRIORITY */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={18} className="text-orange-500" />
                                Öncelik Dağılımı
                            </h3>
                            <div className="h-[250px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={completedByPriorityData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {completedByPriorityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-800 dark:text-white">{completedTasksList.length}</div>
                                        <div className="text-[10px] text-slate-400">Toplam</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COMPLETED TASKS LIST */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-indigo-600" />
                                    Son Tamamlananlar
                                </h3>
                                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                    {completedTasksList.length}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1 max-h-[250px]">
                                {completedTasksList.length > 0 ? completedTasksList.slice(0, 8).map(task => {
                                    const project = projects.find(p => p.id === task.projectId);
                                    return (
                                        <div key={task.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: project?.color || '#cbd5e1' }} />
                                                <div className="min-w-0">
                                                    <div className="font-medium text-xs text-slate-900 dark:text-white truncate">{task.title}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">{project?.name || 'Proje'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-slate-400 text-[10px] gap-1 shrink-0 ml-4">
                                                <Clock size={10} />
                                                {format(parseISO(task.updatedAt || task.createdAt), 'd MMM', { locale: tr })}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="p-6 text-center text-slate-400 text-sm">
                                        Bu dönemde veri yok
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;
