import React, { useState } from 'react';
import { Star, MoreHorizontal, Filter, Search, Users as UsersIcon, Tag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import NewTaskModal from './NewTaskModal';
import LabelManager from './LabelManager';

const BoardHeader = ({ boardId, currentView, onViewChange, onFilterChange }) => {
  const { projects, users, toggleFavorite, labels } = useData();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignee: [],
    labels: []
  });
  
  const board = projects.find(b => b._id === boardId);
  const boardMembers = users.filter(u => board?.members?.includes(u._id));
  const projectLabels = labels?.filter(l => l.projectId === boardId) || [];

  const handleToggleFavorite = async () => {
    if (board) {
      await toggleFavorite(board._id);
    }
  };

  // Close filter menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterMenu && !event.target.closest('.relative')) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu]);

  const views = [
    { id: 'main', label: 'Ana Tablo', icon: '📊', shortLabel: 'Tablo' },
    { id: 'kanban', label: 'Kanban', icon: '📋', shortLabel: 'Kanban' },
    { id: 'calendar', label: 'Takvim', icon: '📅', shortLabel: 'Takvim' },
    { id: 'gantt', label: 'Gantt', icon: '📈', shortLabel: 'Gantt' },
    { id: 'workload', label: 'İş Yükü', icon: '⚖️', shortLabel: 'İş Yükü' }
  ];

  if (!board) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Board Info */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: board.color + '20' }}>
              {board.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{board.name}</h1>
                <button onClick={handleToggleFavorite} className="p-1 hover:bg-gray-100 rounded transition-all">
                  <Star size={14} className={board.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                </button>
                {/* 🎯 VERSION BADGE v0.4.0 */}
                <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                  v0.4.0 👤
                </span>
              </div>
              {board.description && (
                <p className="text-xs text-gray-500 mt-0.5">{board.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Members */}
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-2">
              {boardMembers?.slice(0, 5).map(member => (
                <Avatar key={member._id} className="w-6 h-6 border-2 border-white hover:z-10 transition-all">
                  <AvatarImage src={member.avatar} alt={member.fullName} />
                  <AvatarFallback>{member.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {boardMembers.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-700">
                  +{boardMembers.length - 5}
                </div>
              )}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <Button onClick={() => setShowNewTaskModal(true)} size="sm" className="gap-1 bg-[#6366f1] hover:bg-[#5558e3] text-white text-xs h-7 px-3">
            <span className="text-sm">+</span>
            Yeni Öğe
          </Button>
        </div>
      </div>

      {/* Views and Filters */}
      <div className="px-6 py-2 flex items-center justify-between bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                currentView === view.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{view.icon}</span>
                <span className="font-semibold">{view.shortLabel}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Görev ara..."
              className="pl-7 pr-2 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-[#6366f1] transition-colors w-48"
            />
          </div>
          <div className="relative">
            <Button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              variant="outline" 
              size="sm" 
              className="gap-1 rounded px-2 py-1 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-xs h-6"
            >
              <Filter size={13} />
              <span>Filtrele</span>
              {(filters.status.length > 0 || filters.priority.length > 0 || filters.assignee.length > 0 || filters.labels.length > 0) && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px]">
                  {filters.status.length + filters.priority.length + filters.assignee.length + filters.labels.length}
                </span>
              )}
            </Button>

            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Filtreler</h3>
                    <button
                      onClick={() => {
                        setFilters({ status: [], priority: [], assignee: [], labels: [] });
                        if (onFilterChange) onFilterChange(null);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Temizle
                    </button>
                  </div>

                  {/* Status Filter */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Durum</label>
                    <div className="space-y-2">
                      {['todo', 'working', 'review', 'done'].map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={(e) => {
                              const newFilters = {
                                ...filters,
                                status: e.target.checked
                                  ? [...filters.status, status]
                                  : filters.status.filter(s => s !== status)
                              };
                              setFilters(newFilters);
                              if (onFilterChange) onFilterChange(newFilters);
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-xs capitalize">
                            {status === 'todo' ? 'Yapılacak' : 
                             status === 'working' ? 'Devam Ediyor' :
                             status === 'review' ? 'İnceleme' : 'Tamamlandı'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority Filter */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Öncelik</label>
                    <div className="space-y-2">
                      {['critical', 'high', 'medium', 'low'].map(priority => (
                        <label key={priority} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.priority.includes(priority)}
                            onChange={(e) => {
                              const newFilters = {
                                ...filters,
                                priority: e.target.checked
                                  ? [...filters.priority, priority]
                                  : filters.priority.filter(p => p !== priority)
                              };
                              setFilters(newFilters);
                              if (onFilterChange) onFilterChange(newFilters);
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-xs capitalize">
                            {priority === 'critical' ? 'Kritik' :
                             priority === 'high' ? 'Yüksek' :
                             priority === 'medium' ? 'Orta' : 'Düşük'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Labels Filter */}
                  {projectLabels.length > 0 && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Etiketler</label>
                      <div className="space-y-2">
                        {projectLabels.map(label => (
                          <label key={label.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.labels.includes(label.id)}
                              onChange={(e) => {
                                const newFilters = {
                                  ...filters,
                                  labels: e.target.checked
                                    ? [...filters.labels, label.id]
                                    : filters.labels.filter(l => l !== label.id)
                                };
                                setFilters(newFilters);
                                if (onFilterChange) onFilterChange(newFilters);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowFilterMenu(false)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                  >
                    Uygula
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={() => setShowLabelManager(true)}
            variant="outline" 
            size="sm" 
            className="gap-1 rounded px-2 py-1 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-xs h-6"
          >
            <Tag size={13} />
            <span>Etiketler</span>
          </Button>
        </div>
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        projectId={boardId}
      />

      {/* Label Manager Modal */}
      {showLabelManager && (
        <LabelManager
          projectId={boardId}
          onClose={() => setShowLabelManager(false)}
        />
      )}
    </div>
  );
};

export default BoardHeader;
