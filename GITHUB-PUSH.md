# GitHub’a Kod Gönderme (Render için)

Render "repository is empty" diyor; projeyi GitHub’a push etmeniz gerekiyor.

## 1. Git yüklü mü?

- **Yüklü değilse:** https://git-scm.com/download/win adresinden indirip kurun.
- Kurduktan sonra **yeni bir terminal** açın.

## 2. Proje klasöründe terminal açın

`c:\Users\MENES\Desktop\UTKU` klasörüne gidin (veya Cursor/VS Code’da bu projeyi açıp **Terminal → New Terminal**).

## 3. Git kimliğinizi ayarlayın (ilk kez)

Commit yapabilmek için adınız ve e‑postanız gerekir. **Bir kez** çalıştırın (kendi bilgilerinizi yazın):

```bash
git config --global user.name "Adınız Soyadınız"
git config --global user.email "github@eposta.com"
```

E‑posta, GitHub hesabınızdaki e‑posta ile aynı olabilir (gizlilik ayarlarına göre).

## 4. Bu komutları sırayla çalıştırın

GitHub kullanıcı adınız **Ens55knt1** ve repo adı **orbihtiyac** ise:

```bash
git init
git add .
git commit -m "Initial commit - Orbisis backend ve frontend"
git branch -M main
git remote add origin https://github.com/Ens55knt1/orbihtiyac.git
git push -u origin main
```

- GitHub kullanıcı adınız farklıysa `Ens55knt1` yerine kendi kullanıcı adınızı yazın.
- Repo adı farklıysa `orbihtiyac` yerine onu yazın.
- `git push` sırasında GitHub kullanıcı adı ve şifre (veya Personal Access Token) istenebilir; girin.

## 5. Push’tan sonra Render’da

Render sayfasına dönün ve **"Manual Deploy"** → **"Deploy latest commit"** (veya **"Clear build cache & deploy"**) tıklayın. Repo artık dolu olduğu için deploy başlayacaktır.
