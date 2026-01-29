const axios = require('axios');

// Config
const BASE_URL = 'http://localhost:3000/api'; // Use frontend proxy
// Need a real user token. I'll attempt to login first or use a known one if I had it.
// I'll try to login as 'admin' or create a user if needed. 
// For now, I'll try to use the hardcoded credentials if I can find them or just register a temp user.

const apiClient = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true // Don't throw on error
});

async function runTest() {
    console.log('--- Subtask Backend Verification ---');

    // 1. Login or Register
    console.log('1. Authenticating...');
    let token;
    const uniqueEmail = `test_${Date.now()}@example.com`;

    // Always register a new user for clean state
    const regRes = await apiClient.post('/auth/register', {
        fullName: 'Test User',
        email: uniqueEmail,
        password: 'Password123!'
    });

    if (regRes.status === 200) {
        token = regRes.data.access_token;
        console.log(`   Registration successful as ${uniqueEmail}.`);
    } else {
        console.error('   Auth failed:', regRes.data);
        return;
    }

    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Create Task
    console.log('2. Creating Parent Task...');
    const taskRes = await apiClient.post('/tasks', {
        title: 'Backend Test Task',
        status: 'todo',
        priority: 'medium',
        projectId: '66aaaaaaaaaaaaaaaaaaaaaa' // Needs a valid project ID, or we cheat/mock? 
        // Wait, MongoDB IDs are 24 hex. 
        // I need a valid project. Let's fetch projects first.
    });

    // Correction: Fetch projects first
    const projectsRes = await apiClient.get('/projects');
    let projectId;
    if (projectsRes.data && projectsRes.data.length > 0) {
        projectId = projectsRes.data[0].id || projectsRes.data[0]._id;
    } else {
        // Create project
        const pRes = await apiClient.post('/projects', { name: 'Test Project' });
        projectId = pRes.data.id || pRes.data._id;
    }

    const taskRes2 = await apiClient.post('/tasks', {
        title: 'Backend Test Task',
        priority: 'medium',
        status: 'todo',
        projectId: projectId
    });

    if (taskRes2.status !== 200 && taskRes2.status !== 201) {
        console.error('   Create Task failed:', taskRes2.data);
        return;
    }
    const task = taskRes2.data;
    const taskId = task.id || task._id;
    console.log(`   Task Created: ${taskId}`);

    // 3. Add Subtask
    console.log('3. Adding Subtask...');
    const subtaskRes = await apiClient.post(`/tasks/${taskId}/subtasks`, {
        title: 'Subtask 1',
        isCompleted: false
    });

    if (subtaskRes.status !== 200 && subtaskRes.status !== 201) {
        console.error('   Add Subtask failed:', subtaskRes.data);
        return;
    }
    const subtask = subtaskRes.data;
    const subtaskId = subtask.id || subtask._id;
    console.log(`   Subtask Created: ${subtaskId}`);

    // 4. Update Status
    console.log('4. Updating Subtask Status...');
    const updateStatusRes = await apiClient.put(`/tasks/subtasks/${subtaskId}`, {
        title: 'Subtask 1',
        isCompleted: true, // Toggle to true
        assigneeId: subtask.assigneeId
    });

    if (updateStatusRes.status !== 200) {
        console.error('   Update Status failed:', updateStatusRes.status, updateStatusRes.data);
    } else {
        console.log('   Update Status OK.');
    }

    // 5. Verify Persistence
    console.log('5. Verifying Persistence...');
    const verifyRes = await apiClient.get(`/tasks/${taskId}`);
    const fetchedTask = verifyRes.data;
    const fetchedSubtask = fetchedTask.subtasks.find(s => (s.id || s._id) === subtaskId);

    if (!fetchedSubtask) {
        console.error('   CRITICAL: Subtask disappeared from parent task!');
    } else {
        console.log(`   Subtask Found. Completed: ${fetchedSubtask.isCompleted}`);
        if (fetchedSubtask.isCompleted === true) {
            console.log('   SUCCESS: Status persisted correctly.');
        } else {
            console.error('   FAILURE: Status did not persist (isCompleted is false).');
        }
    }

    // 6. Assign User
    console.log('6. Assigning User to Subtask...');
    // Get self user id
    const userRes = await apiClient.get('/auth/me');
    const userId = userRes.data.id || userRes.data._id;

    const assignRes = await apiClient.put(`/tasks/subtasks/${subtaskId}`, {
        ...fetchedSubtask,
        isCompleted: true,
        assigneeId: userId
    });

    if (assignRes.status !== 200) {
        console.error('   Assign User failed:', assignRes.data);
    } else {
        console.log('   Assign User OK.');
    }

    // 7. Final Verify
    const finalRes = await apiClient.get(`/tasks/${taskId}`);
    const finalSub = finalRes.data.subtasks.find(s => (s.id || s._id) === subtaskId);

    if (finalSub.assigneeId === userId || finalSub.assignee === userId) {
        console.log(`   SUCCESS: User assigned correctly (${finalSub.assigneeId}).`);
    } else {
        console.error(`   FAILURE: User not assigned. Got: ${finalSub.assigneeId} vs Expected: ${userId}`);
    }
}

runTest();
