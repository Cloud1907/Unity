
// const fetch = require('node-fetch'); // Native fetch in Node 18+

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

        if (!token) {
            console.error('Login Failed:', loginData);
            process.exit(1);
        }
        console.log('   Login Success.');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Create Task
        console.log('2. Creating Parent Task...');
        const taskRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ title: 'Repro Parent Task ' + Date.now(), projectId: 1, status: 'To Do' })
        });
        const task = await taskRes.json();
        console.log(`   Task Created: ${task.id}`);

        // 3. Create Subtask
        console.log('3. Creating Subtask...');
        const subRes = await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ title: 'Subtask 1', isCompleted: false })
        });
        const subtask = await subRes.json();
        console.log(`   Subtask Created: ${subtask.id}`);

        // 4. Update Subtask
        console.log('4. Updating Subtask (Status Change)...');
        const updateRes = await fetch(`${BASE_URL}/tasks/subtasks/${subtask.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ title: 'Subtask 1 Updated', isCompleted: true })
        });

        if (updateRes.status !== 200) {
            console.error('   Update Failed Status:', updateRes.status);
            process.exit(1);
        }
        console.log('   Subtask Update Request Success.');

        // 5. Verify Persistence (The Trap)
        console.log('5. Fetching Parent Task to Verify Persistence...');
        const checkRes = await fetch(`${BASE_URL}/tasks/${task.id}`, { headers });
        const checkTask = await checkRes.json();

        const foundSubtask = checkTask.subtasks && checkTask.subtasks.find(s => s.id === subtask.id);

        if (!foundSubtask) {
            console.error('FAIL: Subtask is MISSING in parent task after update.');
            console.log('Parent Task Subtasks:', checkTask.subtasks);
            process.exit(1);
        }

        if (foundSubtask.title !== 'Subtask 1 Updated' || foundSubtask.isCompleted !== true) {
            console.error('FAIL: Subtask data is INCORRECT.');
            console.log('Expected: completed=true, title="Subtask 1 Updated"');
            console.log('Actual:', foundSubtask);
            process.exit(1);
        }

        console.log('PASS: Subtask persists and is updated correctly.');

    } catch (e) {
        console.error('EXCEPTION:', e);
        process.exit(1);
    }
}

run();
