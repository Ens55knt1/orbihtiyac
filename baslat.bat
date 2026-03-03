@echo off
chcp 65001 >nul
title ORBİSİS İhtiyaç - Başlatılıyor
echo.
echo ORBİSİS İhtiyaç uygulaması başlatılıyor...
echo.

cd /d "%~dp0"

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo HATA: npm bulunamadı. Lütfen Node.js yükleyin: https://nodejs.org
    pause
    exit /b 1
)

if not exist "backend\node_modules" (
    echo Backend bağımlılıkları yükleniyor...
    cd backend
    call npm install
    cd ..
    echo.
)

if not exist "frontend\node_modules" (
    echo Frontend bağımlılıkları yükleniyor...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo Backend sunucusu başlatılıyor (port 4000)...
start "ORBİSİS Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 2 /nobreak >nul

echo Frontend sunucusu başlatılıyor (port 5173)...
start "ORBİSİS Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Uygulama açıldı.
echo - Backend: http://localhost:4000
echo - Frontend: http://localhost:5173
echo.
echo Tarayıcıda http://localhost:5173 adresine gidin.
echo Bu pencereyi kapatabilirsiniz; sunucular ayrı pencerelerde çalışıyor.
echo.
pause
