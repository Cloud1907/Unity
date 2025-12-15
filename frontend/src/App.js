import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import BoardHeader from './components/BoardHeader';
import MainTable from './components/MainTable';
import KanbanView from './components/KanbanViewV2';
import CalendarView from './components/CalendarView';
import GanttView from './components/GanttView';
import WorkloadView from './components/WorkloadView';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import ProfileSettings from './pages/ProfileSettings';
import DashboardPage from './pages/Dashboard';
import TeamPage from './pages/TeamPage';
import ProjectsPage from './pages/ProjectsPage';
import { Toaster } from './components/ui/sonner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Dashboard = () => {
  const { projects } = useData();
  const [currentBoard, setCurrentBoard] = useState(null);
  const [currentView, setCurrentView] = useState('main');

  // İlk projeyi otomatik seç
  React.useEffect(() => {
    if (projects.length > 0 && !currentBoard) {
      setCurrentBoard(projects[0]._id);
    }
  }, [projects, currentBoard]);

  const handleBoardChange = (boardId) => {
    setCurrentBoard(boardId);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleNewBoard = () => {
    console.log('Creating new board...');
    // Mock new board creation
  };

  const renderView = () => {
    switch (currentView) {
      case 'kanban':
        return <KanbanView boardId={currentBoard} />;
      case 'calendar':
        return <CalendarView boardId={currentBoard} />;
      case 'gantt':
        return <GanttView boardId={currentBoard} />;
      case 'workload':
        return <WorkloadView boardId={currentBoard} />;
      default:
        return <MainTable boardId={currentBoard} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentBoard={currentBoard}
        onBoardChange={handleBoardChange}
        onNewBoard={handleNewBoard}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BoardHeader
          boardId={currentBoard}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        {renderView()}
      </div>
      <Toaster />
    </div>
  );
};

function App() {
  // 🛡️ Emergent Preview Body Lock Fix
  // Preview ortamında body'nin pointer-events: none olmasını engeller
  useEffect(() => {
    const isPreviewEnv = window.location.hostname.includes('emergent') || 
                         window.location.hostname.includes('preview');
    
    if (!isPreviewEnv) return; // Sadece preview ortamında çalışsın

    console.log('🛡️ Emergent Preview body lock protection enabled');

    // İlk render'da body kilidini kaldır
    const unlockBody = () => {
      if (document.body) {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        document.body.removeAttribute('data-scroll-locked');
      }
    };

    // Hemen uygula
    unlockBody();

    // MutationObserver ile body attribute değişikliklerini izle
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          const hasLock = document.body.hasAttribute('data-scroll-locked') ||
                         document.body.style.pointerEvents === 'none';
          
          if (hasLock) {
            console.warn('⚠️ Body locked detected! Auto-unlocking...');
            unlockBody();
          }
        }
      });
    });

    // Body'deki attribute ve style değişikliklerini izle
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked', 'class']
    });

    // Periyodik kontrol (ekstra güvence)
    const intervalId = setInterval(unlockBody, 1000);

    // Cleanup
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
      console.log('🛡️ Body lock protection cleaned up');
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/:boardId"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen overflow-hidden">
                      <Sidebar onBoardChange={() => {}} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <AdminPanel />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen overflow-hidden">
                      <Sidebar onBoardChange={() => {}} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <ProfileSettings />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen overflow-hidden">
                      <Sidebar onBoardChange={() => {}} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <DashboardPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen overflow-hidden">
                      <Sidebar onBoardChange={() => {}} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <TeamPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen overflow-hidden">
                      <Sidebar onBoardChange={() => {}} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <ProjectsPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
