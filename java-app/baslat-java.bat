@echo off
chcp 65001 >nul
title ORBİSİS İhtiyaç - Java Uygulaması
cd /d "%~dp0"

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo HATA: Java bulunamadı. JDK 17 veya üzeri yükleyin: https://adoptium.net
    echo.
    pause
    exit /b 1
)

if exist "target\ihitiac-1.0.0.jar" (
    echo Uygulama başlatılıyor...
    java -jar target\ihitiac-1.0.0.jar
    pause
    exit /b 0
)

echo JAR dosyası bulunamadı. Derleniyor...
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo Maven bulunamadı. İki seçeneğiniz var:
    echo.
    echo 1^) Maven yükleyin: https://maven.apache.org/download.cgi
    echo    Kurulum sonrası bu dosyayı tekrar çalıştırın.
    echo.
    echo 2^) IDE ile derleyin: Bu klasörü IntelliJ IDEA veya Eclipse ile
    echo    açın, pom.xml Maven projesi olarak tanınsın, "package" veya
    echo    "Run Main" yapın. Sonra target\ihitiac-1.0.0.jar oluşur
    echo    ve bu .bat ile çalıştırabilirsiniz.
    echo.
    pause
    exit /b 1
)

call mvn -q package -DskipTests
if %errorlevel% neq 0 (
    echo Derleme başarısız.
    pause
    exit /b 1
)

echo.
echo Uygulama başlatılıyor...
java -jar target\ihitiac-1.0.0.jar
pause
