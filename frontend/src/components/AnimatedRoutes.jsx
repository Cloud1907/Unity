import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import Sidebar from './Sidebar';
import Layout from './Layout';
import BoardView from '../pages/BoardView';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Settings from '../pages/Settings';
import AdminPanel from '../pages/AdminPanel';
import DashboardPage from '../pages/Dashboard';
import TeamPage from '../pages/TeamPage';
import Reports from '../pages/Reports';
import ProjectsPage from '../pages/ProjectsPage';
import TestResults from '../pages/TestResults';
import MyTasks from '../pages/MyTasks';
import PageTransition from './PageTransition';

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

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
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
