using System.Windows;
using System.Windows.Input;
using OrbisisIhtiyac.Wpf.Models;

namespace OrbisisIhtiyac.Wpf.Views;

public partial class LoginWindow : Window
{
    public LoginWindow()
    {
        InitializeComponent();
        LoginErrorText.Text = "";
        RegisterErrorText.Text = "";
        ShowLogin();
    }

    private void ShowLogin()
    {
        TabLogin.IsChecked = true;
        TabRegister.IsChecked = false;
        LoginPanel.Visibility = Visibility.Visible;
        RegisterPanel.Visibility = Visibility.Collapsed;
    }

    private void ShowRegister()
    {
        TabLogin.IsChecked = false;
        TabRegister.IsChecked = true;
        LoginPanel.Visibility = Visibility.Collapsed;
        RegisterPanel.Visibility = Visibility.Visible;
    }

    private void OnShowLoginClick(object sender, RoutedEventArgs e) => ShowLogin();
    private void OnShowRegisterClick(object sender, RoutedEventArgs e) => ShowRegister();

    private void OnLoginClick(object sender, RoutedEventArgs e)
    {
        LoginErrorText.Text = "";

        var isim = LoginIsim.Text.Trim();
        var soyisim = LoginSoyisim.Text.Trim();
        var password = LoginPassword.Password;

        var user = App.Store.Login(isim, soyisim, password);
        if (user is null)
        {
            LoginErrorText.Text = "İsim, soyisim veya parola hatalı";
            return;
        }

        if (user.Role == AppConstants.RoleAdmin && !user.PasswordChanged)
        {
            var result = MessageBox.Show(
                "İlk giriş — İsteğe bağlı şifre belirleme. Şimdi değiştirmek ister misiniz?",
                "Şifre",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                var dlg = new PasswordChangeDialog(user, password) { Owner = this };
                dlg.ShowDialog();
            }
            else
            {
                App.Store.SkipPasswordChange(user.Id);
            }
            user = App.Store.GetUserById(user.Id) ?? user;
        }

        OpenMain(user);
    }

    private void OnRegisterClick(object sender, RoutedEventArgs e)
    {
        RegisterErrorText.Text = "";

        var isim = RegIsim.Text.Trim();
        var soyisim = RegSoyisim.Text.Trim();
        var password = RegPassword.Password;

        var (ok, message, user) = App.Store.Register(isim, soyisim, password);
        if (!ok || user is null)
        {
            RegisterErrorText.Text = message.Length > 0 ? message : "Kayıt başarısız";
            return;
        }

        OpenMain(user);
    }

    private void OpenMain(User user)
    {
        var main = new MainWindow(user);
        main.Show();
        Close();
    }

    private void OnDragWindow(object sender, MouseButtonEventArgs e)
    {
        if (e.ChangedButton == MouseButton.Left && e.ButtonState == MouseButtonState.Pressed)
        {
            DragMove();
        }
    }
}

