import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  ChevronRight, CheckCircle, Clock, AlertCircle,
  Calendar, Plus, Target, Zap, ArrowUpRight, TrendingUp, Users,
  Filter, Search, MoreHorizontal
} from 'lucide-react';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import NewTaskModal from '../components/NewTaskModal';
import ModernTaskModal from '../components/ModernTaskModal';
import { Badge } from '../components/ui/badge';
import { getAvatarUrl } from '../utils/avatarHelper';
import { DynamicIcon } from '../components/IconPicker';
import WeeklyProgress from '../components/WeeklyProgress';

const Dashboard = () => {
  const { projects: rawProjects, tasks: rawTasks, users, loading } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Normalize tasks (Backend returns objects, Frontend expects IDs)
  const tasks = useMemo(() => {
    return rawTasks.map(t => ({
      ...t,
      assignees: Array.isArray(t.assignees) ? t.assignees.map(a => (typeof a === 'object' ? (a.userId || a.id) : a)) : [],
      labels: Array.isArray(t.labels) ? t.labels.map(l => (typeof l === 'object' ? (l.labelId || l.id) : l)) : []
    }));
  }, [rawTasks]);

  // Normalize projects
  const projects = useMemo(() => {
    return rawProjects.map(p => ({
      ...p,
      members: Array.isArray(p.members) ? p.members.map(m => (typeof m === 'object' ? (m.userId || m.id) : m)) : []
    }));
  }, [rawProjects]);

  // Dashboard State
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('week'); // 'week', 'month', 'year'

  // My Tasks State
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
  const currentUserDepts = user?.departments || (user?.department ? [user.department] : []);
  const currentUserRole = user?.role;

  // Date range calculation based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (dateFilter === 'week') {
      // This week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'month') {
      // This month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === 'year') {
      // Last 1 year
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    return { start: startDate, end: now };
  }, [dateFilter]);

  // --- Dashboard Logic ---

  const accessibleProjects = useMemo(() => {
    return projects.filter(p => {
      if (currentUserRole === 'admin') return true;
      if (p.owner === currentUserId || p.members?.includes(currentUserId) || p.members?.includes(Number(currentUserId))) return true;
      if (p.isPrivate) return false;
      if (currentUserDepts.length > 0 && (currentUserDepts.includes(p.departmentId) || currentUserDepts.includes(p.department))) return true;
      return false;
    });
  }, [projects, currentUserId, currentUserDepts, currentUserRole]);

  const accessibleProjectIds = useMemo(() => accessibleProjects.map(p => p._id), [accessibleProjects]);
  const accessibleTasks = useMemo(() => tasks.filter(t => accessibleProjectIds.includes(t.projectId)), [tasks, accessibleProjectIds]);

  const stats = useMemo(() => {
    let myTasks = accessibleTasks.filter(t => {
      const assigneeIds = t.assignees || [];
      return assigneeIds.includes(currentUserId) || assigneeIds.includes(Number(currentUserId));
    });

    // Filter by date range based on createdAt or updatedAt
    myTasks = myTasks.filter(t => {
      const taskDate = new Date(t.updatedAt || t.createdAt);
      return taskDate >= dateRange.start && taskDate <= dateRange.end;
    });

    // Status breakdowns
    const myTodoTasks = myTasks.filter(t => t.status === 'todo'); // Yapılacak
    const myWorkingTasks = myTasks.filter(t => t.status === 'working' || t.status === 'in_progress'); // Devam Ediyor
    const myStuckTasks = myTasks.filter(t => t.status === 'stuck'); // Takıldı
    const myReviewTasks = myTasks.filter(t => t.status === 'review'); // İncelemede
    const myDoneTasks = myTasks.filter(t => t.status === 'done'); // Tamamlandı

    // Grouping for progress calculation (Open tasks)
    const openTasks = myTasks.filter(t => t.status !== 'done');
    const totalProgress = openTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
    const averageProgress = openTasks.length > 0 ? Math.round(totalProgress / openTasks.length) : 0;

    // Legacy groupings for charts if needed
    const myInProgressTasks = [...myWorkingTasks, ...myStuckTasks, ...myReviewTasks];
    const myPendingTasks = [...myTodoTasks];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const overdueTasks = myTasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < todayStart;
    });

    return {
      myTasks,
      myTodoTasks,
      myWorkingTasks,
      myStuckTasks,
      myReviewTasks,
      myDoneTasks,
      myInProgressTasks,
      myPendingTasks,
      overdueTasks,
      averageProgress
    };
  }, [accessibleTasks, currentUserId, dateRange]);

  const quickStats = [
    { id: 'all', title: 'Toplam Görev', value: stats.myTasks.length, icon: <Target size={20} />, bgColor: 'bg-indigo-100 dark:bg-indigo-500/20', textColor: 'text-indigo-700 dark:text-indigo-300', action: () => setFilter('all') },
    { id: 'todo', title: 'Yapılacak', value: stats.myTodoTasks.length, icon: <Calendar size={20} />, bgColor: 'bg-slate-100 dark:bg-slate-700/50', textColor: 'text-slate-600 dark:text-slate-300', action: () => setFilter('todo') },
    { id: 'working', title: 'Devam Ediyor', value: stats.myWorkingTasks.length, icon: <Zap size={20} />, bgColor: 'bg-amber-100 dark:bg-amber-500/20', textColor: 'text-amber-700 dark:text-amber-300', action: () => setFilter('working') },
    { id: 'stuck', title: 'Takıldı', value: stats.myStuckTasks.length, icon: <AlertCircle size={20} />, bgColor: 'bg-rose-100 dark:bg-rose-500/20', textColor: 'text-rose-700 dark:text-rose-300', action: () => setFilter('stuck') },
    { id: 'review', title: 'İncelemede', value: stats.myReviewTasks.length, icon: <Search size={20} />, bgColor: 'bg-blue-100 dark:bg-blue-500/20', textColor: 'text-blue-700 dark:text-blue-300', action: () => setFilter('review') },
    { id: 'done', title: 'Tamamlandı', value: stats.myDoneTasks.length, icon: <CheckCircle size={20} />, bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-700 dark:text-emerald-300', action: () => setFilter('done') },
  ];

  // --- My Tasks Logic ---

  const statusGroups = {
    pending: { label: 'Bekleyen', statuses: ['todo', 'backlog', 'planning'] },
    in_progress: { label: 'Süreçte', statuses: ['working', 'in_progress', 'review', 'stuck'] },
    done: { label: 'Tamamlanan', statuses: ['done'] },
    overdue: { label: 'Geciken', statuses: [] }
  };

  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter && urlFilter !== filter) {
      setFilter(urlFilter);
    }
  }, [searchParams]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    // setSearchParams({ filter: newFilter }); // Optional: keep URL sync if desired, but user wants simple interaction
  };

  const filteredTasks = useMemo(() => {
    let result = stats.myTasks; // Use pre-calculated myTasks

    const now = new Date();
    if (filter === 'done') {
      result = result.filter(t => t.status === 'done');
    } else if (filter === 'todo') {
      result = result.filter(t => t.status === 'todo');
    } else if (filter === 'working') {
      result = result.filter(t => t.status === 'working' || t.status === 'in_progress');
    } else if (filter === 'stuck') {
      result = result.filter(t => t.status === 'stuck');
    } else if (filter === 'review') {
      result = result.filter(t => t.status === 'review');
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

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.id.toString().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [stats.myTasks, filter, searchQuery]);

  const getProjectName = (projectId) => {
    const p = projects.find(prj => prj.id === projectId || prj._id === projectId);
    return p ? p.name : 'Unknown Project';
  };

  const getProjectColor = (projectId) => {
    const p = projects.find(prj => prj.id === projectId || prj._id === projectId);
    return p ? p.color : '#cbd5e1';
  };

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

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  if (loading) return <div className="h-full bg-gray-50 dark:bg-gray-900 p-8 overflow-hidden"><DashboardSkeleton /></div>;

  return (
    <div className="h-full bg-gradient-to-br from-blue-50/20 via-emerald-50/20 to-amber-50/20 dark:from-gray-900 dark:via-blue-950/10 dark:to-emerald-950/10 overflow-y-auto relative">
      {/* Soft Animated Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-900 dark:to-teal-900 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-8 space-y-8">

        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2"
        >
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Merhaba, {user?.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 capitalize tracking-wider">
              <Calendar size={12} className="text-indigo-400" />
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Elegant Date Filter */}
          <div className="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-1 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm">
            {[
              { id: 'week', label: 'Haftalık' },
              { id: 'month', label: 'Aylık' },
              { id: 'year', label: 'Yıllık' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setDateFilter(option.id)}
                className={`px-4 py-1.5 text-[11px] font-bold capitalize tracking-wide rounded-lg transition-all ${dateFilter === option.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Weekly Progress Component */}
        <WeeklyProgress
          totalTasks={stats.myTasks.length}
          activeTasks={stats.myInProgressTasks.length}
          overdueTasks={stats.overdueTasks.length}
          completionRate={stats.averageProgress}
        />

        {/* INTEGRATED: Quick Stats & Task Grid */}
        <div className="space-y-6">

          {/* Quick Stats (Now Acting as Filters) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            {quickStats.map((stat, index) => {
              const isActive = filter === stat.id;
              return (
                <motion.div
                  key={index}
                  whileHover={{ y: -2 }}
                  onClick={stat.action}
                  className={`bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 cursor-pointer p-4 group relative overflow-hidden
                    ${isActive
                      ? 'border-indigo-500/50 shadow-lg shadow-indigo-100 dark:shadow-none bg-indigo-50/10'
                      : 'border-slate-50 dark:border-gray-700/50 hover:bg-slate-50/50 dark:hover:bg-gray-700/30'
                    }`}
                >
                  <div className="flex items-center gap-4 mb-2.5">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white' : `${stat.bgColor} ${stat.textColor} opacity-80`}`}>
                      {React.cloneElement(stat.icon, { size: 18 })}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium tracking-wide capitalize text-slate-500 dark:text-gray-400">{stat.title}</div>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full"
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Elegant Task Table - Replaces Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-100/50 dark:border-gray-800/50 shadow-sm overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_200px_150px_150px_100px] gap-4 px-6 py-3 bg-slate-50/50 dark:bg-gray-900/40 border-b border-slate-100/50 dark:border-gray-800/30">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-wider pl-8">Görev Adı</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-wider">Proje</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-wider">Son Tarih</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-wider">Durum</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-wider text-center">İlerleme</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-50/50 dark:divide-gray-800/20">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <Search size={32} className="opacity-10 mb-3" />
                  <h3 className="text-[11px] font-medium opacity-30 italic tracking-widest uppercase">Henüz bir kayıt bulunamadı</h3>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const statusStyle = getStatusStyle(task.status);
                  const projectColor = getProjectColor(task.projectId);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="group grid grid-cols-[1fr_200px_150px_150px_100px] gap-4 px-6 py-4 items-center hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors cursor-pointer relative"
                    >
                      {/* Task Name Column with Status Icon */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${task.status === 'done'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-500'
                          : 'border-slate-200 bg-white text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-400'
                          }`}>
                          {task.status === 'done' ? <CheckCircle size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <h3 className="text-[13px] font-medium text-slate-700 dark:text-gray-200 truncate pr-4">
                          {task.title}
                        </h3>
                      </div>

                      {/* Project Column */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: projectColor }} />
                        <span className="text-[12px] text-slate-400 dark:text-gray-500 truncate">
                          {getProjectName(task.projectId)}
                        </span>
                      </div>

                      {/* Deadline Column */}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[12px] ${isOverdue ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                        {task.priority === 'urgent' && !isOverdue && (
                          <span className="text-[9px] text-rose-500 capitalize tracking-tighter">Acil</span>
                        )}
                      </div>

                      {/* Status Column */}
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.text.replace('text-', 'bg-')} bg-opacity-70`} />
                          <span className={`text-[11px] font-medium ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                        </div>
                      </div>

                      {/* Progress Column */}
                      <div className="flex items-center gap-2 justify-center pr-2">
                        <div className="w-full max-w-[60px] h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 min-w-[28px]">{task.progress || 0}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

      </div >

      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />

      {
        isModalOpen && selectedTask && (
          <ModernTaskModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            initialSection="activity"
          />
        )
      }
    </div >
  );
};

export default Dashboard;
