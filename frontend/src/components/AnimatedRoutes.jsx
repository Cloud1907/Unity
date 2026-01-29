import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import Sidebar from './Sidebar';
import Layout from './Layout';
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

// Global loading fallback
const PageLoader = () => (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#0f172a] p-8">
        <TableSkeleton />
    </div>
);


const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <ErrorBoundary>
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
                                        <div className="flex h-screen overflow-hidden">
                                            <Sidebar onBoardChange={() => { }} />
                                            <div className="flex-1 flex flex-col overflow-hidden">
                                                <AdminPanel />
                                            </div>
                                        </div>
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />


                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <Layout sidebar={<Sidebar onBoardChange={() => { }} />}>
                                            <DashboardPage />
                                        </Layout>
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/team"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <div className="flex h-screen overflow-hidden">
                                            <Sidebar onBoardChange={() => { }} />
                                            <div className="flex-1 flex flex-col overflow-hidden">
                                                <TeamPage />
                                            </div>
                                        </div>
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/reports"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <Layout sidebar={<Sidebar onBoardChange={() => { }} />}>
                                            <Reports />
                                        </Layout>
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/projects"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <div className="flex h-screen overflow-hidden">
                                            <Sidebar onBoardChange={() => { }} />
                                            <div className="flex-1 flex flex-col overflow-hidden">
                                                <ProjectsPage />
                                            </div>
                                        </div>
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/tests"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <div className="flex h-screen overflow-hidden">
                                            <Sidebar onBoardChange={() => { }} />
                                            <div className="flex-1 flex flex-col overflow-hidden">
                                                <TestResults />
                                            </div>
                                        </div>
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/my-tasks"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <Layout sidebar={<Sidebar onBoardChange={() => { }} />}>
                                            <MyTasks />
                                        </Layout>
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Suspense>
            </AnimatePresence>
        </ErrorBoundary>
    );
};

export default AnimatedRoutes;
