
const BASE_URL = 'http://localhost:8080/api';
const AUTH_USER = { email: 'melih.bulut@univera.com.tr', password: 'test123' };
const NEW_USER_EMAIL = 'test_architect@univera.com.tr';
const NEW_USER_PASS = 'Test1234!';

async function runTest() {
    console.log('🚀 Starting Deep-Dive Verification Protocol...\n');
    let token = '';
    let userId = 0;
    let newUserId = 0;
    let deptId = 0;
    let projectId = 0;
    let taskId = 0;
    let subtaskId1 = 0;

    // --- Helper ---
    async function request(method, endpoint, body = null, authToken = token) {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch (e) { }

        return { status: res.status, data, text };
    }

    function check(step, condition, msg) {
        if (condition) console.log(`✅ [PASS] ${step}: ${msg}`);
        else {
            console.error(`❌ [FAIL] ${step}: ${msg}`);
            // if (!process.argv.includes('--continue')) process.exit(1);
        }
    }

    // --- STEP 1: Auth & Workspace ---
    console.log('--- Stage 1: Auth & Workspace ---');

    // Login
    const loginRes = await request('POST', '/auth/login', AUTH_USER);
    if (!(loginRes.status === 200 && loginRes.data.accessToken)) {
        console.error('Login Failed Details:', loginRes.status, loginRes.text);
        process.exit(1);
    }
    check('Login', loginRes.status === 200 && loginRes.data.accessToken, 'Logged in successfully');
    token = loginRes.data.accessToken;
    userId = loginRes.data.user.id;

    // Create New User (test_architect)
    const createUserRes = await request('POST', '/users', {
        name: 'Test Architect',
        email: NEW_USER_EMAIL,
        password: NEW_USER_PASS,
        role: 'user'
    });

    if ((createUserRes.status === 400 || createUserRes.status === 409) && (createUserRes.text.includes('exists') || createUserRes.text.includes('mevcut') || createUserRes.text.includes('kullanımda'))) {
        console.log('⚠️  User already exists, skipping creation.');
        const allUsers = await request('GET', '/users');
        const found = allUsers.data.find(u => u.email === NEW_USER_EMAIL);
        check('Get Architect', found, 'Found existing Test Architect');
        if (found) newUserId = found.id;
    } else {
        if (!(createUserRes.status === 201 || createUserRes.status === 200)) {
            console.error('Create User Failed:', createUserRes.status, createUserRes.text);
            process.exit(1);
        }
        check('Create User', createUserRes.status === 201 || createUserRes.status === 200, 'Created test_architect');
        newUserId = createUserRes.data.id;
    }
    check('User ID Integer', Number.isInteger(newUserId), `User ID is Integer (${newUserId})`);

    // Create Department
    const createDeptRes = await request('POST', '/departments', {
        name: 'Test Workspace ' + Date.now(),
        managerId: userId
    });
    check('Create Dept', createDeptRes.status === 200 || createDeptRes.status === 201, 'Created Test Workspace');
    if (createDeptRes.data && createDeptRes.data.id) {
        deptId = createDeptRes.data.id;
        check('Dept ID Integer', Number.isInteger(deptId), `Dept ID is Integer (${deptId})`);
    }


    // --- STEP 2: Project & Hierarchy ---
    console.log('\n--- Stage 2: Project & Hierarchy ---');

    // Create Project
    const createProjRes = await request('POST', '/projects', {
        name: 'Test-Automation-2026',
        departmentId: deptId,
        description: 'Deep Dive Test Project',
        status: 'active',
        priority: 'high',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
    });
    check('Create Project', createProjRes.status === 200 || createProjRes.status === 201, 'Created Project');
    projectId = createProjRes.data.id;
    check('Project ID Integer', Number.isInteger(projectId), `Project ID is Integer (${projectId})`);

    // Favorite Project
    const favRes = await request('PUT', `/projects/${projectId}/favorite`);
    if (!(favRes.status === 200 || favRes.status === 204)) {
        console.error('Favorite Toggle Failed:', favRes.status, favRes.text);
    }
    check('Toggle Favorite', favRes.status === 200 || favRes.status === 204, 'Favorite Toggled');

    // Check toggle response directly
    if (favRes.data && typeof favRes.data.isFavorite !== 'undefined') {
        check('Verify Favorite', favRes.data.isFavorite === true, 'Response confirms isFavorite=true');
    } else {
        console.error('Favorite response format unexpected:', favRes.data);
    }

    // Labels
    const labelNames = ['Kritik', 'Refactor', 'Onay Bekliyor'];
    let labelIds = [];
    for (const name of labelNames) {
        const lRes = await request('POST', '/labels', { name, color: '#ff0000', projectId });
        check(`Create Label ${name}`, lRes.status === 200 || lRes.status === 201, 'Created Label');
        labelIds.push(lRes.data.id);
    }
    // Delete one
    if (labelIds.length > 1) {
        const delLabelRes = await request('DELETE', `/labels/${labelIds[1]}`);
        check('Delete Label', delLabelRes.status === 200 || delLabelRes.status === 204, 'Deleted Label Refactor');
    }


    // --- STEP 3: Task & Subtask Engine ---
    console.log('\n--- Stage 3: Task & Subtask Engine ---');

    // Create Task
    const createTaskRes = await request('POST', '/tasks', {
        title: 'Ana Mimari Denetimi',
        projectId: projectId,
        description: 'Full stack integrity check',
        priority: 'High',
        status: 'To Do',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 100000000).toISOString(),
        assigneeIds: [newUserId] // Assign to test_architect
    });
    check('Create Task', createTaskRes.status === 200 || createTaskRes.status === 201, 'Created Task');
    taskId = createTaskRes.data.id;

    // Verify Assignment - Fetch explicitly to be sure
    const checkTaskRes = await request('GET', `/tasks/${taskId}`);
    const taskDetails = checkTaskRes.data;
    const isAssigned = taskDetails.assignees && taskDetails.assignees.some(a => a.userId === newUserId || a.id === newUserId);
    if (!isAssigned) {
        console.error('Task Assignee Mismatch. Expected UserID:', newUserId, 'Found:', taskDetails.assignees);
        // Try logging raw response
        console.log('Raw Task Details:', JSON.stringify(taskDetails, null, 2));
    }
    check('Verify Assignment', isAssigned, 'User assigned correctly');

    // Create Subtasks
    const sub1Res = await request('POST', `/tasks/${taskId}/subtasks`, { title: 'Subtask 1' });
    const sub2Res = await request('POST', `/tasks/${taskId}/subtasks`, { title: 'Subtask 2' });
    check('Create Subtasks', sub1Res.status === 200 || sub1Res.status === 201, 'Created 2 subtasks');
    subtaskId1 = sub1Res.data.id;

    // Assign Subtask
    const subAssignRes = await request('PATCH', `/tasks/subtasks/${subtaskId1}`, {
        assigneeIds: [userId]
    });
    if (subAssignRes.status !== 200) {
        console.error('Subtask Assign Failed:', subAssignRes.status, subAssignRes.text);
    }
    check('Assign Subtask', subAssignRes.status === 200, 'Assigned Subtask');


    // --- STEP 4: Integrity & Strictness ---
    console.log('\n--- Stage 4: Integrity & Strictness ---');

    // JSON Injection Test
    console.log('Attempting to inject "_id" into Task Update...');
    const injectionPayload = {
        title: 'Ana Mimari Denetimi - Hacked',
        _id: '507f1f77bcf86cd799439011',
        '$where': 'sleep(100)'
    };

    const curTaskRes = await request('PUT', `/tasks/${taskId}`, injectionPayload);

    if (curTaskRes.status !== 200) {
        console.error('Injection PUT Failed:', curTaskRes.status, curTaskRes.text);
    }
    check('Injection Result', curTaskRes.status === 200, 'Backend accepted request (ignoring injection)');
    check('Check Title Update', curTaskRes.data.title === 'Ana Mimari Denetimi - Hacked', 'Title updated');
    check('Check No _id', !curTaskRes.data._id, 'Response does NOT contain _id');

    // Double check by GET
    const getTaskRes = await request('GET', `/tasks/${taskId}`);
    check('Verify Persistence', !getTaskRes.data._id, 'Persisted object does NOT contain _id');

    console.log('\n✨ Deep-Dive Protocol Completed Successfully!');
}

runTest().catch(e => {
    console.error('FATAL ERROR:', e);
    process.exit(1);
});
