import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, TrendingUp, CheckCircle, Clock, AlertCircle,
  Calendar, BarChart3, Star, Plus, Users, Target, Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import pkg from '../../package.json';

const Dashboard = () => {
  const { projects, tasks, users } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentUserId = user?._id || localStorage.getItem('userId');
  const currentUserDept = user?.department;
  const currentUserRole = user?.role;

  // Get accessible projects (projects user can see)
  const accessibleProjects = useMemo(() => {
    return projects.filter(p => {
      // Admin sees all
      if (currentUserRole === 'admin') return true;

      // Owner or member always sees
      if (p.owner === currentUserId || p.members?.includes(currentUserId)) return true;

      // If private, only owner/members can see
      if (p.isPrivate) return false;

      // If same department and not private, can see
      if (p.department === currentUserDept && currentUserDept) return true;

      return false;
    });
  }, [projects, currentUserId, currentUserDept, currentUserRole]);

  // Get accessible project IDs
  const accessibleProjectIds = useMemo(() =>
    accessibleProjects.map(p => p._id),
    [accessibleProjects]
  );

  // Filter tasks to only show tasks from accessible projects
  const accessibleTasks = useMemo(() =>
    tasks.filter(t => accessibleProjectIds.includes(t.projectId)),
    [tasks, accessibleProjectIds]
  );

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    // My tasks (assigned to me) - only from accessible projects
    const myTasks = accessibleTasks.filter(t => t.assignees?.includes(currentUserId));
    const myCompletedTasks = myTasks.filter(t => t.status === 'done');
    const myInProgressTasks = myTasks.filter(t => t.status === 'working');
    const myPendingTasks = myTasks.filter(t => t.status === 'todo');

    // Team/Department tasks - only from accessible projects
    const teamProjects = accessibleProjects.filter(p =>
      p.department === currentUserDept && !p.isPrivate
    );
    const teamTasks = accessibleTasks.filter(t =>
      teamProjects.some(p => p._id === t.projectId)
    );

    // Critical deadlines (next 7 days) - only from accessible projects
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = accessibleTasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= sevenDaysFromNow && t.status !== 'done';
    });

    // Overdue tasks - only from accessible projects
    const overdueTasks = accessibleTasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < now;
    });

    return {
      myTasks,
      myCompletedTasks,
      myInProgressTasks,
      myPendingTasks,
      teamProjects,
      teamTasks,
      upcomingTasks,
      overdueTasks
    };
  }, [accessibleTasks, accessibleProjects, currentUserId, currentUserDept]);

  // My projects (where I'm owner or member)
  const myProjects = accessibleProjects.filter(p =>
    p.owner === currentUserId || p.members?.includes(currentUserId)
  );

  // Quick stats
  const quickStats = [
    {
      title: 'Bana Atanan',
      value: stats.myTasks.length,
      icon: <Target className="text-blue-600" size={24} />,
      bg: 'bg-blue-50',
      change: `${stats.myCompletedTasks.length} tamamlandı`,
      color: 'text-blue-600'
    },
    {
      title: 'Devam Eden',
      value: stats.myInProgressTasks.length,
      icon: <Zap className="text-orange-600" size={24} />,
      bg: 'bg-orange-50',
      change: `${stats.myPendingTasks.length} bekliyor`,
      color: 'text-orange-600'
    },
    {
      title: 'Yaklaşan Tarihler',
      value: stats.upcomingTasks.length,
      icon: <Calendar className="text-purple-600" size={24} />,
      bg: 'bg-purple-50',
      change: '7 gün içinde',
      color: 'text-purple-600'
    },
    {
      title: 'Gecikmiş',
      value: stats.overdueTasks.length,
      icon: <AlertCircle className="text-red-600" size={24} />,
      bg: 'bg-red-50',
      change: 'Acil',
      color: 'text-red-600'
    }
  ];

  // Chart colors
  const COLORS = {
    done: '#10b981',
    working: '#f59e0b',
    todo: '#6366f1',
    review: '#8b5cf6',
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#84cc16'
  };

  // Prepare chart data
  const statusChartData = [
    { name: 'Tamamlandı', value: stats.myCompletedTasks.length, color: COLORS.done },
    { name: 'Devam Ediyor', value: stats.myInProgressTasks.length, color: COLORS.working },
    { name: 'Bekliyor', value: stats.myPendingTasks.length, color: COLORS.todo }
  ].filter(item => item.value > 0);

  const priorityChartData = useMemo(() => {
    const priorityCounts = stats.myTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: 'Kritik', value: priorityCounts.critical || 0, color: COLORS.critical },
      { name: 'Yüksek', value: priorityCounts.high || 0, color: COLORS.high },
      { name: 'Orta', value: priorityCounts.medium || 0, color: COLORS.medium },
      { name: 'Düşük', value: priorityCounts.low || 0, color: COLORS.low }
    ].filter(item => item.value > 0);
  }, [stats.myTasks]);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-lg">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 tracking-tight">Dashboard</h1>
            <p className="text-indigo-100 text-lg font-medium opacity-90">
              Hoş geldin, {user?.fullName || 'Kullanıcı'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 relative z-10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
            </span>
            <span className="text-sm font-mono font-medium text-white/90">v{pkg.version}</span>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-black/10 rounded-full blur-3xl"></div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <p className={`text-xs font-semibold ${stat.color} mt-2`}>{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Status Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600" />
              Görev Durumu Dağılımı
            </h3>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                <p>Henüz görev yok</p>
              </div>
            )}
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '450ms', animationFillMode: 'backwards' }}>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Target size={20} className="text-indigo-600" />
              Öncelik Dağılımı
            </h3>
            {priorityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                <p>Henüz görev yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid - My Tasks and Critical Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* My Tasks Widget */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle size={24} className="text-indigo-600" />
                Bana Atanan Görevler
              </h2>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                Tümünü Gör
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {stats.myTasks.slice(0, 5).map(task => {
                const project = accessibleProjects.find(p => p._id === task.projectId);
                return (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/board/${task.projectId}`)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project?.color || '#6366f1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500">{project?.name || 'Proje'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'done' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Tamamlandı
                        </span>
                      )}
                      {task.status === 'working' && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                          Devam Ediyor
                        </span>
                      )}
                      {task.status === 'todo' && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                          Bekliyor
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {stats.myTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">Henüz atanmış görev yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Critical Deadlines Widget */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '550ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Clock size={24} className="text-red-600" />
                Kritik Tarihler
              </h2>
            </div>

            <div className="space-y-3">
              {stats.overdueTasks.slice(0, 3).map(task => {
                const project = accessibleProjects.find(p => p._id === task.projectId);
                return (
                  <div
                    key={task._id}
                    className="p-3 rounded-xl bg-red-50 border border-red-100"
                  >
                    <p className="font-medium text-slate-900 text-sm mb-1 truncate">{task.title}</p>
                    <p className="text-xs text-red-600 font-semibold">Gecikmiş</p>
                  </div>
                );
              })}

              {stats.upcomingTasks.slice(0, 3).map(task => {
                const project = accessibleProjects.find(p => p._id === task.projectId);
                return (
                  <div
                    key={task._id}
                    className="p-3 rounded-xl bg-orange-50 border border-orange-100"
                  >
                    <p className="font-medium text-slate-900 text-sm mb-1 truncate">{task.title}</p>
                    <p className="text-xs text-orange-600 font-semibold">Yaklaşıyor</p>
                  </div>
                );
              })}

              {stats.overdueTasks.length === 0 && stats.upcomingTasks.length === 0 && (
                <div className="text-center py-8">
                  <Calendar size={40} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">Kritik tarih yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Projects Section */}
        {currentUserDept && stats.teamProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users size={28} className="text-indigo-600" />
                Takım Projeleri
                <span className="text-sm font-normal text-slate-500">({currentUserDept})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.teamProjects.slice(0, 6).map(project => {
                const projectTasks = accessibleTasks.filter(t => t.projectId === project._id);
                const completedCount = projectTasks.filter(t => t.status === 'done').length;
                const progress = projectTasks.length > 0
                  ? Math.round((completedCount / projectTasks.length) * 100)
                  : 0;

                return (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/board/${project._id}`)}
                    className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                          style={{ backgroundColor: `${project.color}20`, color: project.color }}
                        >
                          {project.icon || '📁'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {project.name}
                          </h3>
                          <span className="text-xs text-slate-500">{projectTasks.length} görev</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                        <span>İlerleme</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Projelerim Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Projelerim</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProjects.slice(0, 6).map(project => {
              const projectTasks = accessibleTasks.filter(t => t.projectId === project._id);
              const completedCount = projectTasks.filter(t => t.status === 'done').length;
              const progress = projectTasks.length > 0
                ? Math.round((completedCount / projectTasks.length) * 100)
                : 0;

              return (
                <div
                  key={project._id}
                  onClick={() => navigate(`/board/${project._id}`)}
                  className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                  <div className="relative z-10 flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        {project.icon || '📱'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {project.name}
                        </h3>
                        <span className="text-xs text-slate-500">{projectTasks.length} görev</span>
                      </div>
                    </div>
                    {project.favorite && (
                      <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    )}
                  </div>

                  <p className="relative z-10 text-sm text-slate-600 mb-6 line-clamp-2 h-10">
                    {project.description || 'Açıklama bulunmuyor.'}
                  </p>

                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                      <span>İlerleme</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out group-hover:bg-indigo-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {myProjects.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Henüz proje yok</h3>
              <p className="text-slate-500 mb-6">İlk projenizi oluşturarak işlerinizi organize etmeye başlayın.</p>
              <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200">
                Yeni Proje Oluştur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
