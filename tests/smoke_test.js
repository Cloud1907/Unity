
const axios = require('axios');

// Config
const BASE_URL = 'http://localhost:8080/api';
const AUTH = { email: 'melih.bulut@univera.com.tr', password: 'test123' };

async function runSmokeTest() {
    console.log('🔥 Starting Smoke Test...');

    try {
        // 1. Login
        console.log('1. Attempting Login...');
        const authRes = await axios.post(`${BASE_URL}/auth/login`, AUTH);
        const token = authRes.data.access_token;
        console.log('✅ Login Successful. Token obtained.');

        // 2. Fetch Projects
        console.log('\n2. Fetching Projects (Raw)...');
        const projRes = await axios.get(`${BASE_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const projects = projRes.data;
        console.log(`✅ Status: ${projRes.status}`);
        console.log(`📊 Total Projects Found: ${projects.length}`);

        if (projects.length > 0) {
            const p = projects[0];
            console.log('\n🔍 INSPECTING FIRST PROJECT KEYS:');
            console.log(Object.keys(p));

            console.log('\n🔍 INSPECTING ID FIELD:');
            console.log('p.id:', p.id, '(Type:', typeof p.id, ')');
            console.log('p.Id:', p.Id, '(Type:', typeof p.Id, ')');
            console.log('p.ID:', p.ID, '(Type:', typeof p.ID, ')');

            // Check normalization logic simulation
            const rawId = p.id || p.Id;
            if (rawId === undefined || rawId === null) {
                console.error('❌ CRITICAL: Frontend normalization WOULD FAIL for this item (No id/Id found).');
            } else {
                console.log('✅ Normalization Check: ID detected as', rawId);
            }
        } else {
            console.warn('⚠️ No projects found to inspect. Is the database empty?');
        }

    } catch (error) {
        console.error('❌ SMOKE TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runSmokeTest();
