const { createProxyMiddleware } = require('http-proxy-middleware');

// CRA Development Proxy Configuration
// This file is automatically loaded by Create React App in development mode.
// It proxies API requests from the frontend dev server to the backend.

module.exports = function (app) {
    // Get backend URL from environment or use default
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8080';

    app.use(
        '/api',
        createProxyMiddleware({
            target: backendUrl,
            changeOrigin: true,
            // Don't rewrite the path - keep /api prefix
            pathRewrite: undefined,
            // Log proxy activity in development
            logLevel: process.env.NODE_ENV === 'development' ? 'warn' : 'silent',
        })
    );

    // Also proxy uploads for avatar images
    app.use(
        '/uploads',
        createProxyMiddleware({
            target: backendUrl,
            changeOrigin: true,
        })
    );
};
