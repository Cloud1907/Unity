import React, { useState, useEffect } from 'react';
import { Star, MoreHorizontal, Filter, Search, Users as UsersIcon, Tag, Table, LayoutGrid, Calendar, BarChart3, Users, Trash2, MoreVertical, Settings, Layers } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import NotificationPopover from './NotificationPopover';
import NewTaskModal from './NewTaskModal';
import LabelManager from './LabelManager';
import pkg from '../../package.json';

const BoardHeader = ({
  boardId,
  currentView,
  onViewChange,
  searchQuery,
  setSearchQuery,
  filters = { status: [], priority: [], assignee: [], labels: [] },
  onFilterChange,
  groupBy,
  onGroupByChange
}) => {
  const { projects, users, toggleFavorite, labels, deleteProject } = useData();
  const navigate = useNavigate();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showGroupByMenu, setShowGroupByMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const board = projects.find(b => b._id === Number(boardId));
  const boardMembers = users.filter(u => board?.members?.includes(u._id));

  const handleToggleFavorite = async () => {
    if (board) {
      await toggleFavorite(board._id);
    }
  };

  const handleDeleteProject = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettingsMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteProject(boardId);
    if (result.success) {
      navigate('/');
    }
  };

  // Unique Labels Logic
  const uniqueProjectLabels = React.useMemo(() => {
    const pl = labels?.filter(l => l.projectId === Number(boardId)) || [];
    const unique = new Map();
    pl.forEach(l => {
      if (!unique.has(l.name)) {
        unique.set(l.name, l);
      }
    });
    return Array.from(unique.values());
  }, [labels, boardId]);

  const filterMenuRef = React.useRef(null);
  const filterButtonRef = React.useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Filter Menu Logic
      if (showFilterMenu &&
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target) &&
        !filterButtonRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }

      if (showGroupByMenu && !event.target.closest('.group-by-menu')) {
        setShowGroupByMenu(false);
      }
      if (showSettingsMenu && !event.target.closest('.settings-menu')) {
        setShowSettingsMenu(false);
      }
      if (showNotifications && !event.target.closest('.notification-wrapper')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu, showSettingsMenu, showGroupByMenu, showNotifications]);

  const views = [
    { id: 'main', label: 'Liste', Icon: Table, shortLabel: 'Liste' },
    { id: 'kanban', label: 'Kanban', Icon: LayoutGrid, shortLabel: 'Kanban' },
    { id: 'calendar', label: 'Takvim', Icon: Calendar, shortLabel: 'Takvim' },
    { id: 'gantt', label: 'Gantt', Icon: BarChart3, shortLabel: 'Gantt' },
    { id: 'workload', label: 'İş Yükü', Icon: Users, shortLabel: 'İş Yükü' }
  ];

  if (!board) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm relative">
      {/* Board Info */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: board.color + '20' }}>
              {(board.icon && board.icon !== '??') ? board.icon : '📁'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{board.name}</h1>
                <button onClick={handleToggleFavorite} className="p-1 hover:bg-gray-100 rounded transition-all">
                  <Star size={14} className={board.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                </button>
                {/* 🎯 VERSION BADGE */}
                <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-[10px] font-bold rounded-full shadow-lg animate-fade-in">
                  v{pkg.version}
                </span>
              </div>
              {/* Project Settings Menu Relocated Here */}
              <div className="relative settings-menu ml-1">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  title="Proje Ayarları"
                >
                  <MoreHorizontal size={16} />
                </button>

                {showSettingsMenu && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                    <button
                      onClick={handleDeleteProject}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Projeyi Sil
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative notification-wrapper">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full transition-all ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-500'}`}
            >
              <div className="relative">
                <Settings size={20} className="hidden" /> {/* Dummy to keep import valid if needed, or just remove */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                {/* Badge (Optional - need to fetch unread count to show) */}
                {/* <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span> */}
              </div>
            </button>
            <NotificationPopover isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2"></div>

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
            Yeni Görev
          </Button>


        </div>
      </div>

      {/* Views and Filters */}
      <div className="px-6 py-2.5 flex items-center justify-between bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {views.map(view => {
            const IconComponent = view.Icon;
            return (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === view.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <IconComponent size={18} strokeWidth={2.5} />
                <span className="font-semibold">{view.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Görev ara..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs focus:outline-none focus:border-[#6366f1] transition-colors w-48 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Group By Dropdown */}
          <div className="relative group-by-menu">
            <Button
              onClick={() => setShowGroupByMenu(!showGroupByMenu)}
              variant="outline"
              size="sm"
              className={`gap-1 rounded px-2 py-1 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs h-6 ${groupBy ? 'bg-blue-50 border-blue-200 text-blue-700' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <Layers size={13} />
              <span>{groupBy ? 'Gruplandı' : 'Grupla'}</span>
              {groupBy && (
                <span className="ml-1 text-[10px] font-bold">
                  : {groupBy === 'status' ? 'Durum' : groupBy === 'priority' ? 'Öncelik' : groupBy === 'labels' ? 'Etiket' : 'T-Shirt'}
                </span>
              )}
            </Button>

            {showGroupByMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                  Şuna Göre Grupla
                </div>
                <button
                  onClick={() => { onGroupByChange(null); setShowGroupByMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${!groupBy ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  <span>Gruplama Yok</span>
                  {!groupBy && <span className="text-blue-600">✓</span>}
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => { onGroupByChange('status'); setShowGroupByMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${groupBy === 'status' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  <span>Durum</span>
                  {groupBy === 'status' && <span className="text-blue-600">✓</span>}
                </button>
                <button
                  onClick={() => { onGroupByChange('priority'); setShowGroupByMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${groupBy === 'priority' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  <span>Öncelik</span>
                  {groupBy === 'priority' && <span className="text-blue-600">✓</span>}
                </button>
                <button
                  onClick={() => { onGroupByChange('tShirtSize'); setShowGroupByMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${groupBy === 'tShirtSize' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  <span>T-Shirt Size</span>
                  {groupBy === 'tShirtSize' && <span className="text-blue-600">✓</span>}
                </button>
                <button
                  onClick={() => { onGroupByChange('labels'); setShowGroupByMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${groupBy === 'labels' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  <span>Etiket</span>
                  {groupBy === 'labels' && <span className="text-blue-600">✓</span>}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              ref={filterButtonRef}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              variant="outline"
              size="sm"
              className="gap-1 rounded px-2 py-1 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs h-6 text-gray-700 dark:text-gray-300"
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
              <div ref={filterMenuRef} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Filtreler</h3>
                    <button
                      onClick={() => {
                        if (onFilterChange) onFilterChange({ status: [], priority: [], assignee: [], labels: [] });
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
                  {uniqueProjectLabels.length > 0 && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Etiketler</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {uniqueProjectLabels.map(label => (
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
            className="gap-1 rounded px-2 py-1 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs h-6 text-gray-700 dark:text-gray-300"
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
      {
        showLabelManager && (
          <LabelManager
            projectId={boardId}
            onClose={() => setShowLabelManager(false)}
          />
        )
      }

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Projeyi Sil</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default BoardHeader;
