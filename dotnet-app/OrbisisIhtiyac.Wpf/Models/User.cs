namespace OrbisisIhtiyac.Wpf.Models;

public sealed class User
{
    public int Id { get; set; }
    public string Isim { get; set; } = "";
    public string Soyisim { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = AppConstants.RoleGenel;
    public bool PasswordChanged { get; set; }

    public string DisplayName => string.IsNullOrWhiteSpace(Soyisim) ? Isim : $"{Isim} {Soyisim}";
}

