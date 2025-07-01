@echo off
REM ParkManager Backend - Complete Setup Script for Windows
REM This script sets up the entire Django backend system

echo 🚀 ParkManager Backend Setup
echo ============================
echo.

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [SUCCESS] Python %PYTHON_VERSION% found

REM Check if pip is available
echo [INFO] Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not available
    echo Please ensure pip is installed with Python
    pause
    exit /b 1
)

REM Create virtual environment
echo [INFO] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo [SUCCESS] Virtual environment created
) else (
    echo [WARNING] Virtual environment already exists
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo [INFO] Installing Python dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt
    echo [SUCCESS] Dependencies installed
) else (
    echo [ERROR] requirements.txt not found
    pause
    exit /b 1
)

REM Create necessary directories
echo [INFO] Creating project directories...
if not exist "static" mkdir static
if not exist "staticfiles" mkdir staticfiles
if not exist "media" mkdir media
if not exist "logs" mkdir logs
if not exist "templates" mkdir templates
echo [SUCCESS] Directories created

REM Setup environment file
echo [INFO] Setting up environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [SUCCESS] Environment file created from template
    ) else (
        REM Create basic .env file
        (
            echo # Django Settings
            echo SECRET_KEY=django-insecure-change-me-in-production
            echo DEBUG=True
            echo ALLOWED_HOSTS=localhost,127.0.0.1
            echo.
            echo # Database Configuration
            echo DATABASE_URL=sqlite:///db.sqlite3
            echo.
            echo # Redis Configuration
            echo REDIS_URL=redis://localhost:6379/0
            echo.
            echo # JWT Settings
            echo JWT_SECRET_KEY=your-jwt-secret-key-here
            echo.
            echo # Email Configuration
            echo EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
        ) > .env
        echo [SUCCESS] Basic environment file created
    )
) else (
    echo [WARNING] Environment file already exists
)

REM Create app migrations
echo [INFO] Creating database migrations...
python manage.py makemigrations accounts
python manage.py makemigrations parking
python manage.py makemigrations reservations
python manage.py makemigrations transactions

REM Apply migrations
echo [INFO] Applying database migrations...
python manage.py migrate

REM Setup initial data
echo [INFO] Setting up initial system data...
python manage.py setup_parking

REM Collect static files
echo [INFO] Collecting static files...
python manage.py collectstatic --noinput

REM Create initial log file
echo. > logs\django.log

echo [SUCCESS] Setup completed successfully!
echo.
echo 🎉 ParkManager Backend is ready!
echo.
echo 📋 Default Login Credentials:
echo    Admin: admin / admin123
echo    Clerk: clerk1 / clerk123
echo    Customer: customer1 / customer123
echo.
echo 🌐 Access Points:
echo    API Base: http://localhost:8000/api/
echo    Admin Panel: http://localhost:8000/admin/
echo    API Documentation: http://localhost:8000/swagger/
echo.
echo 🚀 To start the server:
echo    venv\Scripts\activate.bat  ^& python manage.py runserver
echo.
echo 🧪 To test the API:
echo    python test_api.py
echo.
echo ⚠️  Remember to:
echo    1. Change default passwords in production
echo    2. Update .env file with your specific settings
echo    3. Install Redis for WebSocket support (optional)
echo.
pause
