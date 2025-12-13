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
      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-md" style={{ backgroundColor: board.color + '20' }}>
              {board.icon}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{board.name}</h1>
                <button onClick={handleToggleFavorite} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all hover:scale-110">
                  <Star size={20} className={board.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                </button>
              </div>
              {board.description && (
                <p className="text-sm text-gray-600 mt-1 font-normal">{board.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Members */}
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-3">
              {boardMembers?.slice(0, 5).map(member => (
                <Avatar key={member._id} className="w-9 h-9 border-3 border-white ring-1 ring-gray-200 hover:z-10 transition-all hover:scale-110">
                  <AvatarImage src={member.avatar} alt={member.fullName} />
                  <AvatarFallback style={{ backgroundColor: member.color }}>{member.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {boardMembers.length > 5 && (
                <div className="w-9 h-9 rounded-full bg-gray-200 border-3 border-white ring-1 ring-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                  +{boardMembers.length - 5}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-2 ml-2 hover:bg-gray-50">
              <UsersIcon size={16} />
              Davet Et
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-300"></div>

          <Button onClick={() => setShowNewTaskModal(true)} size="sm" className="gap-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c3aed] text-white shadow-lg hover:shadow-xl transition-all">
            <span className="text-lg">+</span>
            Yeni Öğe
          </Button>
        </div>
      </div>

      {/* Views and Filters */}
      <div className="px-8 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200">
        <div className="flex items-center gap-3">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`group relative px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                currentView === view.id
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/30 scale-105'
                  : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-md hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-xl transition-transform duration-300 ${
                  currentView === view.id ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  {view.icon}
                </span>
                <span className="tracking-wide">{view.label}</span>
              </div>
              {currentView === view.id && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Görev ara..."
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent transition-all w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter size={16} />
            Filtrele
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
