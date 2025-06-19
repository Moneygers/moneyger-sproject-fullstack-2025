# ParkManager Backend - Complete Setup Guide

A comprehensive Django REST Framework backend for parking management system with real-time updates, role-based authentication, and complete API documentation.

## 🚀 Quick Start (Automated Setup)

### For Windows:
\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd parkmanager-backend

# Run the automated setup
setup.bat
\`\`\`

### For macOS/Linux:
\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd parkmanager-backend

# Make setup script executable and run
chmod +x setup.sh
./setup.sh
\`\`\`

## 📋 Manual Setup Instructions

### Prerequisites

- **Python 3.8+** (Download from [python.org](https://python.org))
- **Git** (Download from [git-scm.com](https://git-scm.com))
- **Redis** (Optional - for WebSocket support)
  - Windows: Download from [redis.io](https://redis.io/download)
  - macOS: `brew install redis`
  - Linux: `sudo apt-get install redis-server`

### Step 1: Clone and Navigate
\`\`\`bash
git clone <your-repo-url>
cd parkmanager-backend
\`\`\`

### Step 2: Create Virtual Environment
\`\`\`bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
\`\`\`

### Step 3: Install Dependencies
\`\`\`bash
# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
\`\`\`

### Step 4: Environment Configuration
\`\`\`bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings (optional for local development)
\`\`\`

### Step 5: Database Setup
\`\`\`bash
# Create app migrations
python manage.py makemigrations accounts
python manage.py makemigrations parking
python manage.py makemigrations reservations
python manage.py makemigrations transactions

# Apply migrations
python manage.py migrate
\`\`\`

### Step 6: Initialize System Data
\`\`\`bash
# Method 1: Django management command (recommended)
python manage.py setup_parking

# Method 2: Setup script
python scripts/setup_all.py
\`\`\`

### Step 7: Start the Server
\`\`\`bash
python manage.py runserver
\`\`\`

## 🎯 Access Points

After setup, access these URLs:

- **API Base**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/swagger/
- **Alternative Docs**: http://localhost:8000/redoc/

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Clerk | clerk1 | clerk123 |
| Customer | customer1 | customer123 |

**⚠️ Change these passwords in production!**

## 📊 System Overview

### Database Schema
- **240 Parking Slots** (4 floors × 3 sections × 20 slots)
- **3 User Roles** (Admin, Clerk, Customer)
- **Multiple Payment Methods** (Cash, Card, GCash)
- **Real-time Updates** via WebSocket

### API Endpoints Structure
\`\`\`
/api/auth/          # Authentication endpoints
/api/parking/       # Parking slot management
/api/reservations/  # Reservation system
/api/transactions/  # Payment processing
/api/reports/       # Analytics and reports
\`\`\`

## 🛠️ Development Tools

### Code Quality
\`\`\`bash
# Format code
black .

# Lint code
flake8 .

# Sort imports
isort .
\`\`\`

### Testing
\`\`\`bash
# Run tests
pytest

# Run with coverage
pytest --cov=.
\`\`\`

### Database Management
\`\`\`bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Reset database (development only)
python manage.py flush
\`\`\`

## 🔧 Configuration Options

### Environment Variables (.env)
\`\`\`env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite default, PostgreSQL optional)
DATABASE_URL=sqlite:///db.sqlite3
# DATABASE_URL=postgresql://user:password@localhost:5432/parkmanager

# Redis (for WebSocket and caching)
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
\`\`\`

### Production Settings
For production deployment, update:
- Set `DEBUG=False`
- Use PostgreSQL database
- Configure proper `SECRET_KEY`
- Set up Redis for caching
- Configure email backend
- Set up proper `ALLOWED_HOSTS`

## 📱 API Usage Examples

### Authentication
\`\`\`bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Register (public)
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "email": "user@example.com", "password": "password123", "password_confirm": "password123"}'
\`\`\`

### Parking Management
\`\`\`bash
# Get all parking slots (public)
curl http://localhost:8000/api/parking/slots/public_availability/

# Get availability summary (public)
curl http://localhost:8000/api/parking/slots/availability_summary/

# Allocate slot (requires staff authentication)
curl -X POST http://localhost:8000/api/parking/slots/1/allocate/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"license_plate": "ABC-123", "customer_name": "John Doe", "phone_number": "+1234567890"}'
\`\`\`

### Reservations
\`\`\`bash
# Create reservation (public)
curl -X POST http://localhost:8000/api/reservations/ \
  -H "Content-Type: application/json" \
  -d '{"slot": 1, "customer_name": "Jane Doe", "phone_number": "+1234567890", "license_plate": "XYZ-789", "reserved_date": "2024-01-15", "reserved_time": "10:00:00", "duration_hours": 2}'

# Approve reservation (staff only)
curl -X POST http://localhost:8000/api/reservations/1/approve/ \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## 🚨 Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Ensure virtual environment is activated
2. **Database errors**: Run migrations with `python manage.py migrate`
3. **Permission denied**: Check user roles and authentication
4. **Port already in use**: Use different port with `python manage.py runserver 8001`

### Reset Everything
\`\`\`bash
# Delete database and start fresh
rm db.sqlite3
python manage.py migrate
python manage.py setup_parking
\`\`\`

### Check System Status
\`\`\`bash
# Test API endpoints
python test_api.py

# Check database
python manage.py shell -c "from parking.models import ParkingSlot; print(f'Slots: {ParkingSlot.objects.count()}')"
\`\`\`

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `/swagger/`
3. Check Django logs in `logs/django.log`
4. Open an issue in the repository

## 🔄 Updates and Maintenance

### Backup Database
\`\`\`bash
# SQLite backup
cp db.sqlite3 backup_$(date +%Y%m%d).sqlite3

# PostgreSQL backup
pg_dump parkmanager > backup_$(date +%Y%m%d).sql
\`\`\`

### Update Dependencies
\`\`\`bash
pip install --upgrade -r requirements.txt
python manage.py migrate
\`\`\`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
