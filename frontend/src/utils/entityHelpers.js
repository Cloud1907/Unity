/**
 * Centralized utility for entity normalization and helper functions.
 * STRICTLY enforces integer IDs and standard field names.
 */

/**
 * Normalizes an entity to ensure it has a strictly integer 'id'.
 * Removes '_id' and other legacy fields.
 * 
 * @param {Object} entity - The entity object to normalize (User, Task, Project, etc.)
 * @returns {Object} The normalized entity with strict 'id' (number).
 */
export const normalizeEntity = (entity) => {
    if (!entity) return null;

    // Extract ID - STRICT MODE: Only accept 'id' or 'Id'
    // Do NOT fall back to projectId as that causes logical collisions
    const rawId = entity.id || entity.Id;

    // STRICT VALIDATION: If no valid ID is found, we log CRITICAL error but return null to avoid crashing the entire app
    if (rawId === undefined || rawId === null) {
        // If it's a new entity being normalized for optimistic update, it should have an id already assigned
        console.error("CRITICAL: Entity missing ID detected! Item skipped.", entity);
        return null; 
    }

    // Convert to number
    const id = isNaN(rawId) ? 0 : Number(rawId);
    if (id === 0) {
        console.warn("Warning: Entity has ID 0, which might be invalid for existing records.", entity);
    }

    // Normalize Subtasks (Recursive)
    let subtasks = entity.subtasks || entity.Subtasks || [];
    if (subtasks.length > 0) {
        subtasks = subtasks.map(normalizeEntity);
    }

    // Flatten Assignees
    // Backend returns: Assignees: [{ userId: 1, user: { ... } }, ...]
    let assigneeIds = [];
    let fullAssignees = [];
    const rawAssignees = entity.assignees || entity.Assignees || entity.assigneeIds || entity.AssigneeIds;
    if (Array.isArray(rawAssignees)) {
        rawAssignees.forEach(a => {
            if (typeof a === 'object' && a !== null) {
                // If it's a junction object (TaskAssignee) with a 'user' navigation property
                if (a.user || a.User) {
                    const userObj = a.user || a.User;
                    fullAssignees.push({
                        id: userObj.id || userObj.Id || a.userId || a.UserId,
                        username: userObj.username || userObj.Username,
                        fullName: userObj.fullName || userObj.FullName,
                        avatar: userObj.avatar || userObj.Avatar,
                        color: userObj.color || userObj.Color
                    });
                    assigneeIds.push(userObj.id || userObj.Id || a.userId || a.UserId);
                } else {
                    const id = a.userId || a.UserId || a.id || a.Id;
                    if (id) {
                        assigneeIds.push(id);
                        fullAssignees.push({
                            id,
                            username: a.username || a.Username,
                            fullName: a.fullName || a.FullName || 'Kullanıcı',
                            avatar: a.avatar || a.Avatar,
                            color: a.color || a.Color
                        });
                    }
                }
            } else if (a) {
                assigneeIds.push(a); // Already an ID
            }
        });
    }

    // Clean up assigneeIds
    assigneeIds = assigneeIds.filter(id => id !== undefined && id !== null && String(id) !== '0');

    // Flatten Labels similarly
    let labelIds = [];
    let fullLabels = [];
    const rawLabels = entity.labels || entity.Labels || entity.labelIds || entity.LabelIds || entity.tagIds || entity.TagIds;
    if (Array.isArray(rawLabels)) {
        rawLabels.forEach(l => {
            if (typeof l === 'object' && l !== null) {
                // If it's a junction object (TaskLabel) with a 'label' navigation property
                if (l.label || l.Label) {
                    const labelObj = l.label || l.Label;
                    fullLabels.push({
                        id: labelObj.id || labelObj.Id || labelObj.labelId || labelObj.LabelId,
                        name: labelObj.name || labelObj.Name,
                        color: labelObj.color || labelObj.Color,
                        projectId: labelObj.projectId || labelObj.ProjectId
                    });
                    labelIds.push(labelObj.id || labelObj.Id || labelObj.labelId || labelObj.LabelId);
                } else {
                    const id = l.labelId || l.LabelId || l.id || l.Id;
                    if (id) {
                        labelIds.push(id);
                        fullLabels.push({
                            id,
                            name: l.name || l.Name || 'Etiket',
                            color: l.color || l.Color || '#808080',
                            projectId: l.projectId || l.ProjectId
                        });
                    }
                }
            } else if (l) {
                labelIds.push(l); // Already an ID
            }
        });
    }

    // Clean up labelIds
    labelIds = labelIds.filter(id => id !== undefined && id !== null && String(id) !== '0');

    // Construct the Clean Object
    // We explicitly pick fields to avoid polluting state with legacy junk
    const cleanEntity = {
        ...entity, // Spread original to keep other props
        id: id,   // Enforce Number ID

        // Standardize common fields
        title: entity.title || entity.Title || '',
        description: entity.description || entity.Description || '',
        status: (entity.status || entity.Status || 'todo').toLowerCase(),
        priority: (entity.priority || entity.Priority || 'medium').toLowerCase(),
        isCompleted: !!(entity.isCompleted || entity.IsCompleted),

        // Normalized Relations
        subtasks: subtasks,
        comments: entity.comments || entity.Comments || [], // Ensure comments are accessible
        assigneeIds: assigneeIds.map(Number).sort((a, b) => a - b),
        labelIds: labelIds.map(Number).sort((a, b) => a - b),
        assignees: (fullAssignees.length > 0 ? fullAssignees : assigneeIds.map(id => ({ id: Number(id) })))
            .sort((a, b) => Number(a.id) - Number(b.id)),
        labels: (fullLabels.length > 0 ? fullLabels : labelIds.map(id => ({ id: Number(id) })))
            .sort((a, b) => Number(a.id) - Number(b.id)),
        tagIds: labelIds.map(Number).sort((a, b) => a - b), // Alias for label IDs

        // Fix common casing issues
        projectId: entity.projectId || entity.ProjectId ? Number(entity.projectId || entity.ProjectId) : null,
        departmentId: entity.departmentId || entity.DepartmentId ? Number(entity.departmentId || entity.DepartmentId) : null,
        createdBy: entity.createdBy || entity.CreatedBy ? Number(entity.createdBy || entity.CreatedBy) : null,

        // Counts (Centralized)
        subtasksCount: entity.subtasksCount || entity.subtaskCount || (subtasks.length > 0 ? subtasks.length : 0),
        commentsCount: entity.commentsCount || entity.commentCount || 0,
        attachmentsCount: entity.attachmentsCount || entity.attachmentCount || 0,

        // Dates
        startDate: entity.startDate || entity.StartDate || null,
        dueDate: entity.dueDate || entity.DueDate || null,
        createdAt: entity.createdAt || entity.CreatedAt || new Date().toISOString(),
        updatedAt: entity.updatedAt || entity.UpdatedAt || new Date().toISOString()
    };

    // Remove undefined keys to keep it clean
    Object.keys(cleanEntity).forEach(key => cleanEntity[key] === undefined && delete cleanEntity[key]);

    // ABSOLUTELY FORBID _id
    // eslint-disable-next-line
    if ('_id' in cleanEntity) delete cleanEntity._id;

    return cleanEntity;
};

/**
 * Helper to safely extract an ID from an object or value.
 * Replaces getSafeId.
 * @param {any} input - ID or Object with ID
 * @returns {number} The integer ID or 0.
 */
export const getId = (input) => {
    if (!input) return 0;
    if (typeof input === 'number') return input;
    if (typeof input === 'string') return isNaN(input) ? 0 : Number(input);
    return normalizeEntity(input).id;
};

/**
 * Standardized way to check if a user is assigned to an entity.
 * Works with the normalized 'assigneeIds' array.
 * @param {Object} entity - Task or Subtask
 * @param {number} userId - User ID to check
 * @returns {boolean}
 */
export const isAssigned = (entity, userId) => {
    if (!entity || !userId) return false;
    const ids = entity.assigneeIds || [];
    return ids.includes(Number(userId));
};
