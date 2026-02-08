import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import UserAvatar from './ui/shared/UserAvatar';
import { getAvatarUrl } from '../utils/avatarHelper';
import { filterProjectUsers } from '../utils/userHelper';
import { getId } from '../utils/entityHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock,
  User,
  Mail,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Briefcase,
  Layers
} from 'lucide-react';

const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#94a3b8' },
  { id: 'working', label: 'Devam Ediyor', color: '#f59e0b' },
  { id: 'stuck', label: 'Takıldı', color: '#ef4444' },
  { id: 'done', label: 'Tamamlandı', color: '#10b981' },
  { id: 'review', label: 'İncelemede', color: '#3b82f6' }
];

const UserWorkloadCard = ({ user, index, tasks, projects, totalProjectActiveItems, isThisWeek, getStatusColor }) => {
  const uid = user.id;

  const userTasks = useMemo(() => {
    return tasks.filter(task => (task.assigneeIds || []).includes(uid));
  }, [tasks, uid]);

  const { userActiveItemCount, startedCount, completedThisWeekCount } = useMemo(() => {
    let active = 0;
    let started = 0;
    let completed = 0;

    tasks.forEach(task => {
      const isAssignedToMain = (task.assigneeIds || []).includes(uid);
      const isMainDone = task.status === 'done';

      if (isAssignedToMain) {
        if (!isMainDone) active++;
        if (task.status === 'working' || (task.progress || 0) > 0) started++;
        if (isMainDone && isThisWeek(task.updatedAt)) completed++;
      }

      // Check subtasks
      (task.subtasks || []).forEach(st => {
        const stAssignees = st.assigneeIds || [];
        if (stAssignees.includes(uid)) {
          if (!st.completed) active++;
          if (st.completed && isThisWeek(st.updatedAt || task.updatedAt)) completed++;
        }
      });
    });

    return { userActiveItemCount: active, startedCount: started, completedThisWeekCount: completed };
  }, [tasks, uid, isThisWeek]);

  const workloadShare = totalProjectActiveItems > 0
    ? Math.round((userActiveItemCount / totalProjectActiveItems) * 100)
    : 0;

  const efficiency = (userActiveItemCount + completedThisWeekCount) > 0
    ? Math.round((completedThisWeekCount / (userActiveItemCount + completedThisWeekCount)) * 100)
    : 0;

  const densityGradient = workloadShare >= 50 ? 'from-rose-500 to-rose-600' : workloadShare >= 25 ? 'from-amber-400 to-amber-500' : 'from-emerald-400 to-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white dark:border-slate-700 rounded-2xl p-4 shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-xl transition-all group"
    >
      {/* Header: User Profile */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <UserAvatar
              user={user}
              size="lg"
              className="w-12 h-12 ring-2 ring-white dark:ring-slate-700 shadow-lg"
            />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1 ml-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate pr-2">
              {user.fullName}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-500 truncate">
              <Mail size={12} className="shrink-0" />
              <span className="text-[11px] font-medium leading-none truncate">{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider mb-1">Açık görevler</span>
            <div className="flex items-center gap-1">
              <Briefcase size={12} className="text-slate-400" />
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">{userActiveItemCount}</span>
            </div>
          </div>
          <div className="flex flex-col border-x border-slate-100 dark:border-slate-700 px-3">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider mb-1">Başlanan</span>
            <div className="flex items-center gap-1">
              <Activity size={12} className="text-amber-500" />
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">{startedCount}</span>
            </div>
          </div>
          <div className="flex flex-col pl-3">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 truncate">Tamamlanan</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">{completedThisWeekCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">İş yoğunluğu analizi</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono tracking-tighter">%{workloadShare}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">Puanı</span>
            <div className="flex items-center justify-end gap-1 text-indigo-600 dark:text-indigo-400">
              <TrendingUp size={12} />
              <span className="text-sm font-bold tracking-tighter font-mono">%{efficiency}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-4 overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${workloadShare}%` }}
              transition={{ duration: 1, ease: "circOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${densityGradient} shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
            />
          </div>
        </div>

      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
          <h4 className="text-[9px] font-bold text-slate-400 tracking-widest">Öncelikli görevler</h4>
        </div>
        {userTasks.slice(0, 4).map(task => (
          <div key={task.id} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl transition-all duration-300 group/item border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                style={{ backgroundColor: getStatusColor(task.status) }}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                {task.title}
                <span className="block text-[8px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">{projects.find(p => p.id === task.projectId)?.name || 'Proje Bilgisi Boş'}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end">
                <div className="w-12 bg-slate-100 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${task.progress || 0}%` }}
                  />
                </div>
              </div>
              <ChevronRight size={10} className="text-slate-300 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
            </div>
          </div>
        ))}
        {userTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <Clock size={20} className="text-slate-300" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 italic">Şu an aktif bir görev bulunmuyor</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const WorkloadView = ({ boardId }) => {
  const { tasks: allTasks, users: allUsers, projects, fetchTasks } = useData();

  // Fetch tasks when boardId changes
  React.useEffect(() => {
    if (boardId) {
      // Optimize: Prevent flash/refresh loop if tasks exist
      const hasTasks = allTasks.some(t => t.projectId === Number(boardId));
      if (!hasTasks) {
        fetchTasks(boardId);
      }
    }
  }, [boardId, allTasks, fetchTasks]);


  // Data Normalization & Filtering
  const { projectMembers, boardTasks, totalProjectActiveItems } = useMemo(() => {
    const bId = getId(boardId);
    const currentProject = projects.find(p => p.id === bId);

    // Normalize tasks
    const boardTasks = allTasks.filter(t => t.projectId === bId).map(t => ({
      ...t,
      assigneeIds: t.assigneeIds || (t.assignees || []).map(a => a.userId || a.id)
    }));

    // Count total active items
    let totalItems = 0;
    boardTasks.forEach(t => {
      if (t.status !== 'done') totalItems++;
      (t.subtasks || []).forEach(st => {
        if (!st.completed) totalItems++;
      });
    });

    // Use strict filtering for Workload View (No Admin Bypass)
    // We want to see ONLY people explicitly in the team/department
    const pMembers = (currentProject?.members || []).map(m => String(m.userId || m.id));
    const pDeptId = String(currentProject?.departmentId || '');

    const members = allUsers.filter(u => {
      // 1. Department Member Check (Core Team) - ALWAYS SHOW
      const isInDept = pDeptId && (u.departments || []).some(d => String(d.departmentId || d.id || d) === pDeptId);
      if (isInDept) return true;

      // 2. Explicit Member Check (Guests/Owners)
      if (pMembers.includes(String(u.id))) {
        // FIX for "Egemen" issue:
        // If the user is the Project Owner/Creator but is NOT in the department anymore,
        // assume they are a "Stale Owner" and hide them (unless they have active tasks).

        // Check task assignments (requires taskAssigneeIds set calculated above)
        // (We need to recalculate taskAssigneeIds here or assume logic)
        // Let's rely on Owner check for now as 'Egemen created the group'.

        const isOwner = String(u.id) === String(currentProject?.owner || currentProject?.created_by || currentProject?.Owner || currentProject?.CreatedBy);

        if (isOwner && !isInDept) {
          // Only hide if they have NO tasks assigned?
          // The user view shows "0 tasks".
          // We need to check tasks.
          const hasTasks = boardTasks.some(t => (t.assigneeIds || []).includes(u.id));
          if (!hasTasks) return false;
        }

        return true;
      }

      return false;
    });

    return { projectMembers: members, boardTasks, totalProjectActiveItems: totalItems };
  }, [boardId, allTasks, allUsers, projects]);

  const getStatusColor = (statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#94a3b8';
  };

  const getUserTasks = (userId) => {
    const uid = getId(userId);
    return boardTasks.filter(task => {
      return (task.assigneeIds || []).includes(uid);
    });
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  };

  return (
    <div className="h-full w-full overflow-auto bg-slate-50/50 dark:bg-[#0f172a] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold tracking-tight uppercase text-[9px]">
              <Activity size={10} />
              <span>Yük dağılım analizi</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Ekip iş yükü</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Proje bazlı görev yoğunluğu ve ortalama ilerleme analizi</p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Dengeli</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Yoğun</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Kritik</span>
            </div>
          </div>
        </motion.div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {projectMembers.map((user, index) => (
              <UserWorkloadCard
                key={user.id}
                user={user}
                index={index}
                tasks={boardTasks}
                projects={projects}
                totalProjectActiveItems={totalProjectActiveItems}
                isThisWeek={isThisWeek}
                getStatusColor={getStatusColor}
              />
            ))}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WorkloadView;
