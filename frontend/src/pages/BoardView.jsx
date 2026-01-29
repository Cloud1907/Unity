import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import BoardHeader from '../components/BoardHeader';
import MainTable from '../components/MainTable';
import KanbanView from '../components/KanbanViewV2';
import CalendarView from '../components/CalendarView';
import GanttView from '../components/GanttView';
import WorkloadView from '../components/WorkloadView';
import { KanbanSkeleton } from '../components/skeletons/KanbanSkeleton';
import { TableSkeleton } from '../components/skeletons/TableSkeleton';

const BoardView = () => {
    const { boardId } = useParams();
    const { projects, loading } = useData();
    const [currentBoard, setCurrentBoard] = useState(boardId);
    const [currentView, setCurrentView] = useState('main');

    // Search and Filter State - Lifted Up
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: [],
        priority: [],
        assignee: [],
        labels: []
    });
    const [groupBy, setGroupBy] = useState('status'); // 'status', 'priority', 'labels', 'tShirtSize'

    // Sync state with URL params
    useEffect(() => {
        if (boardId) {
            setCurrentBoard(boardId);
        } else if (projects.length > 0 && !currentBoard) {
            setCurrentBoard(projects[0]._id);
        }
    }, [boardId, projects, currentBoard]);

    const handleBoardChange = (newBoardId) => {
        setCurrentBoard(newBoardId);
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
    };

    const handleNewBoard = () => {
        // Creating new board
        // Mock new board creation
    };

    const renderView = () => {
        // Loading State
        if (loading && projects.length === 0) {
            if (currentView === 'kanban') return <KanbanSkeleton />;
            return <TableSkeleton />;
        }

        const viewProps = {
            boardId: currentBoard,
            searchQuery,
            filters,
            groupBy
        };

        switch (currentView) {
            case 'kanban':
                return <KanbanView {...viewProps} />;
            case 'calendar':
                return <CalendarView {...viewProps} />;
            case 'gantt':
                return <GanttView {...viewProps} />;
            case 'workload':
                return <WorkloadView boardId={currentBoard} />;
            default:
                return <MainTable {...viewProps} />;
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
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
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filters={filters}
                    onFilterChange={setFilters}
                    groupBy={groupBy}
                    onGroupByChange={setGroupBy}
                />

                {/* Animated Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentView + (loading ? '-loading' : '')}
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full w-full"
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default BoardView;
