import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
    const navigate = useNavigate();
    const { projects, loading } = useDataState();
    const { joinProjectGroup, leaveProjectGroup } = useDataActions();

    // Determine target board ID (URL or first available project)
    const currentBoardId = urlBoardId ? Number(urlBoardId) : (projects.length > 0 ? projects[0].id : null);

    // --- Security / Authorization Check ---
    useEffect(() => {
        if (!loading && urlBoardId) {
            const hasAccess = projects.some(p => p.id === Number(urlBoardId));
            if (!hasAccess) { 
                toast.error('Bu projeyi görüntüleme yetkiniz bulunmuyor.', {
                    description: 'Sadece üyesi olduğunuz projeleri görüntüleyebilirsiniz.'
                });
                navigate('/dashboard?filter=all', { replace: true });
            }
        }
    }, [urlBoardId, projects, loading, navigate]);

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
    // New: Completed Task Filter (Default: 7days)
    const [completedFilter, setCompletedFilter] = useState('7days');

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
            groupBy,
            completedFilter // Pass to views
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
                completedFilter={completedFilter}
                onCompletedFilterChange={setCompletedFilter}
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
