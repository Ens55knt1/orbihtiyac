using System.IO;

namespace OrbisisIhtiyac.Wpf.Services;

public static class AppPaths
{
    public static string BaseDir { get; } =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OrbisisIhtiyac");

    public static string DataDir => Path.Combine(BaseDir, "data");
    public static string UploadsDir => Path.Combine(BaseDir, "uploads");
    public static string SlipsDir => Path.Combine(UploadsDir, "slips");

    public static string UsersFile => Path.Combine(DataDir, "users.json");
    public static string ItemsFile => Path.Combine(DataDir, "items.json");

    public static void EnsureDirs()
    {
        Directory.CreateDirectory(DataDir);
        Directory.CreateDirectory(SlipsDir);
    }
}

