import React, { useState } from 'react';
import { Home, Users, Settings, Plus, ChevronDown, ChevronRight, Star, LogOut, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import NewProjectModal from './NewProjectModal';
import pkg from '../../package.json';

// User Profile Component
const UserProfile = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.avatar} alt={user.fullName} />
          <AvatarFallback style={{ backgroundColor: user.color }}>
            {user.fullName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
        </div>
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
          <Link
            to="/profile"
            onClick={() => setShowMenu(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings size={16} />
            <span>Profil Ayarları</span>
          </Link>
          {user.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setShowMenu(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Users size={16} />
              <span>Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
  const { projects, toggleFavorite } = useData();
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    boards: true
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggleFavorite = async (e, projectId) => {
    e.stopPropagation();
    await toggleFavorite(projectId);
  };

  const favoriteBoards = projects.filter(b => b.favorite);
  const allBoards = projects;

  return (
    <div className="w-64 bg-[#f6f7fb] dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col">

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Items */}
        <div className="px-2 mb-4">
          <Link
            to="/dashboard"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 text-xs"
          >
            <Home size={16} />
            <span>Ana Sayfa</span>
          </Link>
          <Link
            to="/team"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 text-xs"
          >
            <Users size={16} />
            <span>Ekibim</span>
          </Link>
          <Link
            to="/tests"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 text-xs"
          >
            <FlaskConical size={16} />
            <span>Test Sonuçları</span>
          </Link>
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
                <Link
                  key={board._id}
                  to={`/board/${board._id}`}
                  className={`w-full flex items-center gap-3 px-6 py-2 rounded-lg transition-colors ${currentBoard === board._id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 font-normal'
                    }`}
                >
                  <span className="text-lg">{board.icon}</span>
                  <span className="flex-1 text-left truncate text-sm">{board.name}</span>
                  <Star size={14} className="text-yellow-500 fill-yellow-500" onClick={(e) => handleToggleFavorite(e, board._id)} />
                </Link>
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
              {allBoards.map(board => (
                <Link
                  key={board._id}
                  to={`/board/${board._id}`}
                  className={`w-full flex items-center gap-3 px-6 py-2 rounded-lg transition-colors ${currentBoard === board._id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 font-normal'
                    }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: board.color }}
                  />
                  <span className="flex-1 text-left truncate text-sm text-gray-700 dark:text-gray-200">{board.name}</span>
                </Link>
              ))}
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="w-full flex items-center gap-3 px-6 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Plus size={16} />
                <span className="text-sm">Yeni Pano Ekle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Profile & Settings */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <UserProfile />
        <Link to="/settings" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
          <Settings size={20} />
          <span className="font-normal text-sm">Ayarlar</span>
        </Link>

        {/* Version */}
        <div className="px-3 py-1 text-center">
          <span className="text-[10px] text-gray-400 font-mono text-center">v{pkg.version}</span>
        </div>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </div>
  );
};

export default Sidebar;
