import React from 'react';
import { users, tasks, statuses } from '../mockData';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const WorkloadView = ({ boardId }) => {
  const boardTasks = tasks.filter(t => t.boardId === boardId);

  const getStatusColor = (statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
  };

  const getUserTasks = (userId) => {
    return boardTasks.filter(task => task.assignees.includes(userId));
  };

  const getWorkloadPercentage = (userTasks) => {
    // Calculate workload based on number of tasks and their progress
    const totalTasks = userTasks.length;
    const activeTasks = userTasks.filter(t => t.status !== 'done').length;
    return totalTasks > 0 ? Math.round((activeTasks / 10) * 100) : 0; // Assuming 10 tasks is 100% workload
  };

  const getWorkloadColor = (percentage) => {
    if (percentage >= 80) return '#e2445c'; // High workload - red
    if (percentage >= 50) return '#fdab3d'; // Medium workload - orange
    return '#00c875'; // Low workload - green
  };

  return (
    <div className="flex-1 overflow-auto bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ekip İş Yükü</h2>
          <p className="text-gray-600">Ekip üyelerinin görev dağılımı ve iş yükü durumu</p>
        </div>

        {/* Workload Cards */}
        <div className="space-y-6">
          {users.map(user => {
            const userTasks = getUserTasks(user.id);
            const workloadPercentage = getWorkloadPercentage(userTasks);
            const workloadColor = getWorkloadColor(workloadPercentage);
            const activeTasks = userTasks.filter(t => t.status !== 'done');
            const completedTasks = userTasks.filter(t => t.status === 'done');

            return (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                {/* User Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
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
                    <span className="text-sm font-medium text-gray-700">
                      {activeTasks.length} Aktif Görev
                    </span>
                    <span className="text-sm text-gray-500">
                      {completedTasks.length} Tamamlandı
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
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
                        <div key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getStatusColor(task.status) }}
                            />
                            <span className="text-sm text-gray-700 truncate">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${task.progress}%`,
                                  backgroundColor: getStatusColor(task.status)
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{task.progress}%</span>
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
