using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using Microsoft.Win32;
using OrbisisIhtiyac.Wpf.Models;
using OrbisisIhtiyac.Wpf.Services;

namespace OrbisisIhtiyac.Wpf.Views;

public partial class MainWindow : Window
{
    private readonly User _user;
    private string _selectedLocation = AppConstants.LocGenel;
    private bool _showBought;

    public ObservableCollection<ItemRow> Rows { get; } = [];

    public MainWindow(User user)
    {
        _user = user;
        InitializeComponent();

        ItemsList.ItemsSource = Rows;
        AdminButton.Visibility = _user.Role == AppConstants.RoleAdmin ? Visibility.Visible : Visibility.Collapsed;
        UserSubtitle.Text = $"{_user.DisplayName} · {RoleLabel(_user.Role)}";

        // Tabs default
        _showBought = false;
        TabNeeded.IsChecked = true;
        TabBought.IsChecked = false;

        var canPickLoc = _user.Role is AppConstants.RoleAdmin or AppConstants.RoleYonetici;
        LocationTabs.Visibility = canPickLoc ? Visibility.Visible : Visibility.Collapsed;
        LocationTitle.Visibility = canPickLoc ? Visibility.Collapsed : Visibility.Visible;

        if (!canPickLoc)
        {
            _selectedLocation = App.Store.EffectiveLocation(_user, AppConstants.LocGenel);
            LocationTitle.Text = CategoryUtil.LocationLabel(_selectedLocation);
        }
        else
        {
            SetLocation(AppConstants.LocGenel);
        }

        Refresh();
    }

    private void OnDragWindow(object sender, MouseButtonEventArgs e)
    {
        if (e.ChangedButton == MouseButton.Left && e.ButtonState == MouseButtonState.Pressed)
        {
            DragMove();
        }
    }

    private static string RoleLabel(string role) => role switch
    {
        AppConstants.RoleAdmin => "Admin",
        AppConstants.RoleYonetici => "Yönetici",
        AppConstants.RoleFloor3 => "3. kat",
        AppConstants.RoleFloor6 => "6. kat",
        _ => "Genel"
    };

    private void SetLocation(string loc)
    {
        _selectedLocation = loc;
        LocGenel.IsChecked = loc == AppConstants.LocGenel;
        Loc3.IsChecked = loc == AppConstants.LocFloor3;
        Loc6.IsChecked = loc == AppConstants.LocFloor6;
        Refresh();
    }

    private void SetTab(bool bought)
    {
        _showBought = bought;
        TabNeeded.IsChecked = !bought;
        TabBought.IsChecked = bought;
        Refresh();
    }

    private void Refresh()
    {
        var list = App.Store.GetItemsForLocation(_user, _selectedLocation)
            .Where(i => _showBought ? i.Status == AppConstants.StatusBought : i.Status != AppConstants.StatusBought)
            .OrderByDescending(i => i.Id)
            .ToList();

        // preserve selection by id
        var selected = Rows.Where(r => r.IsSelected).Select(r => r.Id).ToHashSet();

        Rows.Clear();
        foreach (var it in list)
        {
            var row = new ItemRow(it, _showBought)
            {
                IsSelected = selected.Contains(it.Id)
            };
            row.PropertyChanged += (_, args) =>
            {
                if (args.PropertyName == nameof(ItemRow.IsSelected))
                    UpdateSelectAllAndDeleteText();
            };
            Rows.Add(row);
        }

        UpdateSelectAllAndDeleteText();
    }

    private void UpdateSelectAllAndDeleteText()
    {
        var visibleIds = Rows.Select(r => r.Id).ToList();
        var selectedCount = Rows.Count(r => r.IsSelected);
        SelectAll.IsChecked = visibleIds.Count > 0 && selectedCount == visibleIds.Count;
        DeleteSelectedBtn.Content = selectedCount > 0 ? $"Seçilenleri sil ({selectedCount})" : "Seçilenleri sil";
        DeleteSelectedBtn.IsEnabled = selectedCount > 0;
    }

    private void OnLocationClick(object sender, RoutedEventArgs e)
    {
        if (sender == LocGenel) SetLocation(AppConstants.LocGenel);
        else if (sender == Loc3) SetLocation(AppConstants.LocFloor3);
        else if (sender == Loc6) SetLocation(AppConstants.LocFloor6);
    }

    private void OnTabClick(object sender, RoutedEventArgs e)
    {
        if (sender == TabNeeded) SetTab(false);
        else if (sender == TabBought) SetTab(true);
    }

    private void OnAddItemClick(object sender, RoutedEventArgs e)
    {
        var name = NewItemName.Text.Trim();
        if (string.IsNullOrWhiteSpace(name)) return;
        var qty = 1;
        _ = int.TryParse(NewItemQty.Text.Trim(), out qty);
        if (qty < 1) qty = 1;
        App.Store.AddItem(_user, _selectedLocation, name, qty);
        NewItemName.Text = "";
        NewItemQty.Text = "1";
        Refresh();
    }

    private void OnDeleteSelectedClick(object sender, RoutedEventArgs e)
    {
        var ids = Rows.Where(r => r.IsSelected).Select(r => r.Id).ToList();
        if (ids.Count == 0) return;
        if (MessageBox.Show($"{ids.Count} öğeyi silmek istediğinize emin misiniz?", "Onay", MessageBoxButton.YesNo, MessageBoxImage.Warning) != MessageBoxResult.Yes)
            return;
        App.Store.DeleteItems(_user, ids);
        Refresh();
    }

    private void OnSelectAllClick(object sender, RoutedEventArgs e)
    {
        var check = SelectAll.IsChecked == true;
        foreach (var r in Rows) r.IsSelected = check;
        UpdateSelectAllAndDeleteText();
    }

    private void OnRowSelectionChanged(object sender, RoutedEventArgs e)
    {
        UpdateSelectAllAndDeleteText();
    }

    private void OnDeleteItemClick(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn) return;
        if (btn.DataContext is not ItemRow row) return;
        if (MessageBox.Show("Bu öğeyi silmek istediğinize emin misiniz?", "Onay", MessageBoxButton.YesNo, MessageBoxImage.Warning) != MessageBoxResult.Yes)
            return;
        App.Store.DeleteItem(_user, row.Id);
        Refresh();
    }

    private void OnPrimaryActionClick(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn) return;
        if (btn.DataContext is not ItemRow row) return;

        if (!_showBought)
        {
            var slip = PickSlipFile();
            if (slip is null) return; // slip is required when marking bought
            App.Store.MarkBoughtWithSlip(_user, row.Id, slip);
            Refresh();
            return;
        }

        // bought tab
        if (!string.IsNullOrWhiteSpace(row.SlipFileName))
        {
            var full = App.Store.GetSlipFullPath(row.SlipFileName!);
            if (full is null || !DataStore.OpenFileWithShell(full))
                MessageBox.Show("Dosya açılamadı veya bulunamadı.", "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            return;
        }

        var slip2 = PickSlipFile();
        if (slip2 is null) return;
        App.Store.UploadSlip(_user, row.Id, slip2);
        Refresh();
    }

    private static string? PickSlipFile()
    {
        var dlg = new OpenFileDialog
        {
            Filter = "PDF veya resim|*.pdf;*.jpg;*.jpeg;*.png",
            Multiselect = false
        };
        return dlg.ShowDialog() == true ? dlg.FileName : null;
    }

    private void OnAdminClick(object sender, RoutedEventArgs e)
    {
        if (_user.Role != AppConstants.RoleAdmin) return;
        var admin = new AdminWindow(_user) { Owner = this };
        admin.ShowDialog();
        // user list may have changed
        Refresh();
    }

    private void OnLogoutClick(object sender, RoutedEventArgs e)
    {
        var login = new LoginWindow();
        login.Show();
        Close();
    }
}

public sealed class ItemRow : INotifyPropertyChanged
{
    private bool _isSelected;
    private readonly bool _showBought;

    public ItemRow(Item item, bool showBought)
    {
        _showBought = showBought;
        Id = item.Id;
        Name = item.Name;
        QuantityText = $"{item.RequiredQuantity} adet";
        SlipFileName = item.SlipFileName;

        var parts = new List<string>();
        var cat = CategoryUtil.CategoryLabel(item.Category);
        if (!string.IsNullOrWhiteSpace(cat)) parts.Add(cat);
        if (!string.IsNullOrWhiteSpace(item.CreatedAt)) parts.Add("Yüklendi: " + FormatTime(item.CreatedAt));
        if (showBought && !string.IsNullOrWhiteSpace(item.BoughtAt)) parts.Add("Alındı: " + FormatDate(item.BoughtAt!));
        Meta = string.Join(" · ", parts);

        PrimaryActionText = showBought
            ? (!string.IsNullOrWhiteSpace(item.SlipFileName) ? "Fatura görüntüle" : "Fatura yükle")
            : "Alındı";
    }

    public int Id { get; }
    public string Name { get; }
    public string QuantityText { get; }
    public string Meta { get; }
    public string PrimaryActionText { get; }
    public string? SlipFileName { get; }

    public bool IsSelected
    {
        get => _isSelected;
        set
        {
            if (_isSelected == value) return;
            _isSelected = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsSelected)));
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private static string FormatTime(string iso)
    {
        if (DateTimeOffset.TryParse(iso, out var dt))
            return dt.ToLocalTime().ToString("dd.MM.yyyy HH:mm");
        return iso;
    }

    private static string FormatDate(string iso)
    {
        if (DateTimeOffset.TryParse(iso, out var dt))
            return dt.ToLocalTime().ToString("dd.MM.yyyy");
        return iso;
    }
}