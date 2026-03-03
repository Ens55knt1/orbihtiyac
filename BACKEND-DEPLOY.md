# Backend’i Render’a Yayınlama (Ücretsiz)

Backend’i Render’da yayınlayınca Firebase Hosting’teki giriş sayfası “Bağlantı hatası” vermez.

## 1. Projeyi GitHub’a atın

1. [GitHub](https://github.com) hesabınızla giriş yapın.
2. Yeni repo: **New repository** → isim verin (örn. `orbihtiyac`) → **Create**.
3. Bilgisayarınızda proje klasöründe (UTKU) terminal açın:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADI.git
git push -u origin main
```

(KULLANICI_ADINIZ ve REPO_ADI’yı kendi bilginizle değiştirin.)

## 2. Render’da servis oluşturun

1. [Render](https://render.com) → **Get started** (Google ile giriş yapabilirsiniz).
2. **Dashboard** → **New** → **Web Service**.
3. **Connect a repository** → GitHub’ı bağlayın, az önce push ettiğiniz repoyu seçin.
4. Ayarlar:
   - **Name:** `orbihtiyac-api` (veya istediğiniz isim)
   - **Root Directory:** `backend` yazın (önemli).
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. **Create Web Service**’e tıklayın.
6. İlk deploy birkaç dakika sürer. Bittiğinde üstte **URL** görünür, örn: `https://orbihtiyac-api.onrender.com`

## 3. Frontend’e backend adresini verin

1. `frontend/.env` dosyasını açın (yoksa `.env.example`’ı kopyalayıp `.env` yapın).
2. Şu satırı ekleyin veya güncelleyin (kendi Render URL’inizi yazın, sonunda `/` olmasın):

```
VITE_API_BASE=https://orbihtiyac-api.onrender.com
```

3. Frontend’i yeniden derleyip Firebase’e deploy edin:

```bash
cd frontend
npm run build
cd ..
firebase deploy
```

Bundan sonra https://orbihtiyac.web.app adresinden giriş yapabilirsiniz; backend Render’da çalışır.

## Notlar

- **Render ücretsiz planda** 15 dakika işlem yoksa uygulama uyur; ilk istek 30–60 saniye sürebilir (uyandırma).
- **Veriler:** Ücretsiz planda disk kalıcı değildir; deploy veya yeniden başlatmada kullanıcı/veri dosyaları sıfırlanabilir. Kalıcı veri için ileride veritabanı (örn. Firebase Firestore) eklenebilir.
- Repo’ya her `git push` yaptığınızda Render otomatik yeniden deploy eder (Blueprint kullanıyorsanız `render.yaml` ayarları geçerli olur).
