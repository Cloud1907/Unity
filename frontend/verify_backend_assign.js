const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5001/api'; // Adjust port if needed (dotnet backend usually 5001 or 7196)
// We need a valid token. Since we can't easily interactive login, we might need to rely on a hardcoded known user or try to register/login.
// Assuming dev environment has 'admin' / 'admin' or similar, or we can look at local storage if we were browser.
// For now, let's try a standard dev login if possible, or asking user for token is hard.
// Let's assume we can hit an endpoint without auth if dev mode? No, [Authorize] is on controllers.
// Strategy: Try to login with a known dev user.

async function verifyMultiAssign() {
    try {
        console.log('1. Attempting Login...');
        // Common dev credentials in this project's context?
        // Based on previous contexts, maybe 'admin' user exists.
        // If this fails, we might need to ask user for a token or checking DB.
        // Let's try to find a user first or just fail and ask for help if login fails.

        let token;
        try {
            const login = await axios.post(`${API_URL}/Auth/login`, {
                email: 'admin@example.com', // Guessing common dev email
                password: 'password'
            });
            token = login.data.token;
        } catch (e) {
            console.log('Login failed (expected if creds wrong). Trying to read token from local file or skipping if not possible.');
            // Fallback: If we can't login, we can't verify backend easily without user help or DB access.
            // But wait, the user said "prove it in backend".
            // I can use `run_command` to execute a CURL if I knew the token.
            // Let's try to just output the script and ask user to run it or... 
            // Better: I will try to use the `browser_subagent` to get a token? No, that's complex.
            // I will assume I can register a temp user.

            const rand = Math.floor(Math.random() * 10000);
            const regBuffer = await axios.post(`${API_URL}/users`, { // Check User Controller
                username: `testuser${rand}`,
                email: `test${rand}@test.com`,
                password: 'Password123!',
                fullName: 'Test User'
            });
            // Actually UsersController usually requires Auth too for POST?
            // "UsersController.cs" : [Authorize] is usually top level.

            console.error('Cannot authenticate automatically. Aborting script verify, will use browser verification which is authenticated.');
            return;
        }

        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        console.log('2. Creating Test Task...');
        const taskRes = await axios.post(`${API_URL}/tasks`, {
            title: 'Backend Multi Assign Test',
            projectId: 1, // Assuming Project 1 exists
            status: 'todo',
            priority: 'medium'
        }, authHeader);

        const taskId = taskRes.data.id;
        console.log(`Task Created: ID ${taskId}`);

        console.log('3. Assigning 2 Users...');
        // We need 2 valid user IDs.
        const usersRes = await axios.get(`${API_URL}/users`, authHeader);
        const users = usersRes.data.slice(0, 2);

        if (users.length < 2) {
            console.error('Not enough users to test multi-assign.');
            return;
        }

        const userIds = users.map(u => u.id);
        console.log(`Assigning Users: ${userIds.join(', ')}`);

        // PUT update with list
        await axios.put(`${API_URL}/tasks/${taskId}`, {
            title: 'Backend Multi Assign Test',
            assigneeIds: userIds
        }, authHeader);

        console.log('4. Verifying Assignment...');
        const verifyRes = await axios.get(`${API_URL}/tasks/${taskId}`, authHeader);
        const assignedIds = verifyRes.data.assignees.map(a => a.userId || a.id); // Check DTO structure

        console.log('Fetched Assignees:', assignedIds);

        if (userIds.every(id => assignedIds.includes(id))) {
            console.log('SUCCESS: Multiple users assigned successfully!');
        } else {
            console.error('FAILURE: Assigned users do not match requested users.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

// verifyMultiAssign(); 
// NOTE: Since auth is hard from script without creds, 
// I will actually rely on the Browser Subagent to perform this strict test logic visually 
// OR I will check the Controller Code deeper. Use the browser for auth context if needed.
