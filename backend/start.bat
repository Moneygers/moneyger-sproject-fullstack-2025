@echo off
REM Quick start script for development

echo 🚀 Starting ParkManager Backend...

REM Check if virtual environment exists
if not exist "venv" (
    echo ❌ Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if database exists
if not exist "db.sqlite3" (
    echo 🗄️ Database not found. Running setup...
    python manage.py migrate
    python manage.py setup_parking
)

REM Start the server
echo 🌐 Starting Django development server...
python manage.py runserver
