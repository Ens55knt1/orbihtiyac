package com.orbisis.ihitiac.service;

public final class CategoryUtil {
    private static final String[] OFIS_KEYS = {
        "kağıt", "kagit", "a4", "kalem", "defter", "dosya", "zımba", "zimba", "makas", "bant",
        "toner", "kartuş", "kartus", "klasör", "klasor", "silgi", "tahta", "tebeşir", "tebesir",
        "flip", "projeksiyon", "yazıcı", "yazici", "fotokopi"
    };
    private static final String[] KURUYEMIS_KEYS = {
        "fındık", "findik", "fıstık", "fistik", "ceviz", "badem", "leblebi", "çekirdek", "cekirdek",
        "kuru üzüm", "kuru uzum", "kuru kayısı", "kayisi", "kuruyemiş", "kuruyemis", "antep"
    };
    private static final String[] MEYVE_KEYS = {
        "elma", "armut", "portakal", "mandalina", "muz", "çilek", "cilek", "üzüm", "uzum",
        "karpuz", "kavun", "kiraz", "şeftali", "seftali", "erik", "kivi", "mango", "avokado",
        "meyve", "limon", "greyfurt", "nar", "ayva", "incir", "dut", "kayısı", "kaysi"
    };
    private static final String[] MARKET_KEYS = {
        "kahve", "çay", "cay", "süt", "sut", "su", "meşrubat", "mesrubat", "içecek", "icecek",
        "bisküvi", "çikolata", "cikolata", "şeker", "seker", "sakız", "sakiz", "deterjan", "tuvalet",
        "havlu", "sabun", "şampuan", "sampuan", "peçete", "pecete", "yoğurt", "yogurt", "peynir",
        "zeytin", "reçel", "recel", "bal", "ekmek", "simit", "poğaça", "pogaca", "börek", "borek",
        "salça", "salca", "yağ", "yag", "tuz", "un", "pirinç", "pirinc", "makarna", "konserve",
        "domates", "salatalık", "biber", "soğan", "sogan", "patates", "yumurta", "gazoz", "kola",
        "ayran", "maden suyu", "meyve suyu"
    };

    public static String autoCategory(String name) {
        if (name == null) return "other";
        String n = name.toLowerCase().trim();
        for (String k : OFIS_KEYS) if (n.contains(k)) return "ofis";
        for (String k : KURUYEMIS_KEYS) if (n.contains(k)) return "kuruyemiş";
        for (String k : MEYVE_KEYS) if (n.contains(k)) return "meyve";
        for (String k : MARKET_KEYS) if (n.contains(k)) return "market";
        return "other";
    }

    public static String categoryLabel(String category) {
        if (category == null || "other".equals(category)) return "";
        switch (category) {
            case "market": return "Market";
            case "ofis": return "Ofis";
            case "kuruyemiş": return "Kuruyemiş";
            case "meyve": return "Meyve";
            default: return "";
        }
    }
}
