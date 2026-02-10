import api, { BASE_URL } from '../services/api';

/**
 * Helper function to get avatar URL with correct base URL
 */
export function getAvatarUrl(avatarPath) {
    if (!avatarPath) return '';
    if (typeof avatarPath !== 'string') return '';

    // Support Base64 Data URLs (DB Storage)
    if (avatarPath.startsWith('data:')) {
        return avatarPath;
    }

    // Support absolute URLs (Dicebear, External)
    if (avatarPath.startsWith('http') || avatarPath.startsWith('//')) {
        return avatarPath;
    }

    // Support relative paths (from our new upload system)
    if (avatarPath.startsWith('/uploads')) {
        let baseUrl = BASE_URL || '';

        // specific fix for localhost:8080/api -> localhost:8080 behavior
        if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4);
        } else if (baseUrl.endsWith('/api/')) {
            baseUrl = baseUrl.slice(0, -5);
        }

        // Remove trailing slash if exists to avoid double slash
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        return `${baseUrl}${avatarPath}`;
    }

    return '';
}

/**
 * Get backend base URL
 * @deprecated Use api.defaults.baseURL instead
 */
export function getBackendUrl() {
    return api.defaults.baseURL || '';
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
