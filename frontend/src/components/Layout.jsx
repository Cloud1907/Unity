import React from 'react';
import BottomBar from './BottomBar';

const Layout = ({ sidebar, children }) => {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
            {/* Sidebar Area */}
            {sidebar}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative shadow-2xl shadow-slate-200/50 dark:shadow-none z-0">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {children}
                </div>

                {/* Global Bottom Bar */}
                <BottomBar />
            </div>
        </div>
    );
};

export default Layout;
