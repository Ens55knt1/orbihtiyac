using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Controls;
using OrbisisIhtiyac.Wpf.Models;

namespace OrbisisIhtiyac.Wpf.Views;

public partial class AdminWindow : Window
{
    private readonly User _admin;
    public ObservableCollection<UserRow> UserRows { get; } = [];

    public AdminWindow(User admin)
    {
        _admin = admin;
        InitializeComponent();
        PwError.Text = "";

        UsersGrid.ItemsSource = UserRows;
        LoadUsers();
    }

    private void LoadUsers()
    {
        UserRows.Clear();
        foreach (var u in App.Store.Users.OrderBy(u => u.Id))
            UserRows.Add(new UserRow(u));
    }

    private void OnChangePasswordClick(object sender, RoutedEventArgs e)
    {
        PwError.Text = "";
        var current = CurrentPw.Password;
        var next = NewPw.Password;
        if (!App.Store.ChangePassword(_admin.Id, current, next))
        {
            PwError.Text = "Mevcut parola hatalı veya yeni parola en az 4 karakter olmalı.";
            return;
        }
        CurrentPw.Password = "";
        NewPw.Password = "";
        MessageBox.Show("Parola güncellendi.", "Başarılı", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void OnRoleChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is not ComboBox cb) return;
        if (cb.DataContext is not UserRow row) return;
        if (row.IsAdmin) return;
        if (cb.SelectedValue is not string role) return;
        App.Store.UpdateUserRole(row.Id, role);
        LoadUsers();
    }
}

public sealed class UserRow : INotifyPropertyChanged
{
    public int Id { get; }
    public string DisplayName { get; }
    public bool IsAdmin { get; }

    private string _role;
    public string Role
    {
        get => _role;
        set
        {
            if (_role == value) return;
            _role = value;
            OnPropertyChanged();
        }
    }

    public List<KeyValuePair<string, string>> RoleOptions { get; } =
    [
        new(AppConstants.RoleGenel, "Genel"),
        new(AppConstants.RoleFloor3, "3. kat"),
        new(AppConstants.RoleFloor6, "6. kat"),
        new(AppConstants.RoleYonetici, "Yönetici"),
    ];

    public UserRow(User u)
    {
        Id = u.Id;
        DisplayName = u.DisplayName;
        IsAdmin = u.Role == AppConstants.RoleAdmin;
        _role = u.Role;
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    private void OnPropertyChanged([CallerMemberName] string? prop = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(prop));
}

