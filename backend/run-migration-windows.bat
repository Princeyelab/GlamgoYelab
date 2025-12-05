@echo off
REM Script d'execution de la migration 008 - Systeme de paiement
REM Pour Windows

echo.
echo ========================================
echo MIGRATION 008 - SYSTEME DE PAIEMENT
echo ========================================
echo.

REM Configurer les variables MySQL
set DB_HOST=mysql-db
set DB_NAME=glamgo
set DB_USER=glamgo_user
set DB_PASSWORD=glamgo_password

echo Execution de la migration SQL...
echo.

REM Essayer avec mysql.exe
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < database\migrations\008_add_payment_system.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo MIGRATION REUSSIE !
    echo ========================================
    echo.
    echo Prochaines etapes:
    echo 1. Tester frontend: http://localhost:3000/payment-demo
    echo 2. Dashboard admin: http://localhost:8080/admin/transactions.php
    echo.
) else (
    echo.
    echo ERREUR lors de l'execution de la migration
    echo Verifiez que MySQL est accessible
    echo.
)

pause
