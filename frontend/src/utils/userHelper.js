/**
 * Filters the list of users based on project membership or department affiliation.
 * 
 * Logic:
 * 1. Users explicitly added as project members.
 * 2. Users belonging to the same department as the project.
 * 3. Admins (optional, usually allowed everywhere).
 * 
 * @param {Object} project - The project object containing members and departmentId.
 * @param {Array} allUsers - Full list of system users.
 * @returns {Array} Filtered list of users.
 */
export const filterProjectUsers = (project, allUsers) => {
    if (!project || !allUsers) return allUsers;

    const projectMemberIds = (project.members || []).map(m => String(m.userId || m.id || m));
    const projectDeptId = String(project.departmentId || project.DepartmentId || project.department || '');

    return allUsers.filter(u => {
        // 1. Explicit project membership
        const isProjectMember = projectMemberIds.includes(String(u.id));

        // 2. Department membership (Check IDs and Objects)
        const userDepts = u.departments || u.Departments || [];
        const isDeptMember = projectDeptId && userDepts.some(dept => {
            const deptId = String(dept.departmentId || dept.DepartmentId || dept.id || dept);
            return deptId === projectDeptId;
        });

        // 3. Admin bypass - REMOVED per user request for isolation
        // const isAdmin = String(u.role || u.Role || '').toLowerCase() === 'admin';

        return isProjectMember || isDeptMember;
    });
};
