using Microsoft.AspNetCore.SignalR;

namespace Unity.API.Hubs
{
    public class AppHub : Hub
    {
        // Clients can join groups here if needed (e.g. per project)
        // public async Task JoinProject(string projectId)
        // {
        //     await Groups.AddToGroupAsync(Context.ConnectionId, $"Project_{projectId}");
        // }
    }
}
