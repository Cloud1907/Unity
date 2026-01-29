
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

        // 2. Create Parent Task
        console.log('2. Creating Parent Task...');
        const taskRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ title: 'Status Update Repro Task ' + Date.now(), projectId: 1, status: 'To Do' })
        });
        const task = await taskRes.json();
        console.log(`   Task Created: ${task.id}`);

        // 3. Add Subtasks
        console.log('3. Adding Subtasks...');
        const sub1 = await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
            method: 'POST', headers, body: JSON.stringify({ title: 'Subtask 1' })
        }).then(r => r.json());

        const sub2 = await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
            method: 'POST', headers, body: JSON.stringify({ title: 'Subtask 2' })
        }).then(r => r.json());
        console.log(`   Subtasks Added: ${sub1.id}, ${sub2.id}`);

        // 4. Update Status (The Trap)
        console.log('4. Updating Task Status...');
        const updateRes = await fetch(`${BASE_URL}/tasks/${task.id}/status?status=Working`, {
            method: 'PUT',
            headers: headers
        });

        if (updateRes.status !== 200) {
            console.error('   Update Status Failed:', updateRes.status);
            process.exit(1);
        }

        // This response mimics what SignalR would broadcast (the fresh task)
        const updatedTask = await updateRes.json();
        console.log('   Status Update Request Success.');

        // 5. Verify Persistence in Response
        console.log('5. Verifying Subtasks in Updated Response...');

        if (!updatedTask.subtasks || updatedTask.subtasks.length === 0) {
            console.error('FAIL: Subtasks count is 0 in update response! (UI would wipe subtasks)');
            process.exit(1);
        }

        if (updatedTask.subtasks.length !== 2) {
            console.error(`FAIL: Expected 2 subtasks, found ${updatedTask.subtasks.length}`);
            process.exit(1);
        }

        console.log('PASS: Subtasks persisted in status update response.');

    } catch (e) {
        console.error('EXCEPTION:', e);
        process.exit(1);
    }
}

run();
