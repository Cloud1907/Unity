import React, { useState } from 'react';
import { Home, Users, Settings, Plus, ChevronDown, ChevronRight, Star, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { boards } from '../mockData';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

// User Profile Component
const UserProfile = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.avatar} alt={user.fullName} />
          <AvatarFallback style={{ backgroundColor: user.color }}>
            {user.fullName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
          <button
            onClick={() => {
              logout();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ currentBoard, onBoardChange, onNewBoard }) => {
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    boards: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const favoriteBoards = boards.filter(b => b.favorite);
  const otherBoards = boards.filter(b => !b.favorite);

  return (
    <div className="w-64 bg-[#f6f7fb] border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-[#6366f1]">4</span>
            <span className="text-2xl font-semibold text-gray-800">Task</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Items */}
        <div className="px-3 mb-6">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700">
            <Home size={20} />
            <span className="font-normal">Ana Sayfa</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700">
            <Users size={20} />
            <span className="font-normal">Ekibim</span>
          </button>
        </div>

        {/* Favorites */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('favorites')}
            className="w-full flex items-center gap-2 px-6 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider"
          >
            {expandedSections.favorites ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Favoriler</span>
          </button>
          {expandedSections.favorites && (
            <div className="mt-1">
              {favoriteBoards.map(board => (
                <button
                  key={board.id}
                  onClick={() => onBoardChange(board.id)}
                  className={`w-full flex items-center gap-3 px-6 py-2 rounded-lg transition-colors ${
                    currentBoard === board.id
                      ? 'bg-white text-gray-900 font-semibold'
                      : 'text-gray-700 hover:bg-white font-normal'
                  }`}
                >
                  <span className="text-lg">{board.icon}</span>
                  <span className="flex-1 text-left truncate text-sm">{board.name}</span>
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* All Boards */}
        <div>
          <button
            onClick={() => toggleSection('boards')}
            className="w-full flex items-center gap-2 px-6 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider"
          >
            {expandedSections.boards ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Tüm Panolar</span>
          </button>
          {expandedSections.boards && (
            <div className="mt-1">
              {boards.map(board => (
                <button
                  key={board.id}
                  onClick={() => onBoardChange(board.id)}
                  className={`w-full flex items-center gap-3 px-6 py-2 rounded-lg transition-colors ${
                    currentBoard === board.id
                      ? 'bg-white text-gray-900 font-semibold'
                      : 'text-gray-700 hover:bg-white font-normal'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: board.color }}
                  />
                  <span className="flex-1 text-left truncate text-sm">{board.name}</span>
                </button>
              ))}
              <button
                onClick={onNewBoard}
                className="w-full flex items-center gap-3 px-6 py-2 rounded-lg hover:bg-white transition-colors text-gray-500 hover:text-gray-700"
              >
                <Plus size={16} />
                <span className="text-sm">Yeni Pano Ekle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Profile & Settings */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        <UserProfile />
        <Link to="/settings" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700">
          <Settings size={20} />
          <span className="font-normal">Ayarlar</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
