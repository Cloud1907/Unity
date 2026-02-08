using Microsoft.AspNetCore.SignalR;

namespace Unity.API.Hubs
{
    public class AppHub : Hub
    {
        // Clients connect and join specific project groups to receive filtered updates
        public async Task JoinProject(string projectId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Project_{projectId}");
        }

        public async Task LeaveProject(string projectId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Project_{projectId}");
        }

        public async Task JoinWorkspace(string workspaceId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Workspace_{workspaceId}");
        }

        public async Task LeaveWorkspace(string workspaceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Workspace_{workspaceId}");
        }

        // Fix for "Method does not exist" error
        public async Task JoinProjectGroup(string projectId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Project_{projectId}");
        }

        public async Task LeaveProjectGroup(string projectId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Project_{projectId}");
        }
    }
}
