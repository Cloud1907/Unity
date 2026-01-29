
const BASE_URL = 'http://localhost:8080/api';
const EMAIL = 'melih.bulut@univera.com.tr';
const PASSWORD = 'test123';

async function run() {
    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token || loginData.accessToken;
        const userId = loginData.user.id;

        if (!token) {
            console.error('Login Failed:', loginData);
            process.exit(1);
        }
        console.log(`   Login Success. User ID: ${userId}`);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Create Parent Task
        console.log('2. Creating Parent Task...');
        const taskRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ title: 'Assign Repro Task ' + Date.now(), projectId: 1, status: 'To Do' })
        });
        const task = await taskRes.json();
        console.log(`   Task Created: ${task.id}`);

        // 3. Add Subtasks
        console.log('3. Adding Subtasks...');
        await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
            method: 'POST', headers, body: JSON.stringify({ title: 'Subtask 1' })
        });
        await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
            method: 'POST', headers, body: JSON.stringify({ title: 'Subtask 2' })
        });
        console.log('   Subtasks Added.');

        // 4. Update Assignee (The Test)
        // Frontend sends: { assignees: [id1, id2] } via PATCH
        console.log('4. Updating Assignee (PATCH)...');
        const updateRes = await fetch(`${BASE_URL}/tasks/${task.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ assignees: [userId] })
        });

        if (updateRes.status !== 200) {
            console.error('   Update Failed:', updateRes.status);
            process.exit(1);
        }

        const updatedTask = await updateRes.json();
        console.log('   Assignment Update Success.');

        // 5. Verify Persistence in Response
        console.log('5. Verifying Subtasks in Updated Response...');

        if (!updatedTask.subtasks || updatedTask.subtasks.length === 0) {
            console.error('FAIL: Subtasks count is 0 after assignment! (UI would wipe subtasks)');
            process.exit(1);
        }

        if (updatedTask.subtasks.length !== 2) {
            console.error(`FAIL: Expected 2 subtasks, found ${updatedTask.subtasks.length}`);
            process.exit(1);
        }

        console.log('PASS: Subtasks persisted in assignment update response.');

    } catch (e) {
        console.error('EXCEPTION:', e);
        process.exit(1);
    }
}

run();
