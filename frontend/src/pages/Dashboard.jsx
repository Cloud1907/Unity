import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  ChevronRight, CheckCircle, Clock, AlertCircle,
  Calendar, Plus, Target, Zap, Activity, ArrowUpRight, TrendingUp, Users,
  Filter, Search
} from 'lucide-react';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import NewTaskModal from '../components/NewTaskModal';
import ModernTaskModal from '../components/ModernTaskModal';
import { Badge } from '../components/ui/badge';

const Dashboard = () => {
  const { projects, tasks, users, loading } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dashboard State
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // My Tasks State
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
  const currentUserDepts = user?.departments || (user?.department ? [user.department] : []);
  const currentUserRole = user?.role;

  // --- Dashboard Logic ---

  const accessibleProjects = useMemo(() => {
    return projects.filter(p => {
      if (currentUserRole === 'admin') return true;
      if (p.owner === currentUserId || p.members?.includes(currentUserId)) return true;
      if (p.isPrivate) return false;
      if (currentUserDepts.length > 0 && currentUserDepts.includes(p.department)) return true;
      return false;
    });
  }, [projects, currentUserId, currentUserDepts, currentUserRole]);

  const accessibleProjectIds = useMemo(() => accessibleProjects.map(p => p._id), [accessibleProjects]);
  const accessibleTasks = useMemo(() => tasks.filter(t => accessibleProjectIds.includes(t.projectId)), [tasks, accessibleProjectIds]);

  const stats = useMemo(() => {
    const myTasks = accessibleTasks.filter(t => t.assignees?.includes(currentUserId));
    const myCompletedTasks = myTasks.filter(t => t.status === 'done');
    const workingStatuses = ['working', 'in_progress', 'review', 'stuck'];
    const myInProgressTasks = myTasks.filter(t => workingStatuses.includes(t.status));
    const pendingStatuses = ['todo', 'backlog', 'planning'];
    const myPendingTasks = myTasks.filter(t => pendingStatuses.includes(t.status));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const overdueTasks = myTasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < todayStart;
    });

    const openTasks = myTasks.filter(t => t.status !== 'done');
    const totalProgress = openTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
    const averageProgress = openTasks.length > 0 ? Math.round(totalProgress / openTasks.length) : 0;

    return { myTasks, myCompletedTasks, myInProgressTasks, myPendingTasks, overdueTasks, averageProgress, openTasksCount: openTasks.length };
  }, [accessibleTasks, currentUserId]);

  const quickStats = [
    { title: 'Toplam Görevler', value: stats.myTasks.length, icon: <Target size={20} />, bgColor: 'bg-blue-100 dark:bg-blue-500/20', textColor: 'text-blue-700 dark:text-blue-300', action: () => setFilter('all') },
    { title: 'Devam Eden', value: stats.myInProgressTasks.length, icon: <Zap size={20} />, bgColor: 'bg-amber-100 dark:bg-amber-500/20', textColor: 'text-amber-700 dark:text-amber-300', action: () => setFilter('in_progress') },
    { title: 'Tamamlanan', value: stats.myCompletedTasks.length, icon: <CheckCircle size={20} />, bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-700 dark:text-emerald-300', action: () => setFilter('done') },
    { title: 'Geciken', value: stats.overdueTasks.length, icon: <AlertCircle size={20} />, bgColor: 'bg-rose-100 dark:bg-rose-500/20', textColor: 'text-rose-700 dark:text-rose-300', action: () => setFilter('overdue') }
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
    setSearchParams({ filter: newFilter });
  };

  const filteredTasks = useMemo(() => {
    let result = stats.myTasks; // Use pre-calculated myTasks

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
      case 'working': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Çalışılıyor' };
      case 'stuck': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Takıldı' };
      case 'review': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'İnceleme' };
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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Merhaba, {user?.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* New Task Button Removed */}
        </motion.div>

        {/* Charts Section (Team Summary & Progress) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Haftalık Ekip Özeti</h2>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Görev dağılımı</p>
            </div>
            <div className="p-5 space-y-4">
              {(() => {
                const teamMembers = Array.from(new Set(accessibleTasks.flatMap(t => t.assignees || []))).slice(0, 6);
                const maxTasks = Math.max(...teamMembers.map(memberId => accessibleTasks.filter(t => t.assignees?.includes(memberId) && t.status !== 'done').length), 1);

                return teamMembers.map((memberId, idx) => {
                  const member = users.find(u => u.id == memberId || u._id == memberId);
                  const memberTasks = accessibleTasks.filter(t => t.assignees?.includes(memberId) && t.status !== 'done');
                  const percentage = (memberTasks.length / maxTasks) * 100;
                  const displayName = member?.fullName || member?.username || `Kullanıcı ${memberId}`;

                  return (
                    <motion.div key={memberId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                      <div className="flex items-center gap-3 mb-2">
                        <img src={member?.avatar ? (member.avatar.startsWith('http') ? member.avatar : `http://localhost:5052${member.avatar}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt={displayName} className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayName}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{memberTasks.length} aktif</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{memberTasks.length}</div>
                      </div>
                      <div className="relative h-2 bg-gray-100 dark:bg-gray-700/20 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, delay: 0.3 + idx * 0.1 }} className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </motion.div>

          {/* Progress Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">İlerleme</h3>
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-blue-100 dark:text-blue-900/50" />
                <motion.circle cx="80" cy="80" r="70" stroke="url(#gradient-navy)" strokeWidth="12" fill="transparent" strokeLinecap="round" initial={{ strokeDashoffset: 440 }} animate={{ strokeDashoffset: 440 - (440 * (stats.averageProgress / 100)) }} transition={{ duration: 1.5, delay: 0.5 }} strokeDasharray="440" />
                <defs>
                  <linearGradient id="gradient-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#1e40af" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }} className="text-3xl font-black bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent">{stats.averageProgress}%</motion.div>
                <div className="text-[10px] text-gray-400 mt-1 text-center leading-3">Açık İşlerin<br />Ortalaması</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><span className="text-xs text-gray-600 dark:text-gray-400">Tamamlanan</span><span className="text-sm font-bold text-gray-900 dark:text-white">{stats.myCompletedTasks.length}</span></div>
              <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><span className="text-xs text-gray-600 dark:text-gray-400">Devam Eden</span><span className="text-sm font-bold text-gray-900 dark:text-white">{stats.myInProgressTasks.length}</span></div>
              <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><span className="text-xs text-gray-600 dark:text-gray-400">Bekleyen</span><span className="text-sm font-bold text-gray-900 dark:text-white">{stats.myPendingTasks.length}</span></div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {quickStats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -2 }}
              onClick={stat.action}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-all cursor-pointer hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.title}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* MERGED: My Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">İşlerim</h2>
              <p className="text-xs text-slate-500">Üzerimdeki görevler</p>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500 w-full md:w-auto">
              <Search className="ml-2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Görevlerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm w-full md:w-64 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                            ${filter === f.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                    : 'bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>

          {/* Task Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                <Search size={32} className="opacity-50 mb-2" />
                <h3 className="text-sm font-semibold">Görev Bulunamadı</h3>
              </div>
            ) : (
              filteredTasks.map(task => {
                const statusStyle = getStatusStyle(task.status);
                const projectColor = getProjectColor(task.projectId);

                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                  >
                    <div className="h-1 w-full" style={{ backgroundColor: projectColor }}></div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-auto font-medium text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 truncate max-w-[120px]">
                          {getProjectName(task.projectId)}
                        </Badge>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-snug line-clamp-2 md:line-clamp-3 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </h3>
                      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className={new Date(task.dueDate) < new Date() ? 'text-rose-500' : 'text-slate-400'} />
                          <span className={new Date(task.dueDate) < new Date() ? 'font-semibold text-rose-500' : ''}>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                          </span>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-300'
                          }`}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

      </div>

      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />

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

export default Dashboard;
