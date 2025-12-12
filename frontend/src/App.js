import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BoardHeader from './components/BoardHeader';
import MainTable from './components/MainTable';
import KanbanView from './components/KanbanView';
import CalendarView from './components/CalendarView';
import GanttView from './components/GanttView';
import WorkloadView from './components/WorkloadView';
import { Toaster } from './components/ui/sonner';

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
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
