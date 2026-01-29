/* eslint-disable */


/**
 * Helper function to get avatar URL with correct base URL
 * DESIGN DECISION: Always use color + initials (never image uploads)
 * User preference: Professional appearance with consistent colored initials
 */
export function getAvatarUrl(avatarPath) {
    // 1. If valid avatarPath is provided (uploaded image or specific URL), use it
    if (avatarPath && !avatarPath.includes('dicebear') && (avatarPath.startsWith('http') || avatarPath.startsWith('/uploads'))) {
        // Add timestamp to flush cache if needed, or just return as is
        // For local uploads, we might want to ensure backend URL is prepended if relative
        if (avatarPath.startsWith('/uploads')) {
            const backendUrl = getBackendUrl();
            return `${backendUrl}${avatarPath}`;
        }
        return avatarPath;
    }

    // 2. Return empty string to force AvatarFallback in UI
    return '';
}

/**
 * Get backend base URL
 */
export function getBackendUrl() {
    if (process.env.NODE_ENV === 'production') {
        return '';
    }
    return process.env.REACT_APP_BACKEND_URL || '';
}
