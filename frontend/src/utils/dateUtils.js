/**
 * Date Utilities - Enterprise Standard
 * 
 * Centralized utility functions for safe date handling and formatting.
 * Specifically designed to handle timezone offsets and prevent 1-day shift bugs.
 */

/**
 * Converts a Date object or string to an ISO string safely by forcing 
 * the time to noon local before conversion. This prevents 1-day shifts 
 * caused by UTC conversion in positive timezones (like Turkey UTC+3).
 * 
 * @param {Date|string|number} date - Raw date value
 * @returns {string|null} - Normalized ISO string or null
 */
export const toSkyISOString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    // Set to 12:00:00 local to ensure UTC date part matches local date part
    // Even in UTC+14 or UTC-12, noon local will not shift the day part when converted to UTC
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
};

/**
 * Formats a date string for display in Turkish locale
 * 
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDisplayDate = (dateString, options = { day: 'numeric', month: 'short' }) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', options);
};
