/* eslint-disable */

/**
 * Helper function to get avatar URL with correct base URL
 */
export function getAvatarUrl(avatarPath) {
    if (!avatarPath) return '';

    // Support Base64 Data URLs
    if (avatarPath.startsWith('data:')) {
        return avatarPath;
    }

    if (!avatarPath.includes('dicebear') && (avatarPath.startsWith('http') || avatarPath.startsWith('/uploads'))) {
        if (avatarPath.startsWith('/uploads')) {
            const backendUrl = getBackendUrl();
            return `${backendUrl}${avatarPath}`;
        }
        return avatarPath;
    }

    // Fallback for relative paths or dicebear
    if (avatarPath.includes('dicebear') || avatarPath.startsWith('http')) {
        return avatarPath;
    }

    return '';
}

/**
 * Get backend base URL
 */
export function getBackendUrl() {
    if (process.env.NODE_ENV === 'production') {
        return '';
    }
    // Correctly fallback to localhost:8080 or environment variable
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
}

/**
 * Robust initials extraction
 */
export function getInitials(name) {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Consistent color generation for users
 */
export function getUserColor(user) {
    if (user?.color) return user.color;
    const colors = ['#e2445c', '#00c875', '#fdab3d', '#579bfc', '#a25ddc', '#784bd1', '#ff642e', '#F59E0B'];
    const name = user?.fullName || user?.username || 'User';
    const index = name.length % colors.length;
    return colors[index];
}
