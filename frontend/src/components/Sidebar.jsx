import React, { useState, useRef } from 'react';
import { Home, Settings, Plus, ChevronDown, ChevronRight, LogOut, Menu, X, Lock, Users, Hexagon, TrendingUp, FolderPlus, CheckSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDataState } from '../contexts/DataContext';
import UserAvatar from './ui/shared/UserAvatar';
import { getAvatarUrl, getInitials, getUserColor } from '../utils/avatarHelper';
import NewProjectModal from './NewProjectModal';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';
import SidebarSettingsModal from './SidebarSettingsModal';
import NewWorkspaceModal from './NewWorkspaceModal';
import { DynamicIcon } from './IconPicker';
import pkg from '../../package.json';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const { projects, departments } = useDataState();
  // deleteDepartment removed - was unused

  // Use prop if provided, otherwise fallback to URL param
  const activeBoardId = currentBoard || (boardId ? Number(boardId) : null);
  const [expandedSections, setExpandedSections] = useState({
    boards: true
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [showSidebarSettings, setShowSidebarSettings] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // PERFORMANCE FIX: Removed local state overrides and debounce refs
  // const [localCollapsedOverrides, setLocalCollapsedOverrides] = useState({});
  // const debounceTimerRef = useRef(null);
  // const pendingPrefsRef = useRef(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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



  const { updatePreferences } = useAuth();

  const allBoards = React.useMemo(() => {
    if (!user) return [];

    // user.role === 'admin' check REMOVED per user request (Melih Bulut shouldn't see all projects in sidebar)
    // if (user.role === 'admin') return projects;

    return projects.filter(project => {
      // 1. Check if user is the owner
      if (project.owner === user.id) return true;

      // 2. Check if user is a direct member of the project
      if (project.members && Array.isArray(project.members)) {
        if (project.members.some(m => m.userId === user.id)) return true;
      }

      // 3. CRITICAL: user.departments is INTEGER ARRAY [1, 2, 3], not [{departmentId: 1}, ...]
      if (project.departmentId && user.departments && Array.isArray(user.departments)) {
        if (user.departments.includes(project.departmentId)) {
          return true;
        }
      }

      return false;
    });
  }, [projects, user]);

  // Calculate other projects (orphans) with useMemo for performance
  const otherProjects = React.useMemo(() => {
    if (!allBoards || !departments) return [];
    return allBoards.filter(b => {
      const matchesDept = departments.some(d =>
        (b.departmentId && String(b.departmentId) === String(d.id)) ||
        (b.department && b.department === d.name)
      );
      return !matchesDept;
    });
  }, [allBoards, departments]);

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

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSidebarSettings(true)}
                  className="opacity-40 hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all text-slate-400 hover:text-indigo-600"
                  title="Sidebari Düzenle"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  className="opacity-40 hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all text-slate-400 hover:text-indigo-600"
                  title="Yeni Çalışma Alanı"
                >
                  <Plus size={14} />
                </button>
              </div>


            </div>

            {/* Yeni Proje Button - Moved here from bottom */}
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group text-xs font-medium mb-2"
            >
              <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                <Plus size={12} />
              </div>
              <span>Yeni Proje</span>
            </button>

            {expandedSections.boards && (() => {
              let sortedDepts = [...departments];
              const prefsMap = new Map();

              // Use structured workspacePreferences if available
              if (user?.workspacePreferences && user.workspacePreferences.length > 0) {
                user.workspacePreferences.forEach(pref => {
                  prefsMap.set(pref.departmentId, pref);
                });

                // Filter by visibility
                sortedDepts = sortedDepts.filter(d => {
                  const pref = prefsMap.get(d.id);
                  return pref ? pref.isVisible : true;
                });

                // Sort by sortOrder
                sortedDepts.sort((a, b) => {
                  const prefA = prefsMap.get(a.id);
                  const prefB = prefsMap.get(b.id);
                  const orderA = prefA ? prefA.sortOrder : 999;
                  const orderB = prefB ? prefB.sortOrder : 999;
                  return orderA - orderB;
                });
              } else if (user?.sidebarPreferences) {
                // Fallback to JSON preferences
                try {
                  const prefs = JSON.parse(user.sidebarPreferences);
                  const order = prefs.order || [];
                  const visibility = prefs.visibility || {};

                  sortedDepts = sortedDepts.filter(d => visibility[d.id] !== false);

                  sortedDepts.sort((a, b) => {
                    const indexA = order.indexOf(a.id);
                    const indexB = order.indexOf(b.id);
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                  });
                } catch (e) {
                  console.error("Sidebar preference error:", e);
                }
              }

              const toggleWorkspaceCollapse = (deptId, currentCollapsed) => {
                const newCollapsedState = !currentCollapsed;

                // Simple API Update without Debounce/Optimistic complexity
                const updatedPrefs = [...(user?.workspacePreferences || [])];
                const index = updatedPrefs.findIndex(p => p.departmentId === deptId);

                if (index !== -1) {
                  updatedPrefs[index] = { ...updatedPrefs[index], isCollapsed: newCollapsedState };
                } else {
                  updatedPrefs.push({
                    userId: user.id,
                    departmentId: deptId,
                    isCollapsed: newCollapsedState,
                    isVisible: true,
                    sortOrder: 999
                  });
                }

                updatePreferences({ workspacePreferences: updatedPrefs });
              };

              return (
                <div className="space-y-4 mt-2">
                  {sortedDepts.map(dept => {
                    const deptProjects = allBoards.filter(b =>
                      (b.departmentId && b.departmentId == dept.id) ||
                      (b.department && b.department === dept.name)
                    );

                    // Simplified Logic: Show if admin OR member of department
                    // AND if filtered by preferences (already handled by sortedDepts logic above)
                    // We REMOVED the "project count > 0" check for visibility to avoid hiding empty workspaces

                    const isMember = user?.departments && Array.isArray(user.departments) && user.departments.includes(dept.id);
                    const isAdmin = user?.role === 'admin';

                    // console.log(`Dept ${dept.name} (${dept.id}): isMember=${isMember}, isAdmin=${isAdmin}, Projects=${deptProjects.length}`);

                    if (!isMember && !isAdmin) return null;

                    // Check if this workspace is collapsed
                    const pref = prefsMap.get(dept.id);
                    const isCollapsed = pref ? pref.isCollapsed : false;

                    return (
                      <div key={dept.id} className="space-y-1 relative group/section">
                        <div
                          onClick={() => toggleWorkspaceCollapse(dept.id, isCollapsed)}
                          className="px-3 py-1.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 mb-1 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`text-slate-400 hover:text-indigo-500 transition-all duration-200 ${isCollapsed ? '-rotate-90' : ''}`}>
                              <ChevronDown size={14} />
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Users size={14} className={`shrink-0 ${isCollapsed ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                              <span className="truncate max-w-[120px] text-xs font-medium text-slate-400 dark:text-slate-500 capitalize tracking-wide">
                                {dept.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenWorkspaceSettings(dept);
                              }}
                              className="opacity-0 group-hover/section:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all"
                              title="Çalışma Alanı Ayarları"
                            >
                              <Settings size={12} className="text-slate-400 hover:text-indigo-600" />
                            </button>
                          </div>
                        </div>

                        {/* Only show projects if not collapsed */}
                        {!isCollapsed && deptProjects.map(board => (
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
                          </Link>
                        ))}
                      </div>
                    );
                  })}

                  {/* Other Projects / Orphans */}
                  {otherProjects.length > 0 && (
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
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <UserProfile />

          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
              <Link to="/settings" className="hover:text-indigo-500 transition-colors">Ayarlar</Link>
            </div>
            <div className="text-[9px] text-slate-300 dark:text-slate-600 font-medium tracking-wide">
              Univera Task Management
            </div>
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

      <SidebarSettingsModal
        isOpen={showSidebarSettings}
        onClose={() => setShowSidebarSettings(false)}
      />

      <NewWorkspaceModal
        isOpen={showNewWorkspaceModal}
        onClose={() => setShowNewWorkspaceModal(false)}
      />
    </>
  );
};

export default Sidebar;
