# Firebase Kurulumu

Bu projede Firebase kullanmak için aşağıdaki adımları izleyin.

## 1. Firebase projesi oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin.
2. "Proje Ekle" ile yeni bir proje oluşturun (veya mevcut projeyi seçin).
3. Proje oluştuktan sonra **Proje ayarları** (dişli) > **Genel** sekmesine gidin.
4. "Uygulamanız" bölümünde **Web** (</> ikonu) ile bir web uygulaması ekleyin.
5. Uygulama adı girin (örn. "Orbisis İhtiyaç") ve "Uygulamayı kaydet"e tıklayın.
6. Açılan pencerede `firebaseConfig` nesnesindeki değerleri kopyalayın.

## 2. Ortam değişkenlerini ayarlama

1. `frontend` klasöründe `.env.example` dosyasını `.env` olarak kopyalayın:
   ```bash
   cd frontend
   copy .env.example .env
   ```
2. `.env` dosyasını açın ve Firebase Console’dan kopyaladığınız değerleri yapıştırın:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=projeniz.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=projeniz
   VITE_FIREBASE_STORAGE_BUCKET=projeniz.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc...
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
   ```

## 3. Bağımlılıkları yükleme

```bash
cd frontend
npm install
```

## 4. Kullanım

Firebase, `frontend/src/firebase.ts` içinde başlatılıyor. Config doğru doldurulduysa uygulama açılırken Firebase hazır olur.

- **Auth:** `import { auth, hasConfig } from "./firebase";` — Giriş (Google, e-posta vb.) eklemek için kullanılabilir.
- **Firestore:** `import { db } from "./firebase";` — Veritabanı okuma/yazma için.
- **Analytics:** `import { analytics } from "./firebase";` — Ölçüm için (measurementId varsa).

Config yoksa veya eksikse `hasConfig` false olur; `auth` ve `db` null kalır, mevcut backend auth’unuz çalışmaya devam eder.

## 5. Güvenlik

- `.env` dosyasını asla Git’e eklemeyin (zaten `.gitignore`’da olmalı).
- API anahtarı frontend’de kalır; güvenlik kurallarını Firebase Console’da (Firestore Rules, Auth ayarları) mutlaka sıkı tutun.

---

# Firebase Hosting (Siteyi yayınlama)

Proje kökünde `firebase.json` ve `.firebaserc` hazır; proje **orbihtiyac** olarak ayarlı.

## 1. Firebase CLI yükleme (yoksa)

```bash
npm install -g firebase-tools
```

## 2. Google hesabına giriş (bir kez)

```bash
firebase login
```

Tarayıcı açılır, Google ile giriş yapın.

## 3. Frontend’i derleme

```bash
cd frontend
npm run build
cd ..
```

## 4. Hosting’e dağıtma

```bash
firebase deploy
```

Dağıtım sonrası konsolda **Hosting URL** (örn. `https://orbihtiyac.web.app`) görünür; site bu adresten açılır.

---

# "Bağlantı hatası" girişte çıkıyorsa

Firebase Hosting’te açılan site **sadece frontend**dir; giriş ve veriler **backend** (Node/Express) üzerinden çalışır. Backend’i internette yayınlamanız gerekir.

**Adım adım:** Proje kökündeki **[BACKEND-DEPLOY.md](BACKEND-DEPLOY.md)** dosyasını açın. Orada Render.com ile ücretsiz backend deploy ve frontend’e `VITE_API_BASE` ekleme adımları anlatılıyor. Tamamladıktan sonra https://orbihtiyac.web.app üzerinden giriş yapılabilir.

**Sadece bilgisayarınızda denemek için:** Backend’i çalıştırın (`cd backend && npm start`), frontend’i çalıştırın (`cd frontend && npm run dev`). Giriş sayfası http://localhost:5173 üzerinden backend’e (proxy ile) bağlanır; bağlantı hatası olmaz.
