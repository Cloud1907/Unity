import React from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, Users, CheckCircle, Clock, Star, Plus } from 'lucide-react';
import pkg from '../../package.json';

const Dashboard = () => {
  const { projects, tasks, users } = useData();
  const navigate = useNavigate();

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'working').length;
  const myTasks = tasks.filter(t => t.assignees?.includes(localStorage.getItem('userId')));

  // Recent projects - filter by membership
  const currentUserId = localStorage.getItem('userId');
  const userProjects = projects.filter(p => p.members?.includes(currentUserId));
  const recentProjects = userProjects.slice(0, 6);

  // Quick stats
  const stats = [
    {
      title: 'Toplam Görev',
      value: totalTasks,
      icon: <CheckCircle className="text-blue-600 dark:text-blue-400" size={24} />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Devam Eden',
      value: inProgressTasks,
      icon: <Clock className="text-orange-600 dark:text-orange-400" size={24} />,
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Tamamlanan',
      value: completedTasks,
      icon: <TrendingUp className="text-green-600 dark:text-green-400" size={24} />,
      bg: 'bg-green-50 dark:bg-green-900/20',
      change: '+23%',
      trend: 'up'
    },
    {
      title: 'Takım Üyeleri',
      value: users.length,
      icon: <Users className="text-purple-600 dark:text-purple-400" size={24} />,
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      change: '+2',
      trend: 'neutral'
    }
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-lg">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 tracking-tight">Ana Sayfa</h1>
            <p className="text-indigo-100 text-lg font-medium opacity-90">Projeleriniz ve görevleriniz hakkında genel bakış</p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">{stat.change}</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Projelerim</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Tümünü Gör
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map(project => {
              const projectTasks = tasks.filter(t => t.projectId === project._id);
              const completedCount = projectTasks.filter(t => t.status === 'done').length;
              const progress = projectTasks.length > 0
                ? Math.round((completedCount / projectTasks.length) * 100)
                : 0;

              return (
                <div
                  key={project._id}
                  onClick={() => navigate(`/board/${project._id}`)}
                  className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-800/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                  <div className="relative z-10 flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                        style={{ backgroundColor: `${project.color}20`, color: project.color || '#6366f1' }}
                      >
                        {project.icon || '📱'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {project.name}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{projectTasks.length} görev</span>
                      </div>
                    </div>
                    {project.favorite && (
                      <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    )}
                  </div>

                  <p className="relative z-10 text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2 h-10">
                    {project.description || 'Açıklama bulunmuyor.'}
                  </p>

                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span>İlerleme</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out group-hover:bg-indigo-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {recentProjects.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Henüz proje yok</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">İlk projenizi oluşturarak işlerinizi organize etmeye başlayın.</p>
              <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
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
