import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Users, Mail, Shield, CheckCircle, Clock } from 'lucide-react';

const TeamPage = () => {
  const { users, tasks } = useData();
  const [teamStats, setTeamStats] = useState({});

  useEffect(() => {
    // Calculate stats for each user
    const stats = {};
    users.forEach(user => {
      const userId = user.id || user._id;
      const userTasks = tasks.filter(t => t.assignees?.includes(userId));
      const completedTasks = userTasks.filter(t => t.status === 'done').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'working').length;

      stats[userId] = {
        total: userTasks.length,
        completed: completedTasks,
        inProgress: inProgressTasks
      };
    });
    setTeamStats(stats);
  }, [users, tasks]);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'member': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Yönetici';
      case 'member': return 'Üye';
      default: return 'Üye';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users size={32} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ekibim</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Takım üyeleriniz ve performans istatistikleri</p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Toplam Üye</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tamamlanan Görev</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tasks.filter(t => t.status === 'done').length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-orange-600 dark:text-orange-400" size={24} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Devam Eden</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tasks.filter(t => t.status === 'working').length}
            </p>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Takım Üyeleri</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => {
              const userId = user.id || user._id;
              const stats = teamStats[userId] || { total: 0, completed: 0, inProgress: 0 };
              const completionRate = stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0;

              return (
                <div
                  key={userId}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg dark:hover:shadow-gray-900 transition-all bg-white dark:bg-gray-900"
                >
                  {/* User Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.fullName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)} dark:opacity-80`}>
                      <Shield size={12} />
                      {getRoleText(user.role)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Toplam Görev</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tamamlanan</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{stats.completed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Devam Eden</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.inProgress}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Tamamlanma Oranı</span>
                        <span className="font-semibold dark:text-gray-200">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Henüz takım üyesi yok</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
