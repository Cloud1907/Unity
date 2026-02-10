import { normalizeEntity } from './entityHelpers';

/**
 * Recursively updates a task within a nested tree structure.
 * 
 * @param {Array} taskList - The current list of tasks/subtasks
 * @param {number} targetId - ID of the task to update
 * @param {Object} newData - Data to merge into the target task
 * @returns {Array} - New array with the updated task, or original array if no match
 */
export const updateTaskInTree = (taskList, targetId, newData) => {
    if (!taskList || !Array.isArray(taskList)) return taskList;

    return taskList.map(task => {
        // 1. Check strict ID match
        if (task.id === targetId) {
            // STALE UPDATE PROTECTION:
            // If newData has an updatedAt timestamp, only apply if it's newer than (or same as) current task
            // STALE UPDATE PROTECTION:
            // Disabled for now due to TimeZone mismatches causing fresh API data to be rejected.
            /*
            if (newData.updatedAt && task.updatedAt) {
                const newTime = new Date(newData.updatedAt).getTime();
                const taskTime = new Date(task.updatedAt).getTime();
                if (newTime < taskTime) {
                    console.log(`[TaskHelpers] Dropping stale update for task ${targetId} (new: ${newData.updatedAt} < current: ${task.updatedAt})`);
                    return task;
                }
            }
            */

            // Debug logs removed after verification

            // MERGE FIX: Preserve existing subtasks if they are not in the update data
            // This prevents SignalR updates from wiping out nested children
            const mergedSubtasks = newData.subtasks !== undefined
                ? newData.subtasks
                : (task.subtasks || []);

            return normalizeEntity({
                ...task,
                ...newData,
                subtasks: mergedSubtasks
            });
        }

        // 2. Recurse if subtasks exist
        if (task.subtasks && task.subtasks.length > 0) {
            const updatedSubtasks = updateTaskInTree(task.subtasks, targetId, newData);

            // Reference equality check: Only return new object if children actually changed
            if (updatedSubtasks !== task.subtasks) {
                return { ...task, subtasks: updatedSubtasks };
            }
        }

        return task;
    });
};

/**
 * Recursively finds a task in the tree.
 * @param {Array} taskList
 * @param {number} targetId
 * @returns {Object|null}
 */
export const findTaskInTree = (taskList, targetId) => {
    if (!taskList || !Array.isArray(taskList)) return null;

    for (const task of taskList) {
        if (task.id === targetId) return task;
        if (task.subtasks && task.subtasks.length > 0) {
            const found = findTaskInTree(task.subtasks, targetId);
            if (found) return found;
        }
    }
    return null;
};
