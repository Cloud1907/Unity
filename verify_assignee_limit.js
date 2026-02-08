const axios = require('axios');

const API_URL = 'http://localhost:8080/api';

async function run() {
    try {
        console.log('0. Checking Connectivity...');
        try {
            await axios.get(`${API_URL}/tasks`);
        } catch (e) {
            if (e.response && e.response.status === 401) {
                console.log('Connectivity OK (401 received).');
            } else {
                console.log('Connectivity Check Failed:', e.message);
                if (e.response) console.log('Status:', e.response.status);
                // process.exit(1); // Don't exit, try anyway
            }
        }

        console.log('1. Registering/Logging in temp user...');
        let token;
        try {
            const login = await axios.post(`${API_URL}/Auth/login`, { // Try capital A
                email: 'test_assign@example.com',
                password: 'password123'
            });
            token = login.data.accessToken; // Check capitalization of response prop
            if (!token) token = login.data.access_token;
        } catch (e) {
            console.log('Login failed (' + e.response?.status + '), trying register...');
            try {
                const reg = await axios.post(`${API_URL}/Auth/register`, { // Try capital A
                    fullName: 'Test Assignee',
                    username: 'testassignee', // Add username
                    email: 'test_assign@example.com',
                    password: 'password123',
                    role: 'admin'
                });
                token = reg.data.accessToken || reg.data.access_token;
            } catch (regErr) {
                console.error('Register failed:', regErr.response?.data || regErr.message);
                if (regErr.response?.status === 405) console.log('405 implies URL is wrong.');
                // Try lowercase
                const reg2 = await axios.post(`${API_URL}/auth/register`, {
                    fullName: 'Test Assignee',
                    username: 'testassignee',
                    email: 'test_assign@example.com',
                    password: 'password123'
                });
                token = reg2.data.accessToken || reg2.data.access_token;
            }
        }

        if (!token) {
            console.error('Could not get token.');
            return;
        }
        console.log('Token acquired.');

        const headers = { Authorization: `Bearer ${token}` };

        console.log('2. Fetching Users...');
        const usersRes = await axios.get(`${API_URL}/Users`, { headers }); // Try Capital U
        const users = usersRes.data || [];
        console.log(`Found ${users.length} users.`);

        if (users.length < 3) {
            console.log('Creating dummy users...');
            for (let i = users.length; i < 3; i++) {
                await axios.post(`${API_URL}/Auth/register`, { // Register creates user
                    fullName: `User ${i}`,
                    username: `user_${i}_${Date.now()}`,
                    email: `user${i}_${Date.now()}@test.com`,
                    password: 'password123'
                });
            }
        }

        const allUsers = (await axios.get(`${API_URL}/Users`, { headers })).data;
        const userIds = allUsers.slice(0, 3).map(u => u.id);
        console.log('User IDs to assign:', userIds);

        console.log('3. Creating Test Task...');
        const taskRes = await axios.post(`${API_URL}/Tasks`, { // Capital T
            title: 'Assignee Limit Test Task',
            projectId: 1,
            description: 'Testing 3 assignees',
            status: 'todo'
        }, { headers });
        const taskId = taskRes.data.id;
        console.log('Created Task ID:', taskId);

        console.log('4. Assigning 3 Users via PATCH...');
        // PATCH with { assignees: [id1, id2, id3] }
        await axios.patch(`${API_URL}/Tasks/${taskId}`, {
            assignees: userIds
        }, { headers });

        console.log('5. Verifying Assignees...');
        const verifyRes = await axios.get(`${API_URL}/Tasks/${taskId}`, { headers });
        // The endpoint returns TaskItem which has Assignees property
        const assigned = verifyRes.data.assignees || [];

        console.log('Assigned count:', assigned.length);
        console.log('Assigned IDs:', assigned.map(a => a.userId));

        if (assigned.length >= 3) { // It might be equal
            console.log('SUCCESS: 3 users assigned.');
        } else {
            console.log('FAILURE: Only ' + assigned.length + ' users assigned.');
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        console.error('Full stack:', error.stack);
    }
}

run();
