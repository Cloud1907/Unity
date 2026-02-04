import React, { useState } from 'react';
import { Home, Settings, Plus, ChevronDown, ChevronRight, Star, LogOut, Menu, X, Lock, Users, Hexagon, TrendingUp, FolderPlus, CheckSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDataState, useDataActions } from '../contexts/DataContext';
import UserAvatar from './ui/shared/UserAvatar';
import { getAvatarUrl, getInitials, getUserColor } from '../utils/avatarHelper';
import NewProjectModal from './NewProjectModal';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';
import NewWorkspaceModal from './NewWorkspaceModal';
import { DynamicIcon } from './IconPicker';
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
        aria-label="Kullanıcı Menüsü"
        aria-expanded={showMenu}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >

        <UserAvatar
          user={user}
          size="md"
          className="border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-indigo-100 transition-colors"
        />
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-[13px] text-slate-900 dark:text-white truncate">{user.fullName}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-tight truncate">
            {user.role === 'admin' ? 'Yönetici' : user.role === 'member' ? 'Üye' : user.role === 'manager' ? 'Yönetici' : user.role}
          </p>
        </div>
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-3 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 py-1.5 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">

          <Link
            to="/settings"
            onClick={() => setShowMenu(false)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Settings size={16} />
            <span>Ayarlar</span>
          </Link>
          {(user.role === 'admin' || user.role === 'manager') && (
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
  const { boardId } = useParams();
  const { projects, departments } = useDataState();
  const { toggleFavorite } = useDataActions();

  // Use prop if provided, otherwise fallback to URL param
  const activeBoardId = currentBoard || (boardId ? Number(boardId) : null);
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    boards: true
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
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

  // Missing function added here
  const handleCreateWorkspace = () => {
    setShowNewWorkspaceModal(true);
  };

  const onOpenWorkspaceSettings = (ws) => {
    if (ws) {
      setSelectedWorkspace(ws);
      setShowWorkspaceSettings(true);
    } else {
      console.warn("Workspace not provided");
    }
  };

  const { user } = useAuth();

  const favoriteBoards = projects.filter(b => b.favorite);

  const allBoards = React.useMemo(() => {
    if (!user) return [];

    const userDeptIds = user.departments || (user.department ? [user.department] : []);

    return projects.filter(p => {
      // 1. Owner or Member (Robust Type Check)
      if (p.owner == user.id || p.members?.some(m => m == user.id)) return true;
      // 2. Department Match (ID or Name)
      // Check if project.departmentId (int) or project.department (string/int) is in user's list
      if (userDeptIds.some(d => d == p.departmentId || d == p.department)) return true;

      return false;
    });
  }, [projects, user]);

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
          aria-label="Menüyü Aç"
          className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center active:scale-95 transition-transform"
        >

          <Menu size={20} />
        </button>
      </div>

      <div className={`
        bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col
        transition-transform duration-300 ease-out z-50
        md:translate-x-0 md:w-60 md:relative
        fixed inset-y-0 left-0 w-64 shadow-2xl md:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* App Logo/Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none">
              <Hexagon className="w-6 h-6 text-white fill-indigo-600" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Unity</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="md:hidden absolute top-4 right-4">
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Menüyü Kapat"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>

        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-hide">
          {/* Main Items */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium text-slate-600 dark:text-slate-400 text-[13px] group"
            >
              <Home size={18} className="group-hover:scale-110 transition-transform" />
              <span>Ana Sayfa</span>
            </Link>
            <Link
              to="/reports"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium text-slate-600 dark:text-slate-400 text-[13px] group"
            >
              <TrendingUp size={18} className="group-hover:scale-110 transition-transform" />
              <span>Raporlar</span>
            </Link>
          </div>

          {/* Favorites Section */}
          {favoriteBoards.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 flex items-center justify-between text-xs font-semibold text-slate-400 capitalize tracking-wider">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} className="fill-amber-500" />
                  <span>Favoriler</span>
                </div>
              </div>
              <div className="space-y-1">
                {favoriteBoards.map(board => (
                  <Link
                    key={board.id}
                    to={`/board/${board.id}`}
                    className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium relative overflow-hidden ${activeBoardId === board.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 rounded-r-full transition-opacity"
                      style={{ backgroundColor: board.color || '#4F46E5', opacity: activeBoardId === board.id ? 1 : 0.6 }}
                    />
                    <span className="flex-1 truncate pl-2">{board.name}</span>
                    <button
                      onClick={(e) => handleToggleFavorite(e, board.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all"
                    >
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces (Formerly Boards grouped by Department) */}
          <div className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between text-xs font-semibold text-slate-400 capitalize tracking-wider group">
              <button
                onClick={() => toggleSection('boards')}
                className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span>Çalışma Alanları</span>
                {expandedSections.boards ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              <button
                onClick={handleCreateWorkspace}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Yeni Çalışma Alanı"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Yeni Proje Button - Moved here from bottom */}
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group text-xs font-medium"
            >
              <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                <Plus size={12} />
              </div>
              <span>Yeni Proje</span>
            </button>

            {expandedSections.boards && (
              <div className="space-y-4 mt-2">
                {/* Iterate over Departments */}
                {departments.map(dept => {
                  const deptProjects = allBoards.filter(b =>
                    (b.departmentId && b.departmentId == dept.id) ||
                    (b.department && b.department === dept.name)
                  );

                  // FIX: Show department if User is member OR Admin, even if no projects exist
                  const isMemberOrAdmin = user?.role === 'admin' ||
                    (user?.departments && user.departments.some(d => d == dept.id));

                  if (deptProjects.length === 0 && !isMemberOrAdmin) return null;

                  return (
                    <div key={dept.id} className="space-y-1 relative group/section">
                      <div className="px-3 py-1.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px] text-xs font-semibold text-slate-400 dark:text-slate-500 capitalize tracking-wide">{dept.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenWorkspaceSettings(dept);
                          }}
                          className="opacity-0 group-hover/section:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all text-slate-400 hover:text-indigo-600"
                          title="Üyeleri Yönet"
                        >
                          <Settings size={12} />
                        </button>
                      </div>

                      {deptProjects.map(board => (
                        <Link
                          key={board.id}
                          to={`/board/${board.id}`}
                          className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium relative overflow-hidden ${activeBoardId === board.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 rounded-r-full transition-opacity"
                            style={{ backgroundColor: board.color || '#4F46E5', opacity: activeBoardId === board.id ? 1 : 0.6 }}
                          />
                          <span className="flex-1 truncate pl-2">{board.name}</span>
                          <button
                            onClick={(e) => handleToggleFavorite(e, board.id)}
                            className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all ${board.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <Star size={12} className={`${board.favorite ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                          </button>
                        </Link>
                      ))}
                    </div>
                  );
                })}

                {/* Other Projects / Orphans (Projects that didn't match any department above) */}
                {(() => {
                  // Re-calculate visible projects to find orphans
                  // Ideally we would track IDs in a Set above, but inside a map that's tricky to side-effect cleanly in React render.
                  // So we do a reverse check: projects whose department is NOT in the departments list.

                  const otherProjects = allBoards.filter(b => {
                    const matchesDept = departments.some(d =>
                      (b.departmentId && b.departmentId == d.id) ||
                      (b.department && b.department === d.name)
                    );
                    return !matchesDept;
                  });

                  if (otherProjects.length === 0) return null;

                  return (
                    <div className="space-y-1 relative group/section">
                      <div className="px-3 py-1.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px] text-xs font-semibold text-slate-400 dark:text-slate-500 capitalize tracking-wide">Diğer Projeler</span>
                        </div>
                      </div>

                      {otherProjects.map(board => (
                        <Link
                          key={board.id}
                          to={`/board/${board.id}`}
                          className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium relative overflow-hidden ${activeBoardId === board.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 rounded-r-full transition-opacity"
                            style={{ backgroundColor: board.color || '#4F46E5', opacity: activeBoardId === board.id ? 1 : 0.6 }}
                          />
                          <span className="flex-1 truncate pl-2">{board.name}</span>
                          <button
                            onClick={(e) => handleToggleFavorite(e, board.id)}
                            className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all ${board.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <Star size={12} className={`${board.favorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400 dark:text-slate-600'}`} />
                          </button>
                        </Link>
                      ))}
                    </div>
                  );
                })()}

              </div>
            )}
          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <UserProfile />

          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <Link to="/settings" className="hover:text-indigo-500 transition-colors">Ayarlar</Link>
          </div>
        </div>

      </div >

      {/* New Project Modal - Moved outside to escape sidebar constraints */}
      < NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />

      < WorkspaceSettingsModal
        isOpen={showWorkspaceSettings}
        onClose={() => setShowWorkspaceSettings(false)}
        initialWorkspace={selectedWorkspace}
      />

      <NewWorkspaceModal
        isOpen={showNewWorkspaceModal}
        onClose={() => setShowNewWorkspaceModal(false)}
      />
    </>
  );
};

export default Sidebar;
