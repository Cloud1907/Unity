const axios = require('axios');

const API_URL = 'http://localhost:8000/api'; // Revert to HTTP 8000

// Helper to decode JWT
function parseJwt (token) {
    try {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {
        return null;
    }
}

async function testFlow() {
    try {
        console.log('--- TEST START ---');
        
        // 1. LOGIN
        console.log('1. Logging in as melih.bulut...');
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'melih.bulut', 
                password: 'test123'
            });
            
            
            console.log('Login Response:', JSON.stringify(loginRes.data, null, 2));
            
            token = loginRes.data.accessToken || loginRes.data.token || loginRes.data.Token;
            
            if (!token) {
                 console.error('Token NOT FOUND in response!');
                 return;
            }

            console.log(`   Success! Token received: ${token.substring(0, 20)}...`);
            
            const decoded = parseJwt(token);
            console.log('   Token Claims:', JSON.stringify(decoded, null, 2));

        } catch (e) {
            console.error('Login Failed:', e.response?.data || e.message);
            return;
        }

        // 1.5 CHECK AUTH (GET)
        console.log('\n1.5 Checking Auth via GET /dashboard/stats...');
        try {
             await axios.get(`${API_URL}/tasks/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('   Success! Auth works for GET.');
        } catch (e) {
            console.error('   GET Auth Failed:', e.response?.status, e.response?.data);
             // If GET fails, POST will likely fail too
        }

        // 2. CREATE TASK
        console.log('\n2. Creating Task in Project 128...');
        let taskId;
        try {
            const taskPayload = {
                title: "TERMINAL UPDATE TEST",
                description: "Testing update flow from terminal",
                projectId: 128,
                status: "todo",
                priority: "medium"
            };

            const createRes = await axios.post(`${API_URL}/tasks`, taskPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            taskId = createRes.data.id;
            console.log(`   Success! Task Created. ID: ${taskId}`);
            console.log(`   Detailed Response: ProjectId=${createRes.data.projectId}, Status=${createRes.data.status}`);
        } catch (e) {
            console.error('Create Task Failed:', e.response?.data || e.message);
            return;
        }

        // 3. UPDATE TASK (PUT)
        console.log(`\n3. Updating Task ${taskId}...`);
        try {
            const updatePayload = {
                id: taskId,
                title: "TERMINAL UPDATE TEST - MODIFIED",
                description: "Updated description via terminal",
                projectId: 128, 
                status: "in_progress",
                priority: "high"
            };

            const updateRes = await axios.put(`${API_URL}/tasks/${taskId}`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('   Success! Task Updated.');
            console.log('   New Title:', updateRes.data.title);
            console.log('   New Status:', updateRes.data.status);
            
        } catch (e) {
            console.error('Update Task Failed (PUT):', e.response?.data || e.message);
            // Don't return, try Validation check
        }
        
    } catch (error) {
        console.error('\n!!! TEST SCRIPT ERROR !!!', error.message);
    }
}

testFlow();
