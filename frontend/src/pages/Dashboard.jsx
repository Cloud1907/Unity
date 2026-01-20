import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, CheckCircle, Clock, AlertCircle,
  Calendar, Plus, Target, Zap, Activity, ArrowUpRight, TrendingUp, Users
} from 'lucide-react';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import NewTaskModal from '../components/NewTaskModal';

const Dashboard = () => {
  const { projects, tasks, users, loading } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
  const currentUserDepts = user?.departments || (user?.department ? [user.department] : []);
  const currentUserRole = user?.role;

  const accessibleProjects = useMemo(() => {
    return projects.filter(p => {
      if (currentUserRole === 'admin') return true;
      if (p.owner === currentUserId || p.members?.includes(currentUserId)) return true;
      if (p.isPrivate) return false;
      // Check if project department is in user's departments array
      if (currentUserDepts.length > 0 && currentUserDepts.includes(p.department)) return true;
      return false;
    });
  }, [projects, currentUserId, currentUserDepts, currentUserRole]);

  const accessibleProjectIds = useMemo(() => accessibleProjects.map(p => p._id), [accessibleProjects]);
  const accessibleTasks = useMemo(() => tasks.filter(t => accessibleProjectIds.includes(t.projectId)), [tasks, accessibleProjectIds]);

  const stats = useMemo(() => {
    const myTasks = accessibleTasks.filter(t => t.assignees?.includes(currentUserId));
    const myCompletedTasks = myTasks.filter(t => t.status === 'done');

    // Group "In Progress" statuses
    const workingStatuses = ['working', 'in_progress', 'review', 'stuck'];
    const myInProgressTasks = myTasks.filter(t => workingStatuses.includes(t.status));

    // Group "Pending" statuses
    const pendingStatuses = ['todo', 'backlog', 'planning'];
    const myPendingTasks = myTasks.filter(t => pendingStatuses.includes(t.status));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const overdueTasks = myTasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < todayStart;
    });

    // Calculate Average Progress of OPEN tasks (not done)
    const openTasks = myTasks.filter(t => t.status !== 'done');
    const totalProgress = openTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
    const averageProgress = openTasks.length > 0 ? Math.round(totalProgress / openTasks.length) : 0;

    return { myTasks, myCompletedTasks, myInProgressTasks, myPendingTasks, overdueTasks, averageProgress, openTasksCount: openTasks.length };
  }, [accessibleTasks, currentUserId]);

  const quickStats = [
    { title: 'Toplam Görevler', value: stats.myTasks.length, icon: <Target size={20} />, bgColor: 'bg-blue-100 dark:bg-blue-500/20', textColor: 'text-blue-700 dark:text-blue-300', link: '/my-tasks?filter=all' },
    { title: 'Devam Eden', value: stats.myInProgressTasks.length, icon: <Zap size={20} />, bgColor: 'bg-amber-100 dark:bg-amber-500/20', textColor: 'text-amber-700 dark:text-amber-300', link: '/my-tasks?filter=in_progress' },
    { title: 'Tamamlanan', value: stats.myCompletedTasks.length, icon: <CheckCircle size={20} />, bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-700 dark:text-emerald-300', link: '/my-tasks?filter=done' },
    { title: 'Geciken', value: stats.overdueTasks.length, icon: <AlertCircle size={20} />, bgColor: 'bg-rose-100 dark:bg-rose-500/20', textColor: 'text-rose-700 dark:text-rose-300', link: '/my-tasks?filter=overdue' }
  ];

  if (loading) return <div className="h-full bg-gray-50 dark:bg-gray-900 p-8 overflow-hidden"><DashboardSkeleton /></div>;

  return (
    <div className="h-full bg-gradient-to-br from-blue-50/20 via-emerald-50/20 to-amber-50/20 dark:from-gray-900 dark:via-blue-950/10 dark:to-emerald-950/10 overflow-y-auto relative">
      {/* Soft Animated Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-900 dark:to-teal-900 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">

        {/* Minimal Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
          >
            <Plus size={18} />
            Yeni Görev
          </button>
        </motion.div>

        {/* Minimal Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {quickStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(stat.link)}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Team Summary - Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Haftalık Ekip Özeti</h2>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Görev dağılımı</p>
            </div>

            <div className="p-5 space-y-4">
              {(() => {
                const teamMembers = Array.from(new Set(
                  accessibleTasks.flatMap(t => t.assignees || [])
                )).slice(0, 6);

                const maxTasks = Math.max(...teamMembers.map(memberId =>
                  accessibleTasks.filter(t => t.assignees?.includes(memberId) && t.status !== 'done').length
                ), 1);

                return teamMembers.map((memberId, idx) => {
                  const member = users.find(u => u._id === memberId);
                  const memberTasks = accessibleTasks.filter(t => t.assignees?.includes(memberId) && t.status !== 'done');
                  const completedTasks = accessibleTasks.filter(t => t.assignees?.includes(memberId) && t.status === 'done').length;
                  const percentage = (memberTasks.length / maxTasks) * 100;

                  return (
                    <motion.div
                      key={memberId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={
                            member?.avatar
                              ? (member.avatar.startsWith('http') ? member.avatar : `http://localhost:8080${member.avatar}`)
                              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${member?.fullName || memberId}`
                          }
                          alt={member?.fullName || 'User'}
                          className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{member?.fullName || 'Kullanıcı'}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{memberTasks.length} aktif</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{memberTasks.length}</div>
                      </div>

                      <div className="relative h-2 bg-gray-100 dark:bg-gray-700/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                          className={`absolute inset-y-0 left-0 rounded-full ${['bg-gradient-to-r from-pink-500 to-rose-500',
                            'bg-gradient-to-r from-blue-500 to-cyan-500',
                            'bg-gradient-to-r from-amber-500 to-orange-500',
                            'bg-gradient-to-r from-emerald-500 to-teal-500',
                            'bg-gradient-to-r from-violet-500 to-purple-500',
                            'bg-gradient-to-r from-orange-500 to-red-500'][idx % 6]
                            }`}
                        />
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </motion.div>

          {/* Side Stats - Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">İlerleme</h3>

            {/* Sweet Progress */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-blue-100 dark:text-blue-900/50" />
                <motion.circle
                  cx="80" cy="80" r="70"
                  stroke="url(#gradient-navy)" strokeWidth="12" fill="transparent" strokeLinecap="round"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * (stats.averageProgress / 100)) }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  strokeDasharray="440"
                />
                <defs>
                  <linearGradient id="gradient-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#1e40af" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="text-3xl font-black bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent"
                >
                  {stats.averageProgress}%
                </motion.div>
                <div className="text-[10px] text-gray-400 mt-1 text-center leading-3">Açık İşlerin<br />Ortalaması</div>
              </div>
            </div>

            {/* Stats List */}
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="text-xs text-gray-600 dark:text-gray-400">Tamamlanan</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.myCompletedTasks.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="text-xs text-gray-600 dark:text-gray-400">Devam Eden</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.myInProgressTasks.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="text-xs text-gray-600 dark:text-gray-400">Bekleyen</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.myPendingTasks.length}</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
      {/* Global New Task Modal */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />
    </div>
  );
};

export default Dashboard;
