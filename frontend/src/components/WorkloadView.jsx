import React from 'react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' },
  { id: 'stuck', label: 'Takıldı', color: '#e2445c' },
  { id: 'done', label: 'Tamamlandı', color: '#00c875' },
  { id: 'review', label: 'İncelemede', color: '#579bfc' }
];

const WorkloadView = ({ boardId }) => {
  const { tasks, users, fetchTasks } = useData();

  // Fetch tasks when boardId changes
  React.useEffect(() => {
    if (boardId) {
      fetchTasks(boardId);
    }
  }, [boardId]);

  const boardTasks = tasks.filter(t => t.projectId === boardId);

  const getStatusColor = (statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
  };

  const getUserTasks = (userId) => {
    return boardTasks.filter(task => task.assignees?.includes(userId));
  };

  const getWorkloadPercentage = (userTasks) => {
    const totalTasks = userTasks.length;
    const activeTasks = userTasks.filter(t => t.status !== 'done').length;
    return totalTasks > 0 ? Math.round((activeTasks / 10) * 100) : 0;
  };

  const getWorkloadColor = (percentage) => {
    if (percentage >= 80) return '#e2445c';
    if (percentage >= 50) return '#fdab3d';
    return '#00c875';
  };

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#0f172a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ekip İş Yükü</h2>
          <p className="text-gray-600 dark:text-gray-400">Ekip üyelerinin görev dağılımı ve iş yükü durumu</p>
        </div>

        {/* Workload Cards */}
        <div className="space-y-6">
          {users.map(user => {
            const userTasks = getUserTasks(user._id);
            const workloadPercentage = getWorkloadPercentage(userTasks);
            const workloadColor = getWorkloadColor(workloadPercentage);
            const activeTasks = userTasks.filter(t => t.status !== 'done');
            const completedTasks = userTasks.filter(t => t.status === 'done');

            return (
              <div key={user._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                {/* User Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.fullName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: workloadColor }}>
                      {workloadPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">İş Yükü</div>
                  </div>
                </div>

                {/* Workload Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {activeTasks.length} Aktif Görev
                    </span>
                    <span className="text-sm text-gray-500">
                      {completedTasks.length} Tamamlandı
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(workloadPercentage, 100)}%`,
                        backgroundColor: workloadColor
                      }}
                    />
                  </div>
                </div>

                {/* Task List */}
                {userTasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Görevler
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userTasks.map(task => (
                        <div key={task._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getStatusColor(task.status) }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${task.progress || 0}%`,
                                  backgroundColor: getStatusColor(task.status)
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{task.progress || 0}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userTasks.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    Atanmış görev bulunmuyor
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkloadView;
