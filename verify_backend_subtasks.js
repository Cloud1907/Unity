const BASE_URL = 'http://127.0.0.1:8080/api';

async function runTest() {
    console.log('--- Subtask Backend Verification (Admin Login) ---');
    console.log(`Target: ${BASE_URL}`);

    try {
        // 1. Authenticate
        console.log('1. Authenticating as Melih...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'melih.bulut@univera.com.tr',
                password: 'test123'
            })
        });

        if (!loginRes.ok) {
            const txt = await loginRes.text();
            console.error(`   Login failed: ${loginRes.status} ${loginRes.statusText}`);
            console.error(`   Body: ${txt}`);
            return;
        }

        const authData = await loginRes.json();
        // Adjust for possible token field names
        const token = authData.access_token || authData.token || authData.accessToken;
        console.log(`   Login successful. Token length: ${token ? token.length : 'null'}`);

        if (!token) throw new Error('No token received');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Get/Create Project
        console.log('2. Getting Project...');
        let projectId;
        const projRes = await fetch(`${BASE_URL}/projects`, { headers });
        const projects = await projRes.json();
        if (projects.length > 0) {
            projectId = projects[0].id || projects[0]._id;
        } else {
            // Fallback create
            const newProjRes = await fetch(`${BASE_URL}/projects`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: 'Verify Project', color: '#000000' })
            });
            const newProj = await newProjRes.json();
            projectId = newProj.id || newProj._id;
        }
        console.log(`   Project ID: ${projectId}`);

        // 3. Create Task
        console.log('3. Creating Parent Task...');
        const taskRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Backend Fix Verification Task',
                status: 'todo',
                priority: 'high',
                projectId: projectId
            })
        });
        const task = await taskRes.json();
        const taskId = task.id || task._id;
        console.log(`   Task Created: ${taskId}`);

        // 4. Add Subtask
        console.log('4. Adding Subtask...');
        const subRes = await fetch(`${BASE_URL}/tasks/${taskId}/subtasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Persistent Subtask',
                isCompleted: false
            })
        });

        if (!subRes.ok) {
            console.error('   Add subtask failed:', await subRes.text());
            return;
        }

        const subtask = await subRes.json();
        const subtaskId = subtask.id || subtask._id;
        console.log(`   Subtask Created: ${subtaskId}`);

        // 5. Update Subtask (to test persistence of updates too)
        console.log('5. Updating Subtask Status...');
        const updateRes = await fetch(`${BASE_URL}/tasks/subtasks/${subtaskId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                title: 'Persistent Subtask Updated',
                isCompleted: true,
                assigneeId: authData.user.id // Assign to self
            })
        });

        if (!updateRes.ok) {
            console.error('   Update subtask failed:', await updateRes.text());
        } else {
            console.log('   Update OK.');
        }

        // 6. Verify Persistence (GET Task)
        console.log('6. Verifying Persistence via GET Task...');
        const checkRes = await fetch(`${BASE_URL}/tasks/${taskId}`, { headers });
        const checkedTask = await checkRes.json();

        const found = checkedTask.subtasks && checkedTask.subtasks.find(s => (s.id || s._id) === subtaskId);
        if (found) {
            console.log(`   Subtask ID ${subtaskId} found in parent.`);
            console.log(`   Status: ${found.isCompleted} (Expected: true)`);
            console.log(`   Assignee: ${found.assigneeId} (Expected: ${authData.user.id})`);

            if (found.isCompleted === true && found.assigneeId === authData.user.id) {
                console.log('SUCCESS: Subtask persisted correctly with updates.');
            } else {
                console.error('FAILURE: Subtask found but data mismatch.');
            }
        } else {
            console.error('FAILURE: Subtask NOT found in parent verification.');
            // console.log('Full Task:', JSON.stringify(checkedTask, null, 2));
        }

    } catch (err) {
        console.error('EXCEPTION:', err);
    }
}

runTest();
