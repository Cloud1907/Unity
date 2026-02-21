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

/**
 * Normalizes user data from API responses to handle case-insensitive property names.
 * The backend sometimes returns PascalCase (C# convention) and sometimes camelCase.
 * This utility ensures consistent camelCase properties in the frontend.
 * 
 * @param {Object} userData - Raw user data from API
 * @returns {Object} Normalized user object with camelCase properties
 */
export const normalizeUser = (userData) => {
  if (!userData) return null;
  
  return {
    ...userData,
    id: userData.id || userData.Id,
    fullName: userData.fullName || userData.FullName,
    email: userData.email || userData.Email,
    avatar: userData.avatar || userData.Avatar,
    color: userData.color || userData.Color,
    role: userData.role || userData.Role,
    jobTitle: userData.jobTitle || userData.JobTitle,
    username: userData.username || userData.Username,
    departments: userData.departments || userData.Departments,
    gender: userData.gender || userData.Gender,
    createdAt: userData.createdAt || userData.CreatedAt,
    updatedAt: userData.updatedAt || userData.UpdatedAt
  };
};
