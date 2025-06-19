
#!/bin/bash

# ParkManager Backend Installation Script

echo "🚀 Setting up ParkManager Backend..."

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv\Scripts\activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Install development dependencies (optional)
read -p "Install development dependencies? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pip install -r requirements-dev.txt
fi

# Create .env file
echo "⚙️ Creating environment configuration..."
cat > .env << EOL
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3
# For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost:5432/parkmanager

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key-here

# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-app-password

# Sentry Configuration (optional)
# SENTRY_DSN=your-sentry-dsn-here
EOL

# Run migrations
echo "🗄️ Setting up database..."
python manage.py makemigrations
python manage.py migrate

# Create parking slots
echo "🅿️ Setting up parking infrastructure..."
python scripts/setup_parking_slots.py

# Create admin user
echo "👤 Creating admin user..."
python scripts/create_admin_user.py

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Installation completed successfully!"
echo ""
echo "🎉 ParkManager Backend is ready!"
echo ""
echo "To start the development server:"
echo "  python manage.py runserver"
echo ""
echo "To start with WebSocket support:"
echo "  python manage.py runserver & celery -A parkmanager worker -l info"
echo ""
echo "Admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "API Documentation will be available at:"
echo "  http://localhost:8000/swagger/"
echo "  http://localhost:8000/redoc/"
