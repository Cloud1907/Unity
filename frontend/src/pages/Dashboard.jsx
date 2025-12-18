import React from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, Users, CheckCircle, Clock, Star } from 'lucide-react';
import pkg from '../../package.json';

const Dashboard = () => {
  const { projects, tasks, users } = useData();
  const navigate = useNavigate();

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'working').length;
  const myTasks = tasks.filter(t => t.assignees?.includes(localStorage.getItem('userId')));

  // Recent projects
  const recentProjects = projects.slice(0, 6);

  // Quick stats
  const stats = [
    {
      title: 'Toplam Görev',
      value: totalTasks,
      icon: <CheckCircle className="text-blue-600" size={24} />,
      bg: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Devam Eden',
      value: inProgressTasks,
      icon: <Clock className="text-orange-600" size={24} />,
      bg: 'bg-orange-50',
      change: '+8%'
    },
    {
      title: 'Tamamlanan',
      value: completedTasks,
      icon: <TrendingUp className="text-green-600" size={24} />,
      bg: 'bg-green-50',
      change: '+23%'
    },
    {
      title: 'Takım Üyeleri',
      value: users.length,
      icon: <Users className="text-purple-600" size={24} />,
      bg: 'bg-purple-50',
      change: '+2'
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ana Sayfa</h1>
            <p className="text-gray-600">Projeleriniz ve görevleriniz hakkında genel bakış</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200/50 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-gray-500">v{pkg.version}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
                <span className="text-sm font-semibold text-green-600">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Projelerim</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color || '#6366f1' }}
                      />
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                    </div>
                    {project.favorite && (
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description || 'Açıklama yok'}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{projectTasks.length} görev</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {recentProjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Henüz proje yok</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
