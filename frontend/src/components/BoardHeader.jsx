import React, { useState } from 'react';
import { Star, MoreHorizontal, Filter, Search, Users as UsersIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import NewTaskModal from './NewTaskModal';

const BoardHeader = ({ boardId, currentView, onViewChange }) => {
  const { projects, users, toggleFavorite } = useData();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  const board = projects.find(b => b._id === boardId);
  const boardMembers = users.filter(u => board?.members?.includes(u._id));

  const handleToggleFavorite = async () => {
    if (board) {
      await toggleFavorite(board._id);
    }
  };

  const views = [
    { id: 'main', label: 'Ana Tablo', icon: '📊' },
    { id: 'kanban', label: 'Kanban', icon: '📋' },
    { id: 'calendar', label: 'Takvim', icon: '📅' },
    { id: 'gantt', label: 'Gantt', icon: '📈' },
    { id: 'workload', label: 'İş Yükü', icon: '⚖️' }
  ];

  if (!board) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Board Info */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: board.color + '20' }}>
              {board.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-gray-900">{board.name}</h1>
                <button onClick={handleToggleFavorite} className="p-1 hover:bg-gray-100 rounded transition-all">
                  <Star size={14} className={board.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                </button>
                {/* 🎯 VERSION BADGE v0.3.2 */}
                <span className="px-2 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-[10px] font-bold rounded-full shadow-lg animate-pulse">
                  v0.3.2 ✨
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
            <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2 hover:bg-gray-50">
              <UsersIcon size={13} />
              Davet Et
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <Button onClick={() => setShowNewTaskModal(true)} size="sm" className="gap-1 bg-[#6366f1] hover:bg-[#5558e3] text-white text-xs h-7 px-3">
            <span className="text-sm">+</span>
            Yeni Öğe
          </Button>
        </div>
      </div>

      {/* Views and Filters */}
      <div className="px-6 py-1.5 flex items-center justify-between bg-white border-t border-gray-200">
        <div className="flex items-center">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`relative px-3 py-1.5 text-xs font-medium transition-colors ${
                currentView === view.id
                  ? 'text-[#6366f1]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {view.icon}
                <span>{view.label}</span>
              </div>
              {currentView === view.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366f1]"></div>
              )}
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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 rounded px-2 py-1 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-xs h-6"
          >
            <Filter size={13} />
            <span>Filtrele</span>
          </Button>
        </div>
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        projectId={boardId}
      />
    </div>
  );
};

export default BoardHeader;
