import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDataActions, useDataState } from '../contexts/DataContext';
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
    const { boardId: urlBoardId } = useParams();
    const { projects, loading } = useDataState();
    const { joinProjectGroup, leaveProjectGroup } = useDataActions();

    // Determine target board ID (URL or first available project)
    const currentBoardId = urlBoardId ? Number(urlBoardId) : (projects.length > 0 ? projects[0].id : null);

    const [currentView, setCurrentView] = useState('main');

    // Search and Filter State - Lifted Up
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: [],
        priority: [],
        assignee: [],
        labels: []
    });
    const [groupBy, setGroupBy] = useState('status');

    // Handle SignalR Group Subscription
    useEffect(() => {
        if (currentBoardId) {
            joinProjectGroup(currentBoardId);
            return () => {
                leaveProjectGroup(currentBoardId);
            };
        }
    }, [currentBoardId, joinProjectGroup, leaveProjectGroup]);

    const handleViewChange = (view) => {
        setCurrentView(view);
    };

    const renderView = () => {
        // Loading State
        if (loading && projects.length === 0) {
            if (currentView === 'kanban') return <KanbanSkeleton />;
            return <TableSkeleton />;
        }

        const viewProps = {
            boardId: currentBoardId,
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
                return <WorkloadView boardId={currentBoardId} />;
            default:
                return <MainTable {...viewProps} />;
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <BoardHeader
                boardId={currentBoardId}
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
                        key={currentView} // Prevent mount loops
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
    );
};

export default BoardView;
