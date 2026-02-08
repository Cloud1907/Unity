using System.Text;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

// Attach this script to a GameObject in your scene to test the integration.
public class TaskSyncTester : MonoBehaviour
{
    [Header("API Config")]
    public string apiUrl = "http://localhost:8080/api";
    public string email = "melih.bulut@univera.com.tr";
    public string password = "test123";

    [Header("Test Scenario")]
    public int targetTaskId;

    private string _token;

    private void Start()
    {
        // Listen for updates to verify reception
        if (TaskSyncManager.Instance != null)
        {
            TaskSyncManager.Instance.OnTaskUpdated += HandleTaskUpdated;
        }
    }

    private void OnDestroy()
    {
        if (TaskSyncManager.Instance != null)
        {
            TaskSyncManager.Instance.OnTaskUpdated -= HandleTaskUpdated;
        }
    }

    private void HandleTaskUpdated(TaskItem task)
    {
        Debug.Log($"<color=green>TEST SUCCESS:</color> Received update for Task {task.Id}. New Status: {task.Status}");
    }

    // UI Buttons can call these methods
    public void StartLoginAndConnect()
    {
        StartCoroutine(LoginRoutine());
    }

    public void MarkTaskAsDone()
    {
        if (string.IsNullOrEmpty(_token))
        {
            Debug.LogError("Not logged in! Call StartLoginAndConnect first.");
            return;
        }
        StartCoroutine(UpdateTaskStatusRoutine(targetTaskId, "done"));
    }

    private IEnumerator LoginRoutine()
    {
        Debug.Log("Logging in...");
        var user = new LoginDto { email = email, password = password };
        string json = JsonUtility.ToJson(user);

        using (var req = new UnityWebRequest($"{apiUrl}/auth/login", "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");

            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"Login failed: {req.error} : {req.downloadHandler.text}");
            }
            else
            {
                Debug.Log("Login successful!");
                var res = JsonUtility.FromJson<AuthResponse>(req.downloadHandler.text);
                _token = res.token;
                
                // Pass token to Manager and Connect
                TaskSyncManager.Instance.authToken = _token;
                // Since InitializeSignalR is async, we fire and forget or wrap it.
                // For Unity, we just call it (it returns Task, but void context is ok for Start)
                _ = TaskSyncManager.Instance.InitializeSignalR();
            }
        }
    }

    private IEnumerator UpdateTaskStatusRoutine(int taskId, string status)
    {
        Debug.Log($"Marking Task {taskId} as {status}...");
        
        // Note: The API uses Query param for PUT /status endpoint: /api/tasks/{id}/status?status=done
        string url = $"{apiUrl}/tasks/{taskId}/status?status={status}";

        using (var req = new UnityWebRequest(url, "PUT"))
        {
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Authorization", $"Bearer {_token}");

            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"Task Update failed: {req.error} : {req.downloadHandler.text}");
            }
            else
            {
                Debug.Log("Task Update sent! Waiting for SignalR broadcast...");
            }
        }
    }

    [System.Serializable]
    class LoginDto
    {
        public string email;
        public string password;
    }

    [System.Serializable]
    class AuthResponse
    {
        public string token;
    }
}
