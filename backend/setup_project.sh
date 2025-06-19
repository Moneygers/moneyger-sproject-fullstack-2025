#!/bin/bash

echo "🚀 Setting up ParkManager Django Backend..."

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Copy environment file
echo "⚙️ Setting up environment..."
cp .env.example .env

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p media
mkdir -p static
mkdir -p staticfiles

# Run migrations
echo "🗄️ Setting up database..."
python manage.py makemigrations accounts
python manage.py makemigrations parking
python manage.py makemigrations reservations
python manage.py makemigrations transactions
python manage.py makemigrations reports
python manage.py migrate

# Create superuser
echo "👤 Creating superuser..."
echo "from accounts.models import User; User.objects.create_superuser('admin', 'admin@parkmanager.com', 'admin123', role='admin') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

# Setup parking infrastructure
echo "🅿️ Setting up parking slots..."
python manage.py shell -c "
from parking.models import ParkingSlot, ParkingRate
import sys

# Create parking slots
floors = [1, 2, 3, 4]
sections = ['A', 'B', 'C']
slots_per_section = 20

total_created = 0
for floor in floors:
    for section in sections:
        for slot_num in range(1, slots_per_section + 1):
            if slot_num <= 2:
                slot_type = 'disabled'
            elif slot_num <= 5:
                slot_type = 'vip'
            else:
                slot_type = 'regular'
            
            slot, created = ParkingSlot.objects.get_or_create(
                floor=floor,
                section=section,
                slot_number=slot_num,
                defaults={
                    'slot_type': slot_type,
                    'status': 'available'
                }
            )
            if created:
                total_created += 1

print(f'Created {total_created} parking slots')

# Create parking rates
rates = [
    {'slot_type': 'regular', 'hourly_rate': 50.00, 'max_hours': 24},
    {'slot_type': 'vip', 'hourly_rate': 100.00, 'max_hours': 24},
    {'slot_type': 'disabled', 'hourly_rate': 30.00, 'max_hours': 24},
]

for rate_data in rates:
    rate, created = ParkingRate.objects.get_or_create(
        slot_type=rate_data['slot_type'],
        defaults={
            'hourly_rate': rate_data['hourly_rate'],
            'max_hours': rate_data['max_hours']
        }
    )
    if created:
        print(f'Created rate: {rate}')
"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Setup completed successfully!"
echo ""
echo "🎉 ParkManager Backend is ready!"
echo ""
echo "To start the development server:"
echo "  python manage.py runserver"
echo ""
echo "Admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "API Documentation:"
echo "  Swagger: http://localhost:8000/swagger/"
echo "  ReDoc: http://localhost:8000/redoc/"
echo ""
echo "Don't forget to:"
echo "  1. Update .env file with your settings"
echo "  2. Change admin password after first login"
echo "  3. Configure Redis for WebSocket support"
