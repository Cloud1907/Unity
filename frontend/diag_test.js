const axios = require('axios');
const API = 'http://localhost:8000/api';

async function test() {
    console.log('=== FULL DIAGNOSTIC TEST ===\n');
    
    // 1. LOGIN
    console.log('1. LOGIN...');
    let token;
    try {
        const r = await axios.post(API + '/auth/login', { email: 'melih.bulut', password: 'test123' });
        token = r.data.accessToken;
        console.log('   OK. User:', r.data.user.fullName);
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status : e.message); return; }

    const h = { headers: { Authorization: 'Bearer ' + token } };

    // 2. GET TASKS for project 128
    console.log('\n2. GET TASKS (project 128)...');
    try {
        const r = await axios.get(API + '/tasks?projectId=128&pageSize=5', h);
        const tasks = Array.isArray(r.data) ? r.data : (r.data.tasks || []);
        console.log('   OK. Got', tasks.length, 'tasks.');
        if (tasks.length > 0) {
            var t = tasks[0];
            console.log('   First: id=' + t.id + ' title="' + t.title + '" projectId=' + t.projectId + ' status=' + t.status);
        }
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status : e.message); }

    // 3. CREATE TASK
    console.log('\n3. CREATE TASK...');
    var taskId;
    try {
        var r = await axios.post(API + '/tasks', {
            title: 'DIAG_TEST_' + Date.now(),
            projectId: 128,
            status: 'todo',
            priority: 'medium'
        }, h);
        taskId = r.data.id;
        console.log('   OK. id=' + taskId + ' projectId=' + r.data.projectId + ' status=' + r.data.status);
        console.log('   Keys:', Object.keys(r.data).join(', '));
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message); return; }

    // 4. UPDATE (PUT) title
    console.log('\n4. PUT title change id=' + taskId + '...');
    try {
        var r = await axios.put(API + '/tasks/' + taskId, { title: 'DIAG_UPDATED' }, h);
        console.log('   OK. title:', r.data.title, 'status:', r.data.status);
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message); }

    // 5. PUT status change (done)
    console.log('\n5. PUT status change (done) id=' + taskId + '...');
    try {
        var r = await axios.put(API + '/tasks/' + taskId, { status: 'done' }, h);
        console.log('   OK. status:', r.data.status, 'completedAt:', r.data.completedAt);
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message); }

    // 6. PATCH field:title
    console.log('\n6. PATCH field=title id=' + taskId + '...');
    try {
        var r = await axios.patch(API + '/tasks/' + taskId, { field: 'title', value: 'DIAG_PATCHED' }, h);
        console.log('   OK. Response type:', typeof r.data);
        if (typeof r.data === 'object') console.log('   Data:', JSON.stringify(r.data).substring(0, 300));
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message); }

    // 7. PATCH field:status
    console.log('\n7. PATCH field=status id=' + taskId + '...');
    try {
        var r = await axios.patch(API + '/tasks/' + taskId, { field: 'status', value: 'done' }, h);
        console.log('   OK. Response type:', typeof r.data);
        if (typeof r.data === 'object') console.log('   Data:', JSON.stringify(r.data).substring(0, 300));
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message); }

    // 8. GET final state
    console.log('\n8. GET final state id=' + taskId + '...');
    try {
        var r = await axios.get(API + '/tasks/' + taskId, h);
        console.log('   OK. title=' + r.data.title + ' status=' + r.data.status + ' projectId=' + r.data.projectId);
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status : e.message); }

    // 9. Cleanup
    console.log('\n9. DELETE id=' + taskId + '...');
    try {
        await axios.delete(API + '/tasks/' + taskId, h);
        console.log('   OK.');
    } catch(e) { console.error('   FAIL:', e.response ? e.response.status : e.message); }

    console.log('\n=== DONE ===');
}

test();
