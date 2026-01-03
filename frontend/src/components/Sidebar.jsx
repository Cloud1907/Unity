import React, { useState } from 'react';
import { Home, Users, Settings, Plus, ChevronDown, ChevronRight, Star, LogOut, FlaskConical, Menu, X } from 'lucide-react';
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
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <Avatar className="w-9 h-9 border-2 border-white dark:border-slate-800 shadow-sm group-hover:border-indigo-100 transition-colors">
          <AvatarImage src={user.avatar} alt={user.fullName} />
          <AvatarFallback style={{ backgroundColor: user.color }} className="text-white font-medium">
            {user.fullName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{user.role}</p>
        </div>
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-3 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 py-1.5 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          <Link
            to="/profile"
            onClick={() => setShowMenu(false)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Settings size={16} />
            <span>Profil Ayarları</span>
          </Link>
          {user.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setShowMenu(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Users size={16} />
              <span>Admin Panel</span>
            </Link>
          )}
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
          <button
            onClick={() => {
              logout();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    <>
      {/* Mobile Menu Overlay for Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button (Fixed Bottom Left) */}
      <div className="md:hidden fixed bottom-6 left-6 z-30">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={`
        bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col
        transition-transform duration-300 ease-out z-50
        md:translate-x-0 md:w-72 md:relative
        fixed inset-y-0 left-0 w-72 shadow-2xl md:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* App Logo/Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200 dark:shadow-none">4</div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Flow</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="md:hidden absolute top-4 right-4">
          <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-hide">
          {/* Main Items */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium text-slate-600 dark:text-slate-400 text-sm group"
            >
              <Home size={18} className="group-hover:scale-110 transition-transform" />
              <span>Ana Sayfa</span>
            </Link>
            <Link
              to="/team"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium text-slate-600 dark:text-slate-400 text-sm group"
            >
              <Users size={18} className="group-hover:scale-110 transition-transform" />
              <span>Ekibim</span>
            </Link>
            <Link
              to="/tests"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium text-slate-600 dark:text-slate-400 text-sm group"
            >
              <FlaskConical size={18} className="group-hover:scale-110 transition-transform" />
              <span>Test Sonuçları</span>
            </Link>
          </div>

          {/* Favorites */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('favorites')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span>Favoriler</span>
              {expandedSections.favorites ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {expandedSections.favorites && (
              <div className="space-y-0.5 mt-1">
                {favoriteBoards.map(board => (
                  <Link
                    key={board._id}
                    to={`/board/${board._id}`}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentBoard === board._id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{board.icon}</span>
                    <span className="flex-1 text-left truncate text-sm">{board.name}</span>
                    <Star
                      size={14}
                      className="text-yellow-400 fill-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleToggleFavorite(e, board._id)}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* All Boards */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('boards')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span>Projeler</span>
              {expandedSections.boards ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedSections.boards && (
              <div className="space-y-0.5 mt-1">
                {allBoards.map(board => (
                  <Link
                    key={board._id}
                    to={`/board/${board._id}`}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentBoard === board._id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-transparent group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all"
                      style={{ backgroundColor: board.color }}
                    />
                    <span className="flex-1 text-left truncate text-sm">{board.name}</span>
                  </Link>
                ))}
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group mt-2"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <Plus size={14} />
                  </div>
                  <span className="text-sm font-medium">Yeni Proje</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <UserProfile />

          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <span>4Flow v{pkg.version}</span>
            <span>•</span>
            <Link to="/settings" className="hover:text-indigo-500 transition-colors">Gizlilik</Link>
          </div>
        </div>

        {/* New Project Modal */}
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
        />
      </div>
    </>
  );
};

export default Sidebar;
