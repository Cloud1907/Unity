const signalR = require("@microsoft/signalr");
const axios = require("axios");

// Config
const API_URL = "http://localhost:8080/api";
const HUB_URL = "http://localhost:8080/appHub";
const USER_EMAIL = "melih.bulut@univera.com.tr";
const USER_PASSWORD = "test123";

// Determine if we should ignore SSL (for localhost dev sometimes needed)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function runTest() {
    console.log("🚀 Starting SignalR Integration Test...");

    // 1. Authenticate
    let token;
    try {
        console.log(`🔐 Logging in as ${USER_EMAIL}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASSWORD
        });
        token = loginRes.data.accessToken;
        console.log("✅ Login successful! Token acquired.");
    } catch (error) {
        console.error("❌ Login failed:", error.message);
        process.exit(1);
    }

    // 2. Connect to SignalR Hub
    console.log(`📡 Connecting to SignalR Hub at ${HUB_URL}...`);
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
            accessTokenFactory: () => token,
            transport: signalR.HttpTransportType.WebSockets // Force websockets
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

    // Setup Listener
    let receivedUpdate = false;
    connection.on("TaskUpdated", (task) => {
        console.log("✨ EVENT RECEIVED: TaskUpdated");
        console.log(`   Task ID: ${task.id}, Status: ${task.status}, Title: ${task.title}`);
        receivedUpdate = true;

        console.log("🎉 TEST SUCCESS! SignalR is broadcasting updates.");
        connection.stop().then(() => process.exit(0));
    });

    try {
        await connection.start();
        console.log("✅ SignalR Connected!");
    } catch (error) {
        console.error("❌ SignalR Connection failed:", error.message);
        process.exit(1);
    }

    // 3. Trigger Update via API
    // We need a valid task ID. Let's fetch the first task available.
    try {
        console.log("🔍 Fetching a task to update...");
        const tasksRes = await axios.get(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (tasksRes.data.length === 0) {
            console.error("⚠️ No tasks found in the system to test update.");
            process.exit(1);
        }

        const taskToUpdate = tasksRes.data[0];
        const taskId = taskToUpdate.id || taskToUpdate._id;
        // Project ID Normalization
        const projectId = taskToUpdate.projectId || taskToUpdate.ProjectId;

        console.log(`🎯 Target Task ID: ${taskId}, Project ID: ${projectId}, Status: ${taskToUpdate.status}`);

        // JOIN GROUP
        console.log(`📡 Joining Project Group: Project_${projectId}...`);
        await connection.invoke("JoinProject", String(projectId));
        console.log("✅ Joined Project Group!");

        // Toggle status
        const newStatus = taskToUpdate.status === "done" ? "todo" : "done";
        console.log(`📝 Updating Task ${taskId} status to '${newStatus}' via API...`);

        await axios.put(`${API_URL}/tasks/${taskId}/status?status=${newStatus}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✅ Update request sent. Waiting for SignalR event...");
    } catch (error) {
        console.error("❌ API Update/Join Group failed:", error.message);
        process.exit(1);
    }

    // Timeout safety
    setTimeout(() => {
        if (!receivedUpdate) {
            console.error("❌ TEST TIMEOUT: SignalR event was NOT received within 10 seconds.");
            process.exit(1);
        }
    }, 10000);
}

runTest();
