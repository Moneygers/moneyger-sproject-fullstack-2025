#!/bin/bash

# Quick start script for development
echo "🚀 Starting ParkManager Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if database exists
if [ ! -f "db.sqlite3" ]; then
    echo "🗄️ Database not found. Running setup..."
    python manage.py migrate
    python manage.py setup_parking
fi

# Start the server
echo "🌐 Starting Django development server..."
python manage.py runserver
