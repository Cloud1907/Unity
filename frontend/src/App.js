import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import BoardHeader from './components/BoardHeader';
import MainTable from './components/MainTable';
import KanbanView from './components/KanbanView';
import CalendarView from './components/CalendarView';
import GanttView from './components/GanttView';
import WorkloadView from './components/WorkloadView';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
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
  const [currentBoard, setCurrentBoard] = useState('1');
  const [currentView, setCurrentView] = useState('main');

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
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
