public static class AppConfig
{
    // Dynamic Key for Strict Security.
    // This key is generated on startup. Restarting the server invalidates all tokens.
    // Making this global avoids namespace issues with top-level statements.
    public static readonly byte[] JwtKey = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
}
