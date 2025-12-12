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
    <div className="bg-white border-b border-gray-200">
      {/* Board Info */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{board.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">{board.name}</h1>
                <button onClick={handleToggleFavorite} className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <Star size={20} className={board.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1 font-normal">{board.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Members */}
          <div className="flex items-center -space-x-2">
            {boardMembers?.slice(0, 5).map(member => (
              <Avatar key={member._id} className="w-8 h-8 border-2 border-white">
                <AvatarImage src={member.avatar} alt={member.fullName} />
                <AvatarFallback>{member.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {boardMembers.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                +{boardMembers.length - 5}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <UsersIcon size={16} />
            Davet Et
          </Button>

          <Button onClick={() => setShowNewTaskModal(true)} size="sm" className="gap-2 bg-[#0086c0] hover:bg-[#006a99]">
            Yeni Öğe
          </Button>
        </div>
      </div>

      {/* Views and Filters */}
      <div className="px-6 py-2 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-1">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                currentView === view.id
                  ? 'bg-[#0086c0] text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 font-medium'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Ara..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0086c0] focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter size={16} />
            Filtrele
          </Button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal size={20} className="text-gray-600" />
          </button>
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
