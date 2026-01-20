// Helper function to get avatar URL with correct base URL
export const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;

    // Production: use relative path (same domain)
    if (process.env.NODE_ENV === 'production') {
        return avatarPath;
    }

    // Development: use localhost:8080
    const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
    return `${baseUrl}${avatarPath}`;
};
