import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Star, Users, CheckCircle, Clock } from 'lucide-react';

const ProjectsPage = () => {
  const { projects, tasks, users } = useData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, favorites, active

  const filteredProjects = projects.filter(project => {
    if (filter === 'favorites') return project.favorite;
    if (filter === 'active') {
      const projectTasks = tasks.filter(t => t.projectId === project._id);
      return projectTasks.some(t => t.status !== 'done');
    }
    return true;
  });

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const completedCount = projectTasks.filter(t => t.status === 'done').length;
    const inProgressCount = projectTasks.filter(t => t.status === 'working').length;
    const progress = projectTasks.length > 0
      ? Math.round((completedCount / projectTasks.length) * 100)
      : 0;

    return {
      total: projectTasks.length,
      completed: completedCount,
      inProgress: inProgressCount,
      progress
    };
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderKanban size={32} className="text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tüm Projeler</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Tüm projelerinizi görüntüleyin ve yönetin</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus size={20} />
            Yeni Proje
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            Tümü ({projects.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'favorites'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            Favoriler ({projects.filter(p => p.favorite).length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'active'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            Aktif Projeler
          </button>
        </div>

        {/* Projects Grouped by Department */}
        <div className="space-y-12">
          {Object.entries(
            filteredProjects.reduce((acc, project) => {
              const dept = project.department || 'Diğer';
              if (!acc[dept]) acc[dept] = [];
              acc[dept].push(project);
              return acc;
            }, {})
          ).map(([department, deptProjects]) => (
            <div key={department} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                <div className="w-2 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {department}
                </h2>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded text-sm font-medium">
                  {deptProjects.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deptProjects.map(project => {
                  const stats = getProjectStats(project._id);

                  return (
                    <div
                      key={project._id}
                      onClick={() => navigate(`/board/${project._id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900 transition-all cursor-pointer group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: project.color || '#6366f1' }}
                            />
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {project.name}
                            </h3>
                          </div>
                        </div>
                        {project.favorite && (
                          <Star size={18} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 min-h-[40px]">
                        {project.description || 'Açıklama yok'}
                      </p>

                      {/* Stats */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CheckCircle size={16} />
                            <span>Toplam Görev</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.total}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock size={16} />
                            <span>Devam Eden</span>
                          </div>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.inProgress}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CheckCircle size={16} />
                            <span>Tamamlanan</span>
                          </div>
                          <span className="font-semibold text-green-600 dark:text-green-400">{stats.completed}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>İlerleme</span>
                          <span className="font-semibold">{stats.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${stats.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <FolderKanban size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Proje bulunamadı</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'favorites'
                ? 'Henüz favori projeniz yok'
                : 'Yeni bir proje oluşturarak başlayın'}
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Yeni Proje Oluştur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
