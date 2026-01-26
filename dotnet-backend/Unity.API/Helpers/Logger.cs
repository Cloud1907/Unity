
using System.IO;

namespace Unity.API.Helpers
{
    public static class Logger
    {
        private static string LogPath = @"C:\Users\univera\.gemini\antigravity\scratch\UnityAnalysis\api_debug.log";
        public static void Log(string message)
        {
            try
            {
                File.AppendAllText(LogPath, $"{DateTime.Now}: {message}\n");
            }
            catch {}
        }
    }
}
