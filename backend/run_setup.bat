@echo off
echo 🚀 Setting up ParkManager Backend...

REM Create directories
echo 📁 Creating directories...
mkdir static 2>nul
mkdir staticfiles 2>nul
mkdir media 2>nul
mkdir logs 2>nul
mkdir templates 2>nul

REM Create app migrations
echo 🗄️ Creating app migrations...
python manage.py makemigrations accounts
python manage.py makemigrations parking
python manage.py makemigrations reservations
python manage.py makemigrations transactions

REM Apply migrations
echo ⚡ Applying migrations...
python manage.py migrate

REM Setup initial data
echo 🔧 Setting up initial data...
python management_commands.py

echo ✅ Setup completed!
echo.
echo 🎉 ParkManager Backend is ready!
echo.
echo To start the server:
echo   python manage.py runserver
echo.
echo Admin Panel: http://localhost:8000/admin/
echo API Docs: http://localhost:8000/swagger/
echo.
pause
