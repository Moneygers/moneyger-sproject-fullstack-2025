#!/bin/bash

# ParkManager Backend - Complete Setup Script for macOS/Linux
# This script sets up the entire Django backend system

set -e  # Exit on any error

echo "🚀 ParkManager Backend Setup"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
print_status "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
print_success "Python $PYTHON_VERSION found"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not available. Please install pip3"
    exit 1
fi

# Create virtual environment
print_status "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_warning "Virtual environment already exists"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
print_status "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    print_success "Dependencies installed"
else
    print_error "requirements.txt not found"
    exit 1
fi

# Create necessary directories
print_status "Creating project directories..."
mkdir -p static staticfiles media logs templates
print_success "Directories created"

# Setup environment file
print_status "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Environment file created from template"
    else
        # Create basic .env file
        cat > .env << EOL
# Django Settings
SECRET_KEY=django-insecure-$(openssl rand -base64 32)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_SECRET_KEY=$(openssl rand -base64 32)

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EOL
        print_success "Basic environment file created"
    fi
else
    print_warning "Environment file already exists"
fi

# Create app migrations
print_status "Creating database migrations..."
python manage.py makemigrations accounts
python manage.py makemigrations parking
python manage.py makemigrations reservations
python manage.py makemigrations transactions

# Apply migrations
print_status "Applying database migrations..."
python manage.py migrate

# Setup initial data
print_status "Setting up initial system data..."
python manage.py setup_parking

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# Create logs directory and initial log file
touch logs/django.log

print_success "Setup completed successfully!"
echo ""
echo "🎉 ParkManager Backend is ready!"
echo ""
echo "📋 Default Login Credentials:"
echo "   Admin: admin / admin123"
echo "   Clerk: clerk1 / clerk123"
echo "   Customer: customer1 / customer123"
echo ""
echo "🌐 Access Points:"
echo "   API Base: http://localhost:8000/api/"
echo "   Admin Panel: http://localhost:8000/admin/"
echo "   API Documentation: http://localhost:8000/swagger/"
echo ""
echo "🚀 To start the server:"
echo "   source venv/bin/activate  # Activate virtual environment"
echo "   python manage.py runserver"
echo ""
echo "🧪 To test the API:"
echo "   python test_api.py"
echo ""
echo "⚠️  Remember to:"
echo "   1. Change default passwords in production"
echo "   2. Update .env file with your specific settings"
echo "   3. Install Redis for WebSocket support (optional)"
echo ""
