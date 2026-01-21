import React, { useState } from 'react';
import { Home, Settings, Plus, ChevronDown, ChevronRight, Star, LogOut, Menu, X, Lock, Users, Hexagon, TrendingUp, FolderPlus, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl } from '../utils/avatarHelper';
import NewProjectModal from './NewProjectModal';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';
import NewWorkspaceModal from './NewWorkspaceModal';
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
          <AvatarImage
            src={getAvatarUrl(user.avatar)}
            alt={user.fullName}
          />
          <AvatarFallback style={{ backgroundColor: user.color }} className="text-white font-medium">
            {user.fullName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
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
  const { projects, toggleFavorite, departments, createDepartment, tasks } = useData();
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

  const onOpenWorkspaceSettings = (workspaceName) => {
    // Find workspace object by name (fallback if ID not directly available in loop)
    let ws = departments.find(d => d.name === workspaceName);

    // Fallback for "Genel" or "Other" which might be distinct in DB but named differently in UI
    if (!ws && workspaceName === 'Genel') {
      ws = departments.find(d => d.id === 1 || d._id === 1);
    }

    if (ws) {
      setSelectedWorkspace(ws);
      setShowWorkspaceSettings(true);
    } else {
      console.warn("Workspace not found:", workspaceName);
      alert(`"${workspaceName}" çalışma alanı düzenlenemez.`);
    }
  };

  const { user } = useAuth();

  const favoriteBoards = projects.filter(b => b.favorite);

  const allBoards = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return projects;

    const userDeptIds = user.departments || (user.department ? [user.department] : []);

    return projects.filter(p => {
      // 1. Owner or Member
      if (p.owner === (user._id || user.id) || p.members?.includes(user._id || user.id)) return true;
      // 2. Private Project check
      if (p.isPrivate) return false;
      // 3. Department Match (ID or Name)
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

          {/* Workspaces (Formerly Boards grouped by Department) */}
          <div className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider group">
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

            {expandedSections.boards && (
              <div className="space-y-4 mt-2">
                {/* Iterate over Workspaces (Departments) first to ensure correct order and names */}
                {departments.map(dept => {
                  // Find projects for this department
                  // Handle both string/number ID mismatch safely
                  const deptProjects = allBoards.filter(b =>
                    (b.departmentId && (b.departmentId == dept.id || b.departmentId == dept._id)) ||
                    (b.department && b.department === dept.name) // Fallback for legacy
                  );

                  // Optional: if you only want to show workspaces that have projects OR the user is a member of:
                  // The 'allBoards' filtering already handles user permission for projects.
                  // But we might want to show empty workspaces the user is a member of too.

                  // Skip if no projects and user not relevant? 
                  // Current requirement seems to be "show based on real workspaces"

                  // Only render if there are projects
                  if (deptProjects.length === 0) return null;

                  return (
                    <div key={dept._id || dept.id} className="space-y-1 relative group/section">
                      <div className="px-3 py-1.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px] text-xs font-semibold text-slate-400 dark:text-slate-500 capitalize tracking-wide">{dept.name}</span>
                        </div>

                        {/* Settings Trigger */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenWorkspaceSettings(dept.name);
                          }}
                          className="opacity-0 group-hover/section:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all text-slate-400 hover:text-indigo-600"
                          title="Üyeleri Yönet"
                        >
                          <Settings size={12} />
                        </button>
                      </div>

                      {deptProjects.map(board => (
                        <Link
                          key={board._id}
                          to={`/board/${board._id}`}
                          className={`group w-full flex items-center gap-1.5 px-3 py-1 rounded-md transition-all text-[13px] ${currentBoard === board._id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border-r-2 border-blue-600'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-normal'
                            }`}
                        >
                          <div
                            className="w-1 rounded-full h-6 transition-all"
                            style={{ backgroundColor: board.color }}
                          />
                          <span className="flex-1 text-left truncate flex items-center gap-1.5">
                            {board.name}
                            {board.isPrivate && <Lock size={12} className="text-slate-400" />}
                          </span>
                        </Link>
                      ))
                      }
                    </div>
                  );
                })}

                {/* Orphan projects 'Diğer' section removed per user request */}

                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group mt-2 text-[13px] font-medium"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <Plus size={14} />
                  </div>
                  <span>Yeni Proje</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <UserProfile />

          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <span>Unity v{pkg.version}</span>
            <span>•</span>
            <Link to="/settings" className="hover:text-indigo-500 transition-colors">Ayarlar</Link>
          </div>
        </div>

      </div>

      {/* New Project Modal - Moved outside to escape sidebar constraints */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />

      <WorkspaceSettingsModal
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
