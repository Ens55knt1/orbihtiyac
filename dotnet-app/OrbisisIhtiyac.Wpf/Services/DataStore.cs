using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Text.Encodings.Web;
using OrbisisIhtiyac.Wpf.Models;

namespace OrbisisIhtiyac.Wpf.Services;

public sealed class DataStore
{
    private readonly object _gate = new();
    private List<User> _users = [];
    private List<Item> _items = [];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public DataStore()
    {
        AppPaths.EnsureDirs();
        Load();
        EnsureAdmin();
    }

    public IReadOnlyList<User> Users
    {
        get { lock (_gate) return _users.ToList(); }
    }

    public IReadOnlyList<Item> Items
    {
        get { lock (_gate) return _items.ToList(); }
    }

    private void Load()
    {
        lock (_gate)
        {
            _users = ReadList<User>(AppPaths.UsersFile) ?? [];
            _items = ReadList<Item>(AppPaths.ItemsFile) ?? [];

            // Migration: eski formatlarda "username" olabilir; yok sayıyoruz.
            foreach (var u in _users)
            {
                u.Isim ??= "";
                u.Soyisim ??= "";
                u.Password ??= "";
                u.Role ??= AppConstants.RoleGenel;
            }
        }
    }

    private void EnsureAdmin()
    {
        lock (_gate)
        {
            if (_users.Count == 0)
            {
                _users.Add(new User
                {
                    Id = 1,
                    Isim = "admin",
                    Soyisim = "",
                    Password = "123456",
                    Role = AppConstants.RoleAdmin,
                    PasswordChanged = false
                });
                SaveUsers();
            }
        }
    }

    private static List<T>? ReadList<T>(string path)
    {
        try
        {
            if (!File.Exists(path)) return null;
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private void SaveUsers()
    {
        lock (_gate)
        {
            File.WriteAllText(AppPaths.UsersFile, JsonSerializer.Serialize(_users, JsonOptions));
        }
    }

    private void SaveItems()
    {
        lock (_gate)
        {
            File.WriteAllText(AppPaths.ItemsFile, JsonSerializer.Serialize(_items, JsonOptions));
        }
    }

    // --- Auth ---
    public User? Login(string isim, string soyisim, string password)
    {
        isim = (isim ?? "").Trim();
        soyisim = (soyisim ?? "").Trim();
        password = password ?? "";

        lock (_gate)
        {
            return _users.FirstOrDefault(u =>
                u.Isim == isim && u.Soyisim == soyisim && u.Password == password);
        }
    }

    public (bool ok, string message, User? user) Register(string isim, string soyisim, string password)
    {
        isim = (isim ?? "").Trim();
        soyisim = (soyisim ?? "").Trim();
        password = password ?? "";

        if (string.IsNullOrWhiteSpace(isim) || password.Length < 4)
            return (false, "İsim ve parola (en az 4 karakter) gerekli", null);

        static string Key(string a, string b) => $"{a.ToLowerInvariant()}|{b.ToLowerInvariant()}";

        lock (_gate)
        {
            if (_users.Any(u => Key(u.Isim, u.Soyisim) == Key(isim, soyisim)))
                return (false, "Bu isim ve soyisim zaten kayıtlı", null);

            var id = _users.Count == 0 ? 1 : _users.Max(u => u.Id) + 1;
            var uNew = new User
            {
                Id = id,
                Isim = isim,
                Soyisim = soyisim,
                Password = password,
                Role = AppConstants.RoleGenel,
                PasswordChanged = false
            };
            _users.Add(uNew);
            SaveUsers();
            return (true, "", uNew);
        }
    }

    public bool ChangePassword(int userId, string currentPassword, string newPassword)
    {
        currentPassword ??= "";
        newPassword ??= "";
        if (newPassword.Length < 4) return false;

        lock (_gate)
        {
            var u = _users.FirstOrDefault(x => x.Id == userId);
            if (u is null) return false;
            if (u.Password != currentPassword) return false;
            u.Password = newPassword;
            u.PasswordChanged = true;
            SaveUsers();
            return true;
        }
    }

    public void SkipPasswordChange(int userId)
    {
        lock (_gate)
        {
            var u = _users.FirstOrDefault(x => x.Id == userId);
            if (u is null) return;
            if (u.Role != AppConstants.RoleAdmin) return;
            u.PasswordChanged = true;
            SaveUsers();
        }
    }

    public bool UpdateUserRole(int userId, string role)
    {
        if (role is not (AppConstants.RoleGenel or AppConstants.RoleFloor3 or AppConstants.RoleFloor6 or AppConstants.RoleYonetici))
            return false;

        lock (_gate)
        {
            var u = _users.FirstOrDefault(x => x.Id == userId);
            if (u is null) return false;
            if (u.Role == AppConstants.RoleAdmin) return false;
            u.Role = role;
            SaveUsers();
            return true;
        }
    }

    public User? GetUserById(int id)
    {
        lock (_gate) return _users.FirstOrDefault(x => x.Id == id);
    }

    // --- Items ---
    public string EffectiveLocation(User user, string selectedLocation)
    {
        if (user.Role is AppConstants.RoleAdmin or AppConstants.RoleYonetici)
        {
            return selectedLocation is AppConstants.LocFloor3 or AppConstants.LocFloor6 ? selectedLocation : AppConstants.LocGenel;
        }

        if (user.Role is AppConstants.RoleFloor3 or AppConstants.RoleFloor6)
            return user.Role;

        return AppConstants.LocGenel;
    }

    private bool CanAccessItem(User user, Item item)
    {
        if (user.Role is AppConstants.RoleAdmin or AppConstants.RoleYonetici) return true;
        var loc = EffectiveLocation(user, item.Location);
        return item.Location == loc;
    }

    public List<Item> GetItemsForLocation(User user, string selectedLocation)
    {
        var loc = EffectiveLocation(user, selectedLocation);
        lock (_gate)
        {
            return _items.Where(i => i.Location == loc).ToList();
        }
    }

    public Item AddItem(User user, string selectedLocation, string name, int qty)
    {
        var loc = EffectiveLocation(user, selectedLocation);
        var itemName = (name ?? "").Trim().ToUpperInvariant();
        if (qty < 1) qty = 1;

        lock (_gate)
        {
            var id = _items.Count == 0 ? 1 : _items.Max(i => i.Id) + 1;
            var it = new Item
            {
                Id = id,
                Name = itemName,
                Category = CategoryUtil.AutoCategory(itemName),
                Status = AppConstants.StatusMissing,
                RequiredQuantity = qty,
                Location = loc,
                CreatedAt = DateTimeOffset.UtcNow.ToString("O")
            };
            _items.Add(it);
            SaveItems();
            return it;
        }
    }

    public bool DeleteItem(User user, int itemId)
    {
        lock (_gate)
        {
            var it = _items.FirstOrDefault(i => i.Id == itemId);
            if (it is null) return false;
            if (!CanAccessItem(user, it)) return false;
            _items.Remove(it);
            SaveItems();
            return true;
        }
    }

    public void DeleteItems(User user, IEnumerable<int> itemIds)
    {
        foreach (var id in itemIds.ToList())
            DeleteItem(user, id);
    }

    public bool MarkBoughtWithSlip(User user, int itemId, string slipPath)
    {
        lock (_gate)
        {
            var it = _items.FirstOrDefault(i => i.Id == itemId);
            if (it is null) return false;
            if (!CanAccessItem(user, it)) return false;

            var slipName = CopySlip(it.Id, slipPath);
            if (slipName is null) return false;

            it.Status = AppConstants.StatusBought;
            it.BoughtAt = DateTimeOffset.UtcNow.ToString("O");
            it.SlipFileName = slipName;
            SaveItems();
            return true;
        }
    }

    public bool UploadSlip(User user, int itemId, string slipPath)
    {
        lock (_gate)
        {
            var it = _items.FirstOrDefault(i => i.Id == itemId);
            if (it is null) return false;
            if (!CanAccessItem(user, it)) return false;

            var slipName = CopySlip(it.Id, slipPath);
            if (slipName is null) return false;
            it.SlipFileName = slipName;
            SaveItems();
            return true;
        }
    }

    public string? GetSlipFullPath(string slipFileName)
    {
        if (string.IsNullOrWhiteSpace(slipFileName)) return null;
        var path = Path.Combine(AppPaths.SlipsDir, slipFileName);
        return File.Exists(path) ? path : null;
    }

    public static bool OpenFileWithShell(string fullPath)
    {
        try
        {
            Process.Start(new ProcessStartInfo(fullPath) { UseShellExecute = true });
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static string? CopySlip(int itemId, string slipPath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(slipPath) || !File.Exists(slipPath)) return null;
            AppPaths.EnsureDirs();

            var ext = Path.GetExtension(slipPath);
            if (string.IsNullOrWhiteSpace(ext)) ext = ".pdf";

            var destName = $"{itemId}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";
            var destPath = Path.Combine(AppPaths.SlipsDir, destName);
            File.Copy(slipPath, destPath, true);
            return destName;
        }
        catch
        {
            return null;
        }
    }
}

