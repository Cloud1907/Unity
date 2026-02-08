using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR.Client;
using UnityEngine;

// Requires NuGet package: Microsoft.AspNetCore.SignalR.Client
// Install via NuGet for Unity or copy DLLs.

public class TaskSyncManager : MonoBehaviour
{
    public static TaskSyncManager Instance { get; private set; }

    [Header("Connection Settings")]
    [Tooltip("URL of the Backend SignalR Hub (e.g., http://localhost:5000/appHub or http://192.168.1.10:8080/appHub)")]
    public string hubUrl = "http://localhost:8080/appHub";

    public bool connectOnStart = true;

    // Events
    public event Action<TaskItem> OnTaskUpdated;
    public event Action<string> OnTaskCreated; // Example payload
    public event Action<int> OnTaskDeleted;

    // SignalR Connection
    private HubConnection _connection;
    
    // Main Thread Dispatcher Queue
    private readonly ConcurrentQueue<Action> _executionQueue = new ConcurrentQueue<Action>();

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private async void Start()
    {
        if (connectOnStart)
        {
            await InitializeSignalR();
        }
    }

    private void Update()
    {
        // Process Main Thread Queue
        while (!_executionQueue.IsEmpty)
        {
            if (_executionQueue.TryDequeue(out var action))
            {
                action?.Invoke();
            }
        }
    }

    [Header("Authentication")]
    public string authToken = ""; // Set this after login

    // ...

    public async Task InitializeSignalR()
    {
        if (_connection != null && _connection.State == HubConnectionState.Connected) return;

        Debug.Log($"[SignalR] Connecting to {hubUrl}...");

        _connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(authToken);
            })
            .WithAutomaticReconnect(new [] { 
                TimeSpan.Zero, 
                TimeSpan.FromSeconds(2), 
                TimeSpan.FromSeconds(5), 
                TimeSpan.FromSeconds(10) 
            }) // Retry policy
            .Build();

        // Register Handlers
        _connection.On<TaskItem>("TaskUpdated", (task) =>
        {
            Enqueue(() => 
            {
                Debug.Log($"[SignalR] Task Updated: {task.Title} (ID: {task.Id}, Status: {task.Status})");
                OnTaskUpdated?.Invoke(task);
            });
        });

        _connection.On<TaskItem>("TaskCreated", (task) =>
        {
            Enqueue(() => 
            {
                Debug.Log($"[SignalR] Task Created: {task.Title}");
                // OnTaskCreated?.Invoke(task.Title);
            });
        });

        _connection.On<int>("TaskDeleted", (taskId) =>
        {
            Enqueue(() => 
            {
                Debug.Log($"[SignalR] Task Deleted: {taskId}");
                OnTaskDeleted?.Invoke(taskId);
            });
        });

        _connection.Reconnecting += (error) =>
        {
            Enqueue(() => Debug.LogWarning($"[SignalR] Reconnecting... Error: {error?.Message}"));
            return Task.CompletedTask;
        };

        _connection.Reconnected += (connectionId) =>
        {
            Enqueue(() => Debug.Log($"[SignalR] Reconnected! ID: {connectionId}"));
            return Task.CompletedTask;
        };

        try
        {
            await _connection.StartAsync();
            Debug.Log("[SignalR] Connected successfully!");
        }
        catch (Exception ex)
        {
            Debug.LogError($"[SignalR] Connection failed: {ex.Message}");
        }
    }

    private void Enqueue(Action action)
    {
        _executionQueue.Enqueue(action);
    }

    /// <summary>
    /// Join a specific project group to receive only that project's updates.
    /// Call this after connecting.
    /// </summary>
    public async Task JoinProject(int projectId)
    {
        if (_connection == null || _connection.State != HubConnectionState.Connected)
        {
            Debug.LogWarning("[SignalR] Cannot join project - not connected.");
            return;
        }
        await _connection.InvokeAsync("JoinProject", projectId.ToString());
        Debug.Log($"[SignalR] Joined Project Group: Project_{projectId}");
    }

    /// <summary>
    /// Leave a project group.
    /// </summary>
    public async Task LeaveProject(int projectId)
    {
        if (_connection == null || _connection.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("LeaveProject", projectId.ToString());
        Debug.Log($"[SignalR] Left Project Group: Project_{projectId}");
    }
    
    private async void OnDestroy()
    {
        if (_connection != null)
        {
            await _connection.StopAsync();
            await _connection.DisposeAsync();
        }
    }
}

// Simple DTO to match Backend TaskItem (subset of fields)
[Serializable]
public class TaskItem
{
    public int Id;
    public string Title;
    public string Status;
    public string Priority;
    public int Progress;
    public int ProjectId;
    public string UpdatedAt;
}
