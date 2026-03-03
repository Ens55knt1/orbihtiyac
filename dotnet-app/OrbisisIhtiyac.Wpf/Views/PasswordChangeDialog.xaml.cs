using System.Windows;
using OrbisisIhtiyac.Wpf.Models;

namespace OrbisisIhtiyac.Wpf.Views;

public partial class PasswordChangeDialog : Window
{
    private readonly User _user;
    private readonly string _currentPassword;

    public PasswordChangeDialog(User user, string currentPassword)
    {
        _user = user;
        _currentPassword = currentPassword;
        InitializeComponent();
        Err.Text = "";
    }

    private void OnSkip(object sender, RoutedEventArgs e)
    {
        App.Store.SkipPasswordChange(_user.Id);
        DialogResult = true;
        Close();
    }

    private void OnSave(object sender, RoutedEventArgs e)
    {
        Err.Text = "";
        var newPw = NewPw.Password;
        if (string.IsNullOrWhiteSpace(newPw) || newPw.Length < 4)
        {
            Err.Text = "Yeni parola en az 4 karakter olmalı.";
            return;
        }

        if (!App.Store.ChangePassword(_user.Id, _currentPassword, newPw))
        {
            Err.Text = "Parola güncellenemedi.";
            return;
        }

        DialogResult = true;
        Close();
    }
}

