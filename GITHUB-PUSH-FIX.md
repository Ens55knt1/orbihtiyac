# Büyük dosya hatası – Push’ı düzeltme

GitHub 100 MB limiti aştığı için push reddedildi. Derleme çıktıları (`.exe`, `bin/`, `target/` vb.) repoya eklenmemeli; `.gitignore` güncellendi. Aşağıdakileri **proje klasöründe** (`C:\Users\MENES\Desktop\UTKU`) sırayla çalıştırın.

## 1. Son commit’teki büyük/derleme dosyalarını Git’ten çıkar

(Bilgisayarınızdan silinmez, sadece takipten çıkar.)

```bash
git rm -r --cached "dotnet-app/OrbisisIhtiyac.Wpf/bin" 2>nul
git rm -r --cached "dotnet-app/OrbisisIhtiyac.Wpf/obj" 2>nul
git rm -r --cached "java-app/target" 2>nul
git rm -r --cached "Java-app/target" 2>nul
git rm -r --cached "frontend/.vite" 2>nul
```

(Bir satırda `2>nul` yoksa, “fatal: pathspec ... did not match any files” uyarısı çıkabilir; önemli değil, diğer satırlara geçin.)

## 2. .gitignore ve güncel durumu ekleyip son commit’i düzelt

```bash
git add .gitignore
git add .
git commit --amend -m "Initial commit"
```

## 3. GitHub’a tekrar push et

```bash
git push -u origin main
```

Şifre/token istenirse girin. Bu sefer push tamamlanmalı; ardından Render’da **Manual Deploy** yapabilirsiniz.
