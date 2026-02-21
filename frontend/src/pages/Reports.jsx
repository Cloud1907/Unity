import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
    CheckCircle2, TrendingUp, Users, Calendar, Clock, Building2,
    Layers, User, Briefcase, Filter, PieChart as PieChartIcon, BarChart3
} from 'lucide-react';
import { format, startOfWeek, startOfMonth, subYears, isAfter, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getAvatarUrl } from '../utils/avatarHelper';
import CountUp from '../components/dashboard/CountUp';
import ModernTaskModal from '../components/ModernTaskModal';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import UserAvatar from '../components/ui/shared/UserAvatar';

// Premium color palette for workspaces
const WORKSPACE_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
    '#06b6d4', '#3b82f6', '#22c55e', '#eab308', '#ef4444'
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = React.memo(({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl text-xs">
                <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-500 capitalize">{entry.name}:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
});

const Reports = () => {
    const { tasks, projects, departments, users, fetchTasks } = useData();
    const { user } = useAuth();

    // View State for Completed Tasks Section
    const [timeRange, setTimeRange] = useState('week');
    const [viewScope, setViewScope] = useState('group'); // 'me' | 'group' (Default to Team)

    // Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentUserId = user?.id || parseInt(localStorage.getItem('userId'));
    const didFetchRef = useRef(false);

    // Optimized data loading
    useEffect(() => {
        const loadCompleteData = async () => {
            if (didFetchRef.current) return;
            didFetchRef.current = true;
            await fetchTasks(null, { reset: false, pageSize: 500 });
        };
        loadCompleteData();
    }, [fetchTasks]);

    // Helper: Check if user is in assignees (stabilized)
    const isUserAssigned = useCallback((assignees, userId) => {
        if (!assignees || !userId) return false;
        return assignees.some(a => {
            if (typeof a === 'object' && a !== null) {
                const assigneeId = a.userId || a.user?.id || a.id;
                return String(assigneeId) === String(userId);
            }
            return String(a) === String(userId);
        });
    }, []);

    const handleTaskClick = useCallback((task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedTask(null);
        // Refresh data to reflect any changes made in modal
        fetchTasks(null, { reset: false, pageSize: 500 });
    }, [fetchTasks]);

    // Calculate Start Date based on Time Range
    const startDate = useMemo(() => {
        const now = new Date();
        switch (timeRange) {
            case 'week': return startOfWeek(now, { weekStartsOn: 1 });
            case 'month': return startOfMonth(now);
            case 'year': return subYears(now, 1);
            case 'all': return new Date(0);
            default: return startOfWeek(now, { weekStartsOn: 1 });
        }
    }, [timeRange]);

    // Get visible workspaces (All for top stats logic, restricted for scope)
    const visibleWorkspaces = useMemo(() => {
        const userDepts = user?.departments || (user?.department ? [user.department] : []);
        
        // Fix: User requested to NOT see unrelated workspaces even as admin
        // if (user?.role === 'admin') return departments; 

        return departments.filter(d => {
            const dId = d.id;
            return userDepts.some(ud => ud == dId || ud === d.name);
        });
    }, [departments, user]);

    // Map tasks by project
    const tasksByProject = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            if (!map[t.projectId]) map[t.projectId] = [];
            map[t.projectId].push(t);
        });
        return map;
    }, [tasks]);

    // --- TOP SECTIONS DATA (General Snapshot) ---
    const workspaceWorkloadData = useMemo(() => {
        const now = new Date();
        return visibleWorkspaces.map((workspace, index) => {
            const workspaceProjects = projects.filter(p =>
                p.departmentId == workspace.id || p.department === workspace.name
            );
            let workspaceTasks = workspaceProjects.flatMap(p => tasksByProject[p.id] || []);

            // Apply viewScope filter to chart/stats data
            if (viewScope === 'me') {
                workspaceTasks = workspaceTasks.filter(t => isUserAssigned(t.assignees, currentUserId));
            }

            const todo = workspaceTasks.filter(t => t.status === 'todo').length;
            const inProgress = workspaceTasks.filter(t => ['working', 'in_progress', 'review'].includes(t.status)).length;
            const stuck = workspaceTasks.filter(t => t.status === 'stuck').length;
            const done = workspaceTasks.filter(t => {
                if (t.status !== 'done') return false;
                const d = t.completedAt || t.updatedAt || t.createdAt;
                return d && isAfter(parseISO(d), startDate);
            }).length;

            const overdue = workspaceTasks.filter(t => {
                if (t.status === 'done' || !t.dueDate) return false;
                return new Date(t.dueDate) < now;
            }).length;

            return {
                name: workspace.name,
                todo, inProgress, stuck, done, overdue,
                total: workspaceTasks.length,
                active: todo + inProgress + stuck,
                regular: Math.max(0, (todo + inProgress + stuck) - overdue),
                color: WORKSPACE_COLORS[index % WORKSPACE_COLORS.length],
                projects: workspaceProjects.length
            };
        }).filter(w => w.total > 0).sort((a, b) => b.active - a.active);
    }, [visibleWorkspaces, projects, tasksByProject, startDate, viewScope, currentUserId]);

    const totalStats = useMemo(() => {
        const active = workspaceWorkloadData.reduce((acc, w) => acc + w.active, 0);
        const done = workspaceWorkloadData.reduce((acc, w) => acc + w.done, 0);
        const overdue = workspaceWorkloadData.reduce((acc, w) => acc + w.overdue, 0);
        const total = active + done;
        return {
            active, done, overdue,
            ratio: total > 0 ? Math.round((done / total) * 100) : 0
        };
    }, [workspaceWorkloadData, viewScope, currentUserId]); // Add viewScope and currentUserId if we want top stats to reflect selection


    // --- Pre-built lookup maps for O(1) access (shared across memos) ---
    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
    const departmentMap = useMemo(() => new Map(departments.map(d => [d.id, d])), [departments]);

    // --- BOTTOM SECTION DATA (Filtered Completed Tasks) ---
    const completedTasksList = useMemo(() => {
        // Pre-compute visible workspace sets for O(1) lookup
        const visibleWorkspaceIds = new Set(visibleWorkspaces.map(w => w.id));
        const visibleWorkspaceNames = new Set(visibleWorkspaces.map(w => w.name));

        let filtered = tasks.filter(t => {
            if (t.status !== 'done') return false;

            // 1. Workspace visibility check (O(1) with Set)
            const project = projectMap.get(t.projectId);
            if (!project) return false;
            if (!visibleWorkspaceIds.has(project.departmentId) && !visibleWorkspaceNames.has(project.department)) return false;

            // 2. User scope check
            if (viewScope === 'me' && !isUserAssigned(t.assignees, currentUserId)) return false;

            // 3. Time range check
            const d = t.completedAt || t.updatedAt || t.createdAt;
            if (!d || !isAfter(parseISO(d), startDate)) return false;

            return true;
        });

        // 4. Sort by Workspace -> Project -> Date (O(1) lookups via Maps)
        return filtered.sort((a, b) => {
             const projA = projectMap.get(a.projectId);
             const projB = projectMap.get(b.projectId);

             const deptA = departmentMap.get(projA?.departmentId);
             const deptB = departmentMap.get(projB?.departmentId);

             // Sort by Workspace Name
             const deptComp = (deptA?.name || '').localeCompare(deptB?.name || '', 'tr');
             if (deptComp !== 0) return deptComp;

             // Sort by Project Name
             const projComp = (projA?.name || '').localeCompare(projB?.name || '', 'tr');
             if (projComp !== 0) return projComp;

             // Sort by Date (Newest first)
             const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt);
             const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt);
             return dateB - dateA;
        });
    }, [tasks, viewScope, currentUserId, startDate, projectMap, departmentMap, visibleWorkspaces, isUserAssigned]);


    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" size={26} />
                            Raporlar & İçgörüler
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Firma geneli performans ve detaylı iş analizi
                        </p>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Layers size={48} className="text-indigo-600" />
                        </div>
                        <div className="text-sm text-slate-500 font-medium mb-1">Açık Görevler</div>
                        <CountUp to={totalStats.active} className="text-3xl font-bold text-slate-900 dark:text-white" />
                        <div className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1">
                            <Layers size={12} /> Aktif iş yükü
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CheckCircle2 size={48} className="text-emerald-600" />
                        </div>
                        <div className="text-sm text-slate-500 font-medium mb-1">Tamamlanan</div>
                        <CountUp to={totalStats.done} className="text-3xl font-bold text-emerald-600" />
                        <div className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} /> Tüm zamanlar
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock size={48} className="text-rose-600" />
                        </div>
                        <div className="text-sm text-slate-500 font-medium mb-1">Gecikenler</div>
                        <CountUp to={totalStats.overdue} className="text-3xl font-bold text-rose-600 dark:text-rose-400" />
                        <div className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                            <Clock size={12} /> Aksayan işler
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp size={48} className="text-blue-600" />
                        </div>
                        <div className="text-sm text-slate-500 font-medium mb-1">Başarı Oranı</div>
                        <div className="text-3xl font-bold text-indigo-600">
                            <CountUp to={totalStats.ratio} suffix="%" />
                        </div>
                         <div className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1">
                            <TrendingUp size={12} /> Tamamlama oranı
                        </div>
                    </div>
                </div>

                {/* WORKSPACE ANALYTICS - Premium Gradient Chart */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-indigo-500/5 p-6 overflow-hidden relative will-change-transform" style={{ contain: 'layout style paint' }}>
                    {/* Background Decorative Gradient */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                         <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 size={20} className="text-indigo-600" />
                                Çalışma Alanı İş Yükü
                            </h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-widest opacity-70">Performans ve Dağılım Analizi</p>
                         </div>
                    </div>

                    <div className="h-[320px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={workspaceWorkloadData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={1}/>
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.8}/>
                                    </linearGradient>
                                    <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.8}/>
                                    </linearGradient>
                                    <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                                        <stop offset="95%" stopColor="#f87171" stopOpacity={0.8}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                                    interval={0}
                                    height={40}
                                    dy={10} 
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }} />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle" 
                                    wrapperStyle={{ top: -40, right: 0, fontSize: '11px', fontWeight: 700 }} 
                                />
                                <Bar dataKey="regular" name="Aktif" stackId="a" fill="url(#colorActive)" radius={[0, 0, 4, 4]} barSize={24} />
                                <Bar dataKey="overdue" name="Geciken" stackId="a" fill="url(#colorOverdue)" radius={[0, 0, 0, 0]} barSize={24} />
                                <Bar dataKey="done" name="Tamamlanan" stackId="a" fill="url(#colorDone)" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SEPARATOR */}
                <div className="border-t border-slate-200 dark:border-slate-800"></div>

                <div className="space-y-4">
                     <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Building2 size={20} className="text-indigo-600" />
                                Geçmiş Dönem Raporu
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Tamamlanan işlerin detaylı dökümü ve filtreleme
                            </p>
                        </div>

                        {/* Filters Toolbar - Relocated here */}
                        <div className="flex flex-col md:flex-row gap-3 items-center">
                            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <button
                                    onClick={() => setViewScope('me')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                        viewScope === 'me'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-100 dark:ring-0'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <User size={14} />
                                    Kendim
                                </button>
                                <button
                                    onClick={() => setViewScope('group')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                        viewScope === 'group'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-100 dark:ring-0'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Briefcase size={14} />
                                    Ekibim
                                </button>
                            </div>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

                            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                {[
                                    { id: 'week', label: 'Bu Hafta' },
                                    { id: 'month', label: 'Bu Ay' },
                                    { id: 'year', label: 'Bu Yıl' },
                                    { id: 'all', label: 'Tümü' }
                                ].map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => setTimeRange(option.id)}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${timeRange === option.id
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                     </div>


                    {/* Detailed Result List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-center">
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-8 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Rapor Sonuçları</span>
                             </div>
                             <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-widest shadow-sm">
                                {completedTasksList.length} İş Tamamlandı
                             </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest">
                                        <th className="px-6 py-3">Çalışma Grubu</th>
                                        <th className="px-6 py-3">Proje</th>
                                        <th className="px-6 py-3">Görev</th>
                                        <th className="px-6 py-3">Kişi</th>
                                        <th className="px-6 py-3">Tarih</th>
                                        <th className="px-6 py-3 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {completedTasksList.length > 0 ? (
                                        completedTasksList.map(task => {
                                            const project = projects.find(p => p.id === task.projectId);
                                            const department = departments.find(d => d.id == project?.departmentId || d.name === project?.department);
                                            // Prioritize completedAt, fallback to updatedAt
                                            const dateStr = task.completedAt || task.updatedAt || task.createdAt; 

                                            return (
                                                <tr 
                                                    key={task.id} 
                                                    onClick={() => handleTaskClick(task)}
                                                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group border-b border-slate-50 dark:border-slate-800/50"
                                                >
                                                    <td className="px-6 py-2">
                                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                            {department?.name || 'Genel'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#94a3b8' }}></div>
                                                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{project?.name || 'Genel'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2">
                                                        <div className="font-medium text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                            {task.title}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2">
                                                        <div className="flex -space-x-2 overflow-hidden">
                                                            {task.assignees && task.assignees.length > 0 ? (
                                                                task.assignees.map((assignee, idx) => {
                                                                    // Resolve full user object from ID for Avatar
                                                                    const userId = assignee.id || assignee.userId;
                                                                    const resolvedUser = users.find(u => Number(u.id) === Number(userId)) || assignee;
                                                                    return (
                                                                        <UserAvatar 
                                                                            key={idx}
                                                                            user={resolvedUser}
                                                                            size="sm"
                                                                        className="w-6 h-6 ring-2 ring-white dark:ring-slate-900"
                                                                        showTooltip={true}
                                                                    />
                                                                    );
                                                                })
                                                            ) : (
                                                                <span className="text-slate-400 text-[10px] italic">Atanmamış</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2">
                                                        <span className="text-xs text-slate-500 font-mono">
                                                            {format(parseISO(dateStr), 'dd.MM.yyyy HH:mm')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-2 text-right">
                                                        <div className="flex justify-end">
                                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[9px] bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                                                                <CheckCircle2 size={10} />
                                                                TAMAMLANDI
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                                        <Filter size={32} className="opacity-30" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-slate-600 dark:text-slate-300">Bu filtreye uygun kayıt yok</p>
                                                        <p className="text-xs text-slate-400 max-w-xs mx-auto">Seçili tarih aralığı veya kapsamda tamamlanmış görev bulunamadı.</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setTimeRange('all')}
                                                        className="text-indigo-600 text-xs font-bold hover:underline bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg"
                                                    >
                                                        Tüm zamanları göster
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Footer / Pagination hint could go here */}
                         <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                            <span>* Son 500 tamamlanan görev gösterilmektedir.</span>
                            <span>Rapor oluşturulma: {new Date().toLocaleTimeString('tr-TR')}</span>
                        </div>
                    </div>
                </div>

            </div>

             {/* Task Details Modal */}
             {isModalOpen && selectedTask && (
                <ModernTaskModal
                    task={selectedTask}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialSection="details"
                />
            )}
        </div>
    );
};

export default Reports;
