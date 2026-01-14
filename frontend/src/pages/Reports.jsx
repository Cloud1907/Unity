import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    CheckCircle2, TrendingUp, Users, Calendar, Filter, Download,
    ArrowUpRight, Clock, Target, Search
} from 'lucide-react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

const Reports = () => {
    const { tasks, users, projects, loading } = useData();
    const [timeRange, setTimeRange] = useState('week'); // week, month
    const [selectedProject, setSelectedProject] = useState('all');

    // --- DATA PROCESSING ---

    // 1. Completed Tasks Log (Closed Tasks)
    const completedTasks = useMemo(() => {
        return tasks
            .filter(t => t.status === 'done')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Newest first
    }, [tasks]);

    // 2. Velocity (Tasks completed over time)
    const velocityData = useMemo(() => {
        const days = timeRange === 'week' ? 7 : 30;
        const data = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const dayTasks = completedTasks.filter(t =>
                isSameDay(parseISO(t.updatedAt), date)
            );

            data.push({
                name: format(date, 'd MMM', { locale: tr }),
                completed: dayTasks.length
            });
        }
        return data;
    }, [completedTasks, timeRange]);

    // 3. Team Workload (Active tasks per user)
    const workloadData = useMemo(() => {
        return users.map(user => {
            const userTasks = tasks.filter(t =>
                t.assignees?.includes(user._id || user.id) && t.status !== 'done'
            );
            return {
                name: user.fullName.split(' ')[0], // First name only for chart
                count: userTasks.length,
                fullUser: user
            };
        }).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10 busy
    }, [users, tasks]);

    // 4. Project Health (Status distribution)
    const projectHealthData = useMemo(() => {
        const data = [
            { name: 'Tamamlandı', value: 0, color: '#10b981' }, // green-500
            { name: 'Devam Ediyor', value: 0, color: '#f59e0b' }, // amber-500
            { name: 'Bekliyor', value: 0, color: '#6366f1' }, // indigo-500
            { name: 'Gecikmiş', value: 0, color: '#ef4444' }  // red-500
        ];

        const targetTasks = selectedProject === 'all'
            ? tasks
            : tasks.filter(t => t.projectId === selectedProject);

        const now = new Date();

        targetTasks.forEach(t => {
            if (t.status === 'done') {
                data[0].value++;
            } else if (t.dueDate && new Date(t.dueDate) < now) {
                data[3].value++; // Gecikmiş (Overdue takes priority if not done)
            } else if (['working', 'in_progress', 'review', 'stuck'].includes(t.status)) {
                data[1].value++; // Devam Ediyor
            } else {
                data[2].value++; // Bekliyor (todo, planning, backlog, etc.)
            }
        });

        return data.filter(d => d.value > 0);
    }, [tasks, selectedProject]);

    // 5. Tasks by Department
    const departmentData = useMemo(() => {
        const deptMap = {};
        tasks.forEach(task => {
            const project = projects.find(p => p._id === task.projectId);
            const dept = project?.department || 'Diğer';
            deptMap[dept] = (deptMap[dept] || 0) + 1;
        });

        return Object.keys(deptMap).map(dept => ({
            name: dept,
            value: deptMap[dept]
        })).sort((a, b) => b.value - a.value);
    }, [tasks, projects]);


    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-indigo-600" size={32} />
                            Raporlar & İçgörüler
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Proje ilerlemeleri, takım performansı ve tamamlanan işlerin özeti.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button
                            onClick={() => setTimeRange('week')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'week' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400'}`}
                        >
                            Son 7 Gün
                        </button>
                        <button
                            onClick={() => setTimeRange('month')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'month' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400'}`}
                        >
                            Bu Ay
                        </button>
                    </div>
                </div>

                {/* TOP CHARTS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. VELOCITY CHART */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ArrowUpRight size={20} className="text-green-500" />
                                Tamamlanan İşler (Velocity)
                            </h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={velocityData}>
                                    <defs>
                                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. WORKLOAD CHART */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users size={20} className="text-orange-500" />
                                Takım İş Yükü (Aktif Görevler)
                            </h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workloadData} layout="vertical" margin={{ left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} width={80} />
                                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. DEPARTMENT CHART (NEW) */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Filter size={20} className="text-blue-500" />
                                Departman Analizi (Görev Dağılımı)
                            </h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={departmentData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* COMPLETED TASKS LOG (The Request) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-indigo-600" />
                            Tamamlanan Görevler Listesi
                        </h3>
                        <div className="text-sm text-slate-500">
                            Toplam <strong>{completedTasks.length}</strong> kapatılmış görev
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Görev</th>
                                    <th className="px-6 py-4">Proje / Departman</th>
                                    <th className="px-6 py-4">Tamamlayan</th>
                                    <th className="px-6 py-4">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {completedTasks.length > 0 ? completedTasks.slice(0, 10).map(task => {
                                    const project = projects.find(p => p._id === task.projectId);
                                    // Find who completed it - logic might need enhancement if 'assignees' usually close it
                                    // For now, listing first assignee or 'Bilinmeyen'
                                    const completerId = task.assignees?.[0];
                                    const completer = users.find(u => u._id === completerId || u.id === completerId);

                                    return (
                                        <tr key={task._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white">{task.title}</div>
                                                {task.tShirtSize && (
                                                    <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                        {task.tShirtSize}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#cbd5e1' }}></div>
                                                        <span className="text-slate-900 dark:text-white font-medium text-sm">{project?.name || 'Proje Silinmiş'}</span>
                                                    </div>
                                                    {project?.department && (
                                                        <span className="ml-4 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                                                            {project.department}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {completer ? (
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={completer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${completer.fullName}`}
                                                            alt={completer.fullName}
                                                            className="w-6 h-6 rounded-full border border-white shadow-sm"
                                                        />
                                                        <span className="text-slate-700 dark:text-slate-300 text-sm">{completer.fullName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm italic">Atanmamış</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-slate-500 text-sm gap-1.5">
                                                    <Clock size={14} />
                                                    {format(parseISO(task.updatedAt), 'd MMM yyyy, HH:mm', { locale: tr })}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                            Henüz tamamlanmış bir görev bulunmuyor.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {completedTasks.length > 10 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                            <button className="text-indigo-600 font-medium text-sm hover:underline">
                                Tüm Geçmişi Görüntüle
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Reports;
