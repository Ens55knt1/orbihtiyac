using System.Windows;

namespace OrbisisIhtiyac.Wpf;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    public static Services.DataStore Store { get; } = new();

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        var login = new Views.LoginWindow();
        login.Show();
    }
}

