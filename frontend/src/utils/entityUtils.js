/**
 * Entity Utilities - Enterprise Standard
 * 
 * Centralized utility functions for entity normalization and ID extraction.
 * Used across TaskRow, MainTable, and other components that handle task data.
 */

/**
 * Extracts IDs from a list of entities or mixed values.
 * Handles various formats: objects with different ID keys, direct numbers, strings.
 * 
 * @param {Array} list - Array of entities or IDs
 * @param {string} primaryKey - Primary key to look for (default: 'userId')
 * @returns {Array<number>} - Array of normalized integer IDs
 * 
 * @example
 * // TaskAssignee objects
 * extractIds([{ userId: 1 }, { userId: 2 }]) // → [1, 2]
 * 
 * // Label objects
 * extractIds([{ labelId: 5 }], 'labelId') // → [5]
 * 
 * // Direct IDs
 * extractIds([1, 2, 3]) // → [1, 2, 3]
 */
export const extractIds = (list, primaryKey = 'userId') => {
    if (!list || !Array.isArray(list)) return [];

    return list.map(item => {
        // Handle direct primitive values
        if (typeof item === 'number') return item;
        if (typeof item === 'string') {
            const parsed = parseInt(item, 10);
            return isNaN(parsed) ? null : parsed;
        }

        // Handle objects with various ID keys
        if (typeof item === 'object' && item !== null) {
            // Priority: primaryKey > id > Id > labelId > LabelId > userId > UserId > uid
            return item[primaryKey]
                || item.id
                || item.Id
                || item.labelId
                || item.LabelId
                || item.userId
                || item.UserId
                || item.uid
                || null;
        }

        return null;
    }).filter(id => id !== null);
};

/**
 * Normalizes assignee data from various formats to consistent array of user IDs.
 * 
 * @param {Array} assignees - Raw assignee data from API
 * @returns {Array<number>} - Array of user IDs
 */
export const normalizeAssignees = (assignees) => {
    if (!assignees) return [];
    return extractIds(assignees, 'userId');
};

/**
 * Normalizes label data from various formats to consistent array of label IDs.
 * 
 * @param {Array} labels - Raw label data from API
 * @returns {Array<number>} - Array of label IDs
 */
export const normalizeLabels = (labels) => {
    if (!labels) return [];
    return extractIds(labels, 'labelId');
};

/**
 * Normalizes a single entity ID from various formats.
 * 
 * @param {number|string|object} value - Raw ID value
 * @returns {number|null} - Normalized integer ID or null
 */
export const normalizeId = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }
    if (typeof value === 'object' && value !== null) {
        return value.id || value.Id || null;
    }
    return null;
};
