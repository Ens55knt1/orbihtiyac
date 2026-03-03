using OrbisisIhtiyac.Wpf.Models;

namespace OrbisisIhtiyac.Wpf.Services;

public static class CategoryUtil
{
    private static readonly string[] OfisKeys =
    [
        "kağıt", "kagit", "a4", "kalem", "defter", "dosya", "zımba", "zimba", "makas", "bant",
        "toner", "kartuş", "kartus", "klasör", "klasor", "silgi", "tahta", "tebeşir", "tebesir",
        "flip", "projeksiyon", "yazıcı", "yazici", "fotokopi"
    ];

    private static readonly string[] KuruyemisKeys =
    [
        "fındık", "findik", "fıstık", "fistik", "ceviz", "badem", "leblebi", "çekirdek", "cekirdek",
        "kuru üzüm", "kuru uzum", "kuru kayısı", "kayisi", "kuruyemiş", "kuruyemis", "antep"
    ];

    private static readonly string[] MeyveKeys =
    [
        "elma", "armut", "portakal", "mandalina", "muz", "çilek", "cilek", "üzüm", "uzum",
        "karpuz", "kavun", "kiraz", "şeftali", "seftali", "erik", "kivi", "mango", "avokado",
        "meyve", "limon", "greyfurt", "nar", "ayva", "incir", "dut", "kayısı", "kaysi"
    ];

    private static readonly string[] MarketKeys =
    [
        "kahve", "çay", "cay", "süt", "sut", "su", "meşrubat", "mesrubat", "içecek", "icecek",
        "bisküvi", "cikolata", "çikolata", "şeker", "seker", "sakız", "sakiz", "deterjan", "tuvalet",
        "havlu", "sabun", "şampuan", "sampuan", "peçete", "pecete", "yoğurt", "yogurt", "peynir",
        "zeytin", "reçel", "recel", "bal", "ekmek", "simit", "poğaça", "pogaca", "börek", "borek",
        "salça", "salca", "yağ", "yag", "tuz", "un", "pirinç", "pirinc", "makarna", "konserve",
        "domates", "salatalık", "biber", "soğan", "sogan", "patates", "yumurta", "gazoz", "kola",
        "ayran", "maden suyu", "meyve suyu"
    ];

    public static string AutoCategory(string name)
    {
        var n = (name ?? "").ToLowerInvariant().Trim();
        if (n.Length == 0) return AppConstants.CatOther;

        foreach (var k in OfisKeys) if (n.Contains(k)) return AppConstants.CatOfis;
        foreach (var k in KuruyemisKeys) if (n.Contains(k)) return AppConstants.CatKuruyemis;
        foreach (var k in MeyveKeys) if (n.Contains(k)) return AppConstants.CatMeyve;
        foreach (var k in MarketKeys) if (n.Contains(k)) return AppConstants.CatMarket;
        return AppConstants.CatOther;
    }

    public static string CategoryLabel(string category) => category switch
    {
        AppConstants.CatMarket => "Market",
        AppConstants.CatOfis => "Ofis",
        AppConstants.CatKuruyemis => "Kuruyemiş",
        AppConstants.CatMeyve => "Meyve",
        _ => ""
    };

    public static string LocationLabel(string location) => location switch
    {
        AppConstants.LocGenel => "Genel",
        AppConstants.LocFloor3 => "3. kat",
        AppConstants.LocFloor6 => "6. kat",
        _ => ""
    };
}

