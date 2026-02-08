import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import PageTransition from './PageTransition';
import ErrorBoundary from './shared/ErrorBoundary';
import { TableSkeleton } from './skeletons/TableSkeleton';

// Lazy load pages for "Lazy Architecture" constitution rule
const BoardView = lazy(() => import('../pages/BoardView'));
const Login = lazy(() => import('../pages/Login'));
const Settings = lazy(() => import('../pages/Settings'));
const AdminPanel = lazy(() => import('../pages/AdminPanel'));
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const TeamPage = lazy(() => import('../pages/TeamPage'));
const Reports = lazy(() => import('../pages/Reports'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const TestResults = lazy(() => import('../pages/TestResults'));
const MyTasks = lazy(() => import('../pages/MyTasks'));

const PageLoader = () => (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#0f172a] p-8">
        <TableSkeleton />
    </div>
);

const AnimatedRoutes = () => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
                {/* Persistent Sidebar - Stays mounted across route changes */}
                {!isLoginPage && <Sidebar />}

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative shadow-2xl shadow-slate-200/50 dark:shadow-none z-0">
                    <div className="flex-1 overflow-hidden relative flex flex-col">
                        <AnimatePresence mode="wait" initial={false}>
                            <Suspense fallback={<PageLoader />}>
                                <Routes location={location} key={location.pathname}>
                                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

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
                                                <PageTransition>
                                                    <BoardView />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/settings"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <Settings />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/admin"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <AdminPanel />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/dashboard"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <DashboardPage />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/team"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <TeamPage />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/reports"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <Reports />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/projects"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <ProjectsPage />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/tests"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <TestResults />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/my-tasks"
                                        element={
                                            <ProtectedRoute>
                                                <PageTransition>
                                                    <MyTasks />
                                                </PageTransition>
                                            </ProtectedRoute>
                                        }
                                    />
                                </Routes>
                            </Suspense>
                        </AnimatePresence>
                    </div>

                    {!isLoginPage && <BottomBar />}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default AnimatedRoutes;
