
const BASE_URL = 'http://localhost:8080/api';
const EMAIL = 'melih.bulut@univera.com.tr';
const PASSWORD = 'test123';

async function run() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token || loginData.accessToken;
        const userId = loginData.user.id;

        if (!token) process.exit(1);
        console.log(`   Logged in as ${userId}`);

        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 2. Create Task
        console.log('2. Creating Task...');
        const tRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST', headers,
            body: JSON.stringify({ title: 'Subtask Assign Test', projectId: 1, status: 'To Do' })
        });
        const task = await tRes.json();
        console.log(`   Task Created: ${task.id}`);

        // 3. Create Subtask
        console.log('3. Creating Subtask...');
        const stRes = await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
            method: 'POST', headers,
            body: JSON.stringify({ title: 'Subtask To Assign' })
        });
        const subtaskData = await stRes.json(); // Might return Task or Subtask depending on implementation

        // Refetch task to get subtask ID if needed, but usually create returns updated task or subtask list
        // Let's assume we need to find the subtask id.
        const freshTaskRes = await fetch(`${BASE_URL}/tasks/${task.id}`, { headers });
        const freshTask = await freshTaskRes.json();
        const subtask = freshTask.subtasks.find(s => s.title === 'Subtask To Assign');

        if (!subtask) { console.error('Subtask creation failed'); process.exit(1); }
        console.log(`   Subtask Created: ${subtask.id} (AssigneeId: ${subtask.assigneeId})`);

        // 4. Assign User to Subtask
        console.log(`4. Assigning User ${userId} to Subtask ${subtask.id}...`);
        const assignPayload = {
            title: subtask.title,
            isCompleted: subtask.isCompleted,
            assigneeId: userId,
            startDate: subtask.startDate,
            dueDate: subtask.dueDate
        };

        const updateRes = await fetch(`${BASE_URL}/tasks/subtasks/${subtask.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(assignPayload)
        });

        if (updateRes.status !== 200) {
            console.error('   Update Failed:', updateRes.status, await updateRes.text());
            process.exit(1);
        }

        // 5. Verify Persistence
        console.log('5. Verifying Persistence...');
        const verifyRes = await fetch(`${BASE_URL}/tasks/${task.id}`, { headers });
        const finalTask = await verifyRes.json();
        const finalSubtask = finalTask.subtasks.find(s => s.id === subtask.id);

        console.log(`   Final State -> AssigneeId: ${finalSubtask.assigneeId}`);

        if (finalSubtask.assigneeId !== userId) {
            console.error('FAIL: AssigneeId mismatch!');
            process.exit(1);
        }

        console.log('PASS: Subtask assignment persisted.');

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
