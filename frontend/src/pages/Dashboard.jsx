import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Target, Zap, AlertCircle, Search, CheckCircle2,
  Clock, ChevronDown, ChevronRight, FileText, Activity, Users
} from 'lucide-react';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import ModernTaskModal from '../components/ModernTaskModal';
import NewTaskModal from '../components/NewTaskModal';
import { getAvatarUrl } from '../utils/avatarHelper';
import { tasksAPI } from '../services/api';

const Dashboard = () => {
  const { projects, users, departments } = useData(); // Keep meta-data from context, but NOT tasks
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dashboard State
  const [serverStats, setServerStats] = useState(null); // Independent Stats State
  const [taskList, setTaskList] = useState([]); // Independent Task List State

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true); // Lazy load tasks

  const [filter, setFilter] = useState(searchParams.get('filter') || 'in_progress');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Expanded states for accordions (default all open)
  const [expandedWorkspaces, setExpandedWorkspaces] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});

  const currentUserId = user?.id || localStorage.getItem('userId');

  // --- Data Fetching Methods (Defined outside useEffect for re-use) ---
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await tasksAPI.getDashboardStats();
      setServerStats(res.data);
    } catch (error) {
      console.error("Dashboard stats fetch failed:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await tasksAPI.getDashboardTasks(1, 100);
      setTaskList(res.data.tasks || []);
    } catch (error) {
      console.error("Dashboard tasks fetch failed:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const refreshDashboard = () => {
    fetchStats();
    fetchTasks();
  };

  // --- Initial Load ---
  useEffect(() => {
    if (!currentUserId) return;
    refreshDashboard();
  }, [currentUserId]);

  // --- Logic & Data Processing ---

  // 1. Stats Processing (with fallback)
  const stats = useMemo(() => {
    const s = serverStats || {};
    return {
      total: s.totalTasks || 0,
      todo: s.todoTasks || 0,
      inProgress: s.inProgressTasks || 0,
      stuck: s.stuckTasks || 0,
      review: s.reviewTasks || 0,
      done: s.completedTasks || 0,
      overdue: s.overdueTasks || 0,
      progressRate: Math.round(s.averageProgress || 0),
      continueCount: (s.inProgressTasks || 0) + (s.stuckTasks || 0) + (s.reviewTasks || 0) + (s.todoTasks || 0),
      doneCount: s.completedTasks || 0 // Use 'completedTasks' from API DTO
    };
  }, [serverStats]);

  // 2. Filtered Tasks for List
  const filteredTaskList = useMemo(() => {
    let result = taskList;

    if (filter === 'done') {
      result = result.filter(t => t.status === 'done');
    } else if (filter === 'in_progress') {
      result = result.filter(t => t.status !== 'done');
    }

    return result;
  }, [taskList, filter]);

  // 3. Grouping by Workspace -> Project
  const groupedData = useMemo(() => {
    const groups = {};

    filteredTaskList.forEach(task => { // Use filteredTaskList
      // Find project details (locally mapped from context or fallback from task props)
      const project = projects.find(p => p.id === task.projectId) || {
        id: task.projectId,
        name: task.projectName || 'Bilinmeyen Proje',
        departmentId: 0,
        color: task.projectColor || '#cbd5e1'
      };

      const deptId = project.departmentId;
      const department = departments.find(d => d.id === deptId) || { id: deptId, name: 'Genel' };

      if (!groups[deptId]) {
        groups[deptId] = {
          ...department,
          projects: {}
        };
      }

      if (!groups[deptId].projects[project.id]) {
        groups[deptId].projects[project.id] = {
          ...project,
          tasks: []
        };
      }

      groups[deptId].projects[project.id].tasks.push(task);
    });

    // Convert to array and sort
    return Object.values(groups).map(g => ({
      ...g,
      projects: Object.values(g.projects)
    }));
  }, [filteredTaskList, projects, departments]);


  // Effects for auto-expand
  useEffect(() => {
    const wState = {};
    const pState = {};

    groupedData.forEach(g => {
      wState[g.id] = true;
      g.projects.forEach(p => {
        pState[p.id] = true;
      });
    });
    setExpandedWorkspaces(prev => ({ ...prev, ...wState }));
    setExpandedProjects(prev => ({ ...prev, ...pState }));
  }, [groupedData.length, filter]);


  // Handlers
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchParams({ filter: newFilter });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const toggleWorkspace = (id) => {
    setExpandedWorkspaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleProject = (id) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
      case 'working': return <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">Devam Ediyor</span>;
      case 'todo': return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">Yapılacak</span>;
      case 'planning': return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">Planlanıyor</span>;
      case 'backlog': return <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">Backlog</span>;
      case 'done': return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">Tamamlandı</span>;
      case 'stuck': return <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold">Takıldı</span>;
      case 'review': return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold">İncelemede</span>;
      default: return <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">{status}</span>;
    }
  };


  if (loadingStats) return <div className="p-8"><DashboardSkeleton /></div>;

  return (
    <div className="h-full bg-gray-50/50 dark:bg-gray-900 p-4 lg:p-6 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header - More Compact */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Merhaba, {user?.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm shadow-indigo-200 transition-colors flex items-center gap-2"
          >
            <div className="bg-white/20 p-0.5 rounded">
              <Activity size={14} />
            </div>
            Hızlı Görev
          </button>
        </div>

        {/* Weekly Progress Bar - Compact */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Haftalık İlerleme</h2>
              {/* Progress Bar Container */}
              <div className="flex items-center gap-3 w-[300px] lg:w-[400px]">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progressRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">%{stats.progressRate}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Toplam Görev</div>
              </div>
              <div>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{stats.continueCount}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Devam Eden</div>
              </div>
              <div>
                <div className="text-xl font-bold text-rose-500 dark:text-rose-400">{stats.overdue}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Geciken</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards Grid - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm ring-1 ring-indigo-50 dark:ring-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Target size={16} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Toplam Görev</div>
          </div>

          {/* Not Started */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg">
                <Calendar size={16} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.todo}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Başlanmadı</div>
          </div>

          {/* In Progress */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
                <Zap size={16} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Devam Ediyor</div>
          </div>

          {/* Stuck */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg">
                <AlertCircle size={16} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.stuck}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Takıldı</div>
          </div>

          {/* Review */}
          <div className=" bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                <Search size={16} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.review}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">İncelemede</div>
          </div>

          {/* Overdue */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-lg">
                <Clock size={16} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.overdue}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Gecikti</div>
          </div>
        </div>

        {/* Filter Buttons - Compact */}
        <div className="flex gap-3">
          <button
            onClick={() => handleFilterChange('in_progress')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'in_progress'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
          >
            <Zap size={14} />
            Devam Eden
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filter === 'in_progress' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
              {stats.continueCount}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('done')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'done'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
          >
            <CheckCircle2 size={14} />
            Tamamlandı
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filter === 'done' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
              {stats.doneCount}
            </span>
          </button>
        </div>


        {/* Task List (Accordions) */}
        <div className="space-y-3 pb-8">
          {groupedData.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="text-slate-400" size={24} />
              </div>
              <h3 className="text-slate-900 dark:text-white font-medium text-sm">Görev Bulunamadı</h3>
              <p className="text-slate-500 text-xs mt-0.5">Seçili filtreye uygun görev yok.</p>
            </div>
          ) : (
            groupedData.map(workspace => (
              <div key={workspace.id} className="bg-indigo-50/30 dark:bg-slate-800/30 rounded-xl overflow-hidden border border-indigo-50/50 dark:border-slate-700/50">
                {/* Workspace Header */}
                <div
                  className="p-3 flex items-center gap-2 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleWorkspace(workspace.id)}
                >
                  <button className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                    {expandedWorkspaces[workspace.id] ? <ChevronDown size={18} className="text-indigo-600" /> : <ChevronRight size={18} />}
                  </button>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs">
                      <Users size={14} />
                    </div>
                    {workspace.name}
                  </div>
                  <div className="ml-auto text-[10px] font-bold bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full text-indigo-600 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-50 dark:ring-0">
                    {workspace.projects.reduce((acc, p) => acc + p.tasks.length, 0)} görev
                  </div>
                </div>

                {/* Projects List */}
                <AnimatePresence>
                  {expandedWorkspaces[workspace.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-indigo-100/50 dark:border-slate-700/50"
                    >
                      {workspace.projects.map(project => (
                        <div key={project.id} className="bg-white/50 dark:bg-slate-800/50">
                          {/* Project Header - More Compact */}
                          <div
                            className="pl-10 pr-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs group"
                            onClick={() => toggleProject(project.id)}
                          >
                            <div className={`w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-800`} style={{ backgroundColor: project.color || '#cbd5e1' }}></div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">{project.name}</span>
                            <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 font-medium">
                              {project.tasks.length}
                            </span>
                          </div>

                          {/* Tasks List */}
                          <AnimatePresence>
                            {(expandedProjects[project.id] !== false) && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                              >
                                {project.tasks.length === 0 ? (
                                  <div className="px-10 py-2 text-[10px] text-slate-400 italic">Bu projede görev yok.</div>
                                ) : (
                                  <div className="bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800/50">
                                    {/* Table Header - Clean and Small */}
                                    <div className="grid grid-cols-12 px-10 py-2 bg-slate-50/30 dark:bg-slate-800/30 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 dark:border-slate-800/50">
                                      <div className="col-span-5">Görev</div>
                                      <div className="col-span-2">Bitiş</div>
                                      <div className="col-span-2">Durum</div>
                                      <div className="col-span-1 text-center">Kişi</div>
                                      <div className="col-span-2 text-right">İlerleme</div>
                                    </div>

                                    {/* Task Rows - Compact */}
                                    {project.tasks.map(task => (
                                      <div
                                        key={task.id}
                                        onClick={() => handleTaskClick(task)}
                                        className="grid grid-cols-12 px-10 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-b border-slate-50 dark:border-slate-800/50 items-center cursor-pointer group transition-all"
                                      >
                                        <div className="col-span-5 flex items-center gap-3">
                                          <div className={`p-1 rounded-full transition-colors flex-shrink-0 ${task.status === 'done' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 group-hover:bg-white text-slate-300 group-hover:text-indigo-500 group-hover:ring-2 ring-indigo-50'}`}>
                                            {task.status === 'done' ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                                          </div>
                                          <span className={`text-xs font-semibold truncate ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-600'}`}>
                                            {task.title}
                                          </span>
                                        </div>
                                        <div className="col-span-2 text-[10px] font-medium text-slate-500">
                                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                                        </div>
                                        <div className="col-span-2">
                                          {getStatusBadge(task.status)}
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                          {task.assignees && task.assignees.length > 0 ? (
                                            <div className="flex -space-x-1.5">
                                              {task.assignees.slice(0, 3).map((assignee, idx) => {
                                                // Assignee is now an object: { id, fullName, avatar }
                                                const avatarSrc = getAvatarUrl(assignee.avatar);

                                                // Initials fallback logic
                                                const initials = assignee.fullName
                                                  ? assignee.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                                  : '??';

                                                return (
                                                  <div
                                                    key={idx}
                                                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600 shadow-sm overflow-hidden"
                                                    title={assignee.fullName}
                                                  >
                                                    {assignee.avatar ? (
                                                      <>
                                                        <img
                                                          src={avatarSrc}
                                                          alt={assignee.fullName || 'User'}
                                                          className="w-full h-full rounded-full object-cover"
                                                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                        <span className="hidden w-full h-full items-center justify-center bg-indigo-50 text-indigo-600">{initials}</span>
                                                      </>
                                                    ) : (
                                                      <span className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600">{initials}</span>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <span className="text-slate-300">-</span>
                                          )}
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${task.progress || 0}%` }}></div>
                                          </div>
                                          <span className="text-[9px] font-bold text-slate-400 w-5 text-right">{task.progress || 0}%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>

      </div>

      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />

      {isModalOpen && selectedTask && (
        <ModernTaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            refreshDashboard(); // <--- Auto-refresh on close
          }}
          initialSection="subtasks"
        />
      )}
    </div>
  );
};

export default Dashboard;
