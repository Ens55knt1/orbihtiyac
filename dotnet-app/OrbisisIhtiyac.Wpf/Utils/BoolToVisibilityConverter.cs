using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace OrbisisIhtiyac.Wpf.Utils;

/// <summary>
/// Supports optional ConverterParameter="invert".
/// </summary>
public sealed class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var b = value is bool vb && vb;
        var invert = parameter is string s && s.Equals("invert", StringComparison.OrdinalIgnoreCase);
        if (invert) b = !b;
        return b ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is not Visibility v) return false;
        var b = v == Visibility.Visible;
        var invert = parameter is string s && s.Equals("invert", StringComparison.OrdinalIgnoreCase);
        return invert ? !b : b;
    }
}

