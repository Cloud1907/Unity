import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Clock, AlertCircle, Zap, Filter, Search, ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import ModernTaskModal from '../components/ModernTaskModal';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const MyTasks = () => {
    const { tasks, projects, users } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentUserId = user?._id || user?.id || parseInt(localStorage.getItem('userId'));

    // Status Definitions and Explanations
    const statusGroups = {
        pending: {
            label: 'Bekleyen',
            statuses: ['todo', 'backlog', 'planning'],
            desc: 'Henüz başlanmamış, planlama aşamasında veya sırasını bekleyen görevler.',
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            icon: <Clock size={16} />
        },
        in_progress: {
            label: 'Süreçte',
            statuses: ['working', 'in_progress', 'review', 'stuck'],
            desc: 'Şu an üzerinde aktif olarak çalışılan, incelemede olan veya takılmış görevler.',
            color: 'text-amber-600 bg-amber-50 border-amber-200',
            icon: <Zap size={16} />
        },
        done: {
            label: 'Tamamlanan',
            statuses: ['done'],
            desc: 'Başarıyla bitirilmiş ve kapatılmış görevler.',
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            icon: <CheckCircle size={16} />
        },
        overdue: {
            label: 'Geciken',
            statuses: [], // Dynamic check
            desc: 'Son teslim tarihi geçmiş ve henüz tamamlanmamış kritik görevler.',
            color: 'text-rose-600 bg-rose-50 border-rose-200',
            icon: <AlertCircle size={16} />
        }
    };

    const StatusInfoCard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {Object.entries(statusGroups).map(([key, group]) => (
                <div key={key} className={`p-4 rounded-xl border ${group.color.replace('text-', 'border-').split(' ')[2]} ${group.color.split(' ')[1]} bg-opacity-50 flex items-start gap-3`}>
                    <div className={`p-2 rounded-lg bg-white bg-opacity-60 ${group.color.split(' ')[0]}`}>
                        {group.icon}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${group.color.split(' ')[0]}`}>{group.label}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {group.desc}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

    // Sync filter with URL
    useEffect(() => {
        const urlFilter = searchParams.get('filter');
        if (urlFilter && urlFilter !== filter) {
            setFilter(urlFilter);
        }
    }, [searchParams]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setSearchParams({ filter: newFilter });
    };

    const myTasks = useMemo(() => {
        if (!currentUserId) return [];
        return tasks.filter(t => t.assignees?.includes(currentUserId));
    }, [tasks, currentUserId]);

    const filteredTasks = useMemo(() => {
        let result = myTasks;

        // Apply Status/Type Filter
        const now = new Date();
        if (filter === 'done') {
            result = result.filter(t => t.status === 'done');
        } else if (filter === 'in_progress') {
            result = result.filter(t => statusGroups.in_progress.statuses.includes(t.status));
        } else if (filter === 'pending') {
            result = result.filter(t => statusGroups.pending.statuses.includes(t.status));
        } else if (filter === 'overdue') {
            result = result.filter(t => {
                if (!t.dueDate || t.status === 'done') return false;
                return new Date(t.dueDate) < now;
            });
        }

        // Apply Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q) ||
                t.id.toString().includes(q)
            );
        }

        // Sort by Due Date (with nulls last)
        return result.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }, [myTasks, filter, searchQuery]);

    const getProjectName = (projectId) => {
        const p = projects.find(prj => prj.id === projectId || prj._id === projectId);
        return p ? p.name : 'Unknown Project';
    };

    const getProjectColor = (projectId) => {
        const p = projects.find(prj => prj.id === projectId || prj._id === projectId);
        return p ? p.color : '#cbd5e1';
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    // Helper for Status Look (similar to MainTable)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'done': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Tamamlandı' };
            case 'working': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Çalışılıyor' };
            case 'stuck': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Takıldı' };
            case 'review': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'İnceleme' };
            default: return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', label: 'Yapılacak' };
        }
    };

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full h-10 w-10">
                            <ArrowLeft size={24} />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">İşlerim</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Üzerimdeki tüm görevler ve durumları</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500 w-full md:w-auto">
                        <Search className="ml-2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Görevlerde ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-sm w-full md:w-64 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Status Explanations */}
                <StatusInfoCard />

                {/* Filters - Modern Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
                    {[
                        { id: 'all', label: 'Tümü', icon: <Filter size={14} /> },
                        { id: 'in_progress', label: 'Devam Eden', icon: <Zap size={14} /> },
                        { id: 'pending', label: 'Bekleyen', icon: <Clock size={14} /> },
                        { id: 'done', label: 'Tamamlandı', icon: <CheckCircle size={14} /> },
                        { id: 'overdue', label: 'Geciken', icon: <AlertCircle size={14} /> },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => handleFilterChange(f.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                                ${filter === f.id
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900'}`}
                        >
                            {f.icon}
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Task Grid - Fancy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTasks.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-400">
                            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                                <Search size={48} className="opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold">Görev Bulunamadı</h3>
                            <p className="text-sm">Bu filtreye uygun herhangi bir görev yok.</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => {
                            const statusStyle = getStatusStyle(task.status);
                            const projectColor = getProjectColor(task.projectId);

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleTaskClick(task)}
                                    className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                                >
                                    {/* Top Color Bar */}
                                    <div className="h-1.5 w-full" style={{ backgroundColor: projectColor }}></div>

                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        {/* Header */}
                                        <div className="flex justify-between items-start gap-2">
                                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-6 font-medium text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700">
                                                {getProjectName(task.projectId)}
                                            </Badge>
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                {statusStyle.label}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-bold text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {task.title}
                                        </h3>

                                        {/* Footer Info */}
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className={new Date(task.dueDate) < new Date() ? 'text-rose-500' : 'text-slate-400'} />
                                                <span className={new Date(task.dueDate) < new Date() ? 'font-semibold text-rose-500' : ''}>
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                                                </span>
                                            </div>

                                            {/* Priority Dot */}
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-slate-400">Öncelik:</span>
                                                <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                                        task.priority === 'high' ? 'bg-orange-500' :
                                                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-300'
                                                    }`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modern Task Detail Modal */}
            {isModalOpen && selectedTask && (
                <ModernTaskModal
                    task={selectedTask}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialSection="activity"
                />
            )}
        </div>
    );
};

export default MyTasks;
