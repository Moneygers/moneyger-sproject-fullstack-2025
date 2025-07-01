#!/bin/bash

echo "🔧 Fixing Django setup and creating missing directories..."

# Create missing directories
echo "📁 Creating required directories..."
mkdir -p static
mkdir -p staticfiles
mkdir -p media
mkdir -p logs
mkdir -p templates

echo "✅ Directories created successfully!"

# Create app-specific migrations
echo "🗄️ Creating app migrations..."
python manage.py makemigrations accounts
python manage.py makemigrations parking
python manage.py makemigrations reservations
python manage.py makemigrations transactions
python manage.py makemigrations reports

# Apply the new migrations
echo "⚡ Applying migrations..."
python manage.py migrate

echo "✅ Setup completed!"
