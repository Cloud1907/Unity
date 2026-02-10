const signalR = require("@microsoft/signalr");
const axios = require("axios");
const https = require("https");

// Configuration
const BASE_URL = "http://localhost:8080"; // Backend URL
const HUB_URL = `${BASE_URL}/appHub`;
const API_URL = `${BASE_URL}/api`;

// Use 2320 (from previous email test) or create a new one.
// Let's assume we use the first available task or create a dummy one if needed.
// For simulation, we'll try to listen first.

async function start() {
    console.log(`[TEST] Connecting to SignalR Hub at ${HUB_URL}...`);

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    // Event Listener
    connection.on("TaskUpdated", (task) => {
        console.log("\n[SUCCESS] Received 'TaskUpdated' event!");
        console.log(` - Task ID: ${task.id}`);
        console.log(` - Title: ${task.title}`);
        console.log(` - Status: ${task.status}`);
        console.log(` - Updated At: ${task.updatedAt}`);
        process.exit(0); // Exit on success
    });

    try {
        await connection.start();
        console.log("[TEST] SignalR Connected successfully.");
        console.log("[TEST] Waiting for event...");

        // Simulate an update via API acting as "Egemen"
        // We need a valid token for Egemen (ID 27). 
        // We can reuse the login logic from verify_email.sh or just hardcode if we have one,
        // but verify_email.sh gets a fresh token.
        // Let's trigger a status update on a known task (e.g., Task 2327 just created).

        // For simplicity in this script, we'll ask the user to run an update or
        // we can try to automate the update if we implement login.
        // Let's implement the login part to make it a full test.

        await triggerUpdate();

    } catch (err) {
        console.error("[ERROR] Connection failed: ", err);
        process.exit(1);
    }
}

async function triggerUpdate() {
    try {
        console.log("\n[TEST] Logging in as Egemen to trigger update...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: "egemen.baskan",
            password: "1234567"
        });
        const token = loginRes.data.accessToken || loginRes.data.token;
        console.log("[TEST] Login successful.");

        // target task 2327 
        const taskId = 2327;
        // Toggle status
        const newStatus = "Done";

        console.log(`[TEST] Updating Task ${taskId} status to '${newStatus}' via API...`);

        await axios.put(`${API_URL}/tasks/${taskId}/status?status=${newStatus}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("[TEST] Update request sent. Waiting for SignalR event...");

        // Set a timeout to fail if no event received
        setTimeout(() => {
            console.error("\n[FAILURE] Timeout: No SignalR event received within 10 seconds.");
            process.exit(1);
        }, 10000);

    } catch (err) {
        console.error("[ERROR] API Request failed:", err.response ? err.response.data : err.message);
        // If 404, maybe task 2327 doesn't exist? Try to find one.
    }
}

start();
