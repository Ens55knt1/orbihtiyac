# ORBİSİS İhtiyaç – Java Masaüstü Uygulaması

Ofis içi malzeme takip uygulamasının Java (Swing) masaüstü sürümü.

## Gereksinimler

- **JDK 17** veya üzeri
- **Maven** (derleme için)

## Derleme ve çalıştırma

### Windows (çift tıklama)

- `baslat-java.bat` dosyasına çift tıklayın.  
  İlk çalıştırmada `mvn package` ile JAR oluşturulur, sonra uygulama açılır.

### Komut satırı

```bash
# Bağımlılıkları indirip JAR oluştur
mvn package -DskipTests

# Uygulamayı çalıştır
java -jar target/ihitiac-1.0.0.jar
```

## Veri konumu

- **Kullanıcılar:** `data/users.json` (uygulama ile aynı dizinde veya `user.dir`)
- **Malzemeler:** `data/items.json`
- **Fatura/slip dosyaları:** `uploads/slips/`

JAR’ı başka bir klasöre kopyaladıysanız, bu dosyalar JAR’ın bulunduğu dizinde oluşturulur.

## Giriş

- **Admin:** İsim: `admin`, Soyisim: (boş), Parola: `123456`
- Diğer kullanıcılar kayıt ekranından oluşturulur; admin panelinden rol atanır (Genel, 3. kat, 6. kat, Yönetici).

## Özellikler

- İsim / soyisim ile giriş ve kayıt
- Roller: Admin, Yönetici, Genel, 3. kat, 6. kat
- Lokasyon sekmeleri (Genel, 3. kat, 6. kat) — admin ve yönetici için
- İhtiyaçlar / Alınanlar sekmeleri
- Malzeme ekleme (otomatik kategori: Market, Ofis, Kuruyemiş, Meyve)
- Tümünü seç / Seçilenleri sil
- Alındı işaretleme, fatura/slip yükleme ve görüntüleme
- Admin: şifre değiştirme, rol yönetimi
