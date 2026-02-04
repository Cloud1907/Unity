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
