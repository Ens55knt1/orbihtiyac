namespace OrbisisIhtiyac.Wpf.Models;

public sealed class Item
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Category { get; set; } = AppConstants.CatOther;
    public string Status { get; set; } = AppConstants.StatusMissing;
    public int RequiredQuantity { get; set; } = 1;
    public string Location { get; set; } = AppConstants.LocGenel;
    public string CreatedAt { get; set; } = "";
    public string? BoughtAt { get; set; }
    public string? SlipFileName { get; set; }
}

