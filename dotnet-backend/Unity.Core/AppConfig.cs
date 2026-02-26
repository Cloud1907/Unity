namespace Unity.Core;
public static class AppConfig
{
    // Dynamic Key for Strict Security.
    // This key is generated on startup. Restarting the server invalidates all tokens.
    // In production, this ensures zero persistent access after a security breach or maintenance restart.
    public static readonly byte[] JwtKey = GenerateKey();

    private static byte[] GenerateKey()
    {
        var key = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(key);
        }
        return key;
    }
}
