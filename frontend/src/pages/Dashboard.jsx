import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  Calendar, Target, Zap, AlertCircle, Search, CheckCircle2,
  Clock, ChevronDown, ChevronRight, FileText, Activity, Users
} from 'lucide-react';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import ModernTaskModal from '../components/ModernTaskModal';
import NewTaskModal from '../components/NewTaskModal';
import UserAvatar from '../components/ui/shared/UserAvatar';
import { getAvatarUrl } from '../utils/avatarHelper';
import { tasksAPI } from '../services/api';
import useMediaQuery from '../hooks/useMediaQuery';

import GreetingAnimation from '../components/dashboard/GreetingAnimation';
import CountUp from '../components/dashboard/CountUp';


const Dashboard = () => {
  const { projects, users, departments } = useData(); // Keep meta-data from context, but NOT tasks
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  // Dashboard State
  const [serverStats, setServerStats] = useState(null); // Independent Stats State
  const [taskList, setTaskList] = useState([]); // Independent Task List State

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true); // Lazy load tasks

  const [filter, setFilter] = useState(searchParams.get('filter') || 'in_progress');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [startProgress, setStartProgress] = useState(false); // Trigger for progress bar

  useEffect(() => {
    // Delay progress bar animation slightly to ensure visible "filling" effect
    const timer = setTimeout(() => setStartProgress(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
    } else if (filter === 'todo') {
      result = result.filter(t => t.status === 'todo');
    } else if (filter === 'working') {
      result = result.filter(t => t.status === 'working' || t.status === 'in_progress');
    } else if (filter === 'stuck') {
      result = result.filter(t => t.status === 'stuck');
    } else if (filter === 'review') {
      result = result.filter(t => t.status === 'review');
    } else if (filter === 'overdue') {
      result = result.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      );
    }
    // 'all' filter shows everything (no filtering)

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


  // Handlers (stabilized with useCallback)
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setSearchParams({ filter: newFilter });
  }, [setSearchParams]);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  const toggleWorkspace = useCallback((id) => {
    setExpandedWorkspaces(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleProject = useCallback((id) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const getStatusBadge = useCallback((status) => {
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
  }, []);


  if (loadingStats) return <div className="p-8"><DashboardSkeleton /></div>;

  return (
    <div className={`h-full bg-gray-50/50 dark:bg-gray-900 ${isMobile ? 'p-3' : 'p-4 lg:p-6'} overflow-y-auto`}>
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header - More Compact */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 min-h-[32px]">
              {user && !loadingStats && (
                <GreetingAnimation text={`Merhaba, ${user?.fullName?.split(' ')[0]}`} />
              )}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Weekly Progress Bar - Premium Glassmorphism */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-slate-700/50 shadow-xl shadow-indigo-500/5">
          <div className={`flex ${isMobile ? 'flex-col gap-6' : 'items-center justify-between'} mb-3`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-indigo-500" />
                <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">Haftalık İlerleme</h2>
              </div>
              <div className={`flex items-center gap-4 ${isMobile ? 'w-full' : 'w-[400px] lg:w-[500px]'}`}>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: startProgress ? `${stats.progressRate}%` : 0 }}
                    transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/30"
                  />
                </div>
                <div className="flex items-center gap-1 min-w-[50px]">
                  <CountUp 
                    to={stats.progressRate} 
                    prefix="%" 
                    play={startProgress}
                    className="text-indigo-600 dark:text-indigo-400 font-black text-lg" 
                  />
                </div>
              </div>
            </div>

            {/* Stats Row - Premium Styling */}
            <div className={`flex ${isMobile ? 'justify-around' : 'gap-12'} items-end text-center`}>
              <div className="group transition-transform hover:scale-110">
                <CountUp to={stats.total} className="text-3xl font-black text-slate-900 dark:text-white leading-none" />
                <div className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter">Toplam</div>
              </div>
              <div className="group transition-transform hover:scale-110">
                <CountUp to={stats.continueCount} className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none" />
                <div className="text-[10px] text-indigo-400/70 font-bold mt-1 tracking-tighter">Aktif</div>
              </div>
              <div className="group transition-transform hover:scale-110">
                <CountUp to={stats.overdue} className="text-3xl font-black text-rose-500 dark:text-rose-400 leading-none" />
                <div className="text-[10px] text-rose-400/70 font-bold mt-1 tracking-tighter">Geciken</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards Grid - Professional Glassmorphism */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'} gap-4`}>
          {/* Total */}
          <div 
            onClick={() => handleFilterChange('all')}
            className={`group h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-2xl cursor-pointer transition-[transform,box-shadow] duration-200 ease-out flex flex-col justify-between border shadow-sm hover:shadow-lg hover:scale-[1.02] ${
              filter === 'all' 
                ? 'border-indigo-500 ring-4 ring-indigo-500/10' 
                : 'border-slate-200 dark:border-slate-700/50 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                <Target size={18} />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider">Toplam Görev</div>
          </div>

          {/* Not Started */}
          <div 
            onClick={() => handleFilterChange('todo')}
            className={`group h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border shadow-sm hover:shadow-lg hover:scale-[1.02] ${
              filter === 'todo'
                ? 'border-slate-500 ring-4 ring-slate-500/10'
                : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
              <CountUp to={stats.todo} className="text-2xl font-black text-slate-900 dark:text-white leading-none" />
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider">Başlanmadı</div>
          </div>

          {/* In Progress */}
          <div 
            onClick={() => handleFilterChange('working')}
            className={`group h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border shadow-sm hover:shadow-lg hover:scale-[1.02] ${
              filter === 'working'
                ? 'border-amber-500 ring-4 ring-amber-500/10'
                : 'border-slate-200 dark:border-slate-700/50 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                <Zap size={18} />
              </div>
              <CountUp to={stats.inProgress} className="text-2xl font-black text-slate-900 dark:text-white leading-none" />
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider">Devam Ediyor</div>
          </div>

          {/* Stuck */}
          <div 
            onClick={() => handleFilterChange('stuck')}
            className={`group h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border shadow-sm hover:shadow-lg hover:scale-[1.02] ${
              filter === 'stuck'
                ? 'border-rose-500 ring-4 ring-rose-500/10'
                : 'border-slate-200 dark:border-slate-700/50 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                <AlertCircle size={18} />
              </div>
              <CountUp to={stats.stuck} className="text-2xl font-black text-slate-900 dark:text-white leading-none" />
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider">Takıldı</div>
          </div>

          {/* Review */}
          <div 
            onClick={() => handleFilterChange('review')}
            className={`group h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border shadow-sm hover:shadow-lg hover:scale-[1.02] ${
              filter === 'review'
                ? 'border-blue-500 ring-4 ring-blue-500/10'
                : 'border-slate-200 dark:border-slate-700/50 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                <Search size={18} />
              </div>
              <CountUp to={stats.review} className="text-2xl font-black text-slate-900 dark:text-white leading-none" />
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider">İncelemede</div>
          </div>

          {/* Overdue */}
          <div 
            onClick={() => handleFilterChange('overdue')}
            className={`group h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border shadow-sm hover:shadow-lg hover:scale-[1.02] ${
              filter === 'overdue'
                ? 'border-rose-500 ring-4 ring-rose-500/10 shadow-lg shadow-rose-500/10'
                : 'border-slate-200 dark:border-slate-700/50 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                <Clock size={18} />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.overdue}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider">Gecikti</div>
          </div>
        </div>

        {/* Filter Buttons - Compact */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
          >
            <Target size={14} />
            Tümü
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filter === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('in_progress')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'in_progress'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
          >
            <Zap size={14} />
            {isMobile ? 'Devam' : 'Devam Eden'}
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
            {isMobile ? 'Biten' : 'Tamamlandı'}
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
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
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
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                style={{ overflow: 'hidden' }}
                              >
                                {project.tasks.length === 0 ? (
                                  <div className="px-10 py-2 text-[10px] text-slate-400 italic">Bu projede görev yok.</div>
                                ) : (
                                  <div className="bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800/50">
                                    {isMobile ? (
                                      /* Mobile CARD View */
                                      <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {project.tasks.map(task => (
                                          <div
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className="p-4 active:bg-slate-50 dark:active:bg-slate-800/80 cursor-pointer space-y-2"
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex items-start gap-3 min-w-0">
                                                <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'}`}>
                                                  {task.status === 'done' ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                                                </div>
                                                <span className={`text-[13px] font-semibold leading-relaxed break-words ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                                  {task.title}
                                                </span>
                                              </div>
                                              <div className="flex-shrink-0">
                                                {getStatusBadge(task.status)}
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] text-slate-500 pl-7">
                                              <div className="flex items-center gap-3">
                                                {task.dueDate && (
                                                  <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>{new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                  </div>
                                                )}
                                                <div className="flex items-center gap-1.5">
                                                  <div className="w-12 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${task.progress || 0}%` }}></div>
                                                  </div>
                                                  <span className="font-bold">{task.progress || 0}%</span>
                                                </div>
                                              </div>

                                              {(task.assigneeIds && task.assigneeIds.length > 0) || (task.assignees && task.assignees.length > 0) ? (
                                                <div className="flex -space-x-1.5">
                                                  {(() => {
                                                    // Resolve Users
                                                    const rawIds = task.assigneeIds || task.assignees?.map(a => a.id || a.userId) || [];
                                                    const resolved = rawIds.map(id => users.find(u => Number(u.id) === Number(id)) || { id, fullName: 'Bilinmeyen' });
                                                    
                                                    return resolved.slice(0, 3).map((assignee, idx) => (
                                                      <UserAvatar
                                                        key={idx}
                                                        user={assignee}
                                                        size="xs"
                                                        className="w-5 h-5 border border-white dark:border-slate-800 shadow-sm"
                                                      />
                                                    ));
                                                  })()}
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      /* Desktop TABLE View */
                                      <>
                                        {/* Table Header - Clean and Small */}
                                        <div className="grid grid-cols-12 px-10 py-2 bg-slate-50/30 dark:bg-slate-800/30 text-[9px] font-bold text-slate-400 border-b border-slate-50 dark:border-slate-800/50">
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
                                              {(task.assigneeIds && task.assigneeIds.length > 0) || (task.assignees && task.assignees.length > 0) ? (
                                                <div className="flex -space-x-1.5">
                                                  {(() => {
                                                     // Resolve Users
                                                     const rawIds = task.assigneeIds || task.assignees?.map(a => a.id || a.userId) || [];
                                                     const resolved = rawIds.map(id => users.find(u => Number(u.id) === Number(id)) || { id, fullName: 'Bilinmeyen' });
                                                     
                                                     return resolved.slice(0, 3).map((assignee, idx) => (
                                                      <UserAvatar
                                                        key={idx}
                                                        user={assignee}
                                                        size="xs"
                                                        className="w-6 h-6 border-2 border-white dark:border-slate-800 shadow-sm"
                                                      />
                                                    ));
                                                  })()}
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
                                      </>
                                    )}
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
