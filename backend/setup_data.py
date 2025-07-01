"""
Setup script for ParkManager system
Run this after migrations to initialize the system
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parkmanager.settings')
django.setup()

from django.contrib.auth import get_user_model
from parking.models import ParkingSlot, ParkingRate

User = get_user_model()

def create_superuser():
    """Create admin superuser if it doesn't exist"""
    print("👤 Creating admin user...")
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@parkmanager.com',
            password='admin123',
            first_name='System',
            last_name='Administrator',
            role='admin'
        )
        print("✅ Admin user created (username: admin, password: admin123)")
    else:
        print("ℹ️ Admin user already exists")

def create_sample_users():
    """Create sample clerk and customer users"""
    print("👥 Creating sample users...")
    users_to_create = [
        {
            'username': 'clerk1',
            'email': 'clerk1@parkmanager.com',
            'password': 'clerk123',
            'first_name': 'John',
            'last_name': 'Clerk',
            'role': 'clerk'
        },
        {
            'username': 'customer1',
            'email': 'customer1@example.com',
            'password': 'customer123',
            'first_name': 'Jane',
            'last_name': 'Customer',
            'role': 'customer'
        }
    ]
    
    for user_data in users_to_create:
        if not User.objects.filter(username=user_data['username']).exists():
            User.objects.create_user(**user_data)
            print(f"✅ Created user: {user_data['username']}")
        else:
            print(f"ℹ️ User {user_data['username']} already exists")

def create_parking_slots():
    """Create parking slots for all floors and sections"""
    print("🅿️ Creating parking slots...")
    
    floors = [1, 2, 3, 4]
    sections = ['A', 'B', 'C']
    slots_per_section = 20
    
    total_created = 0
    
    for floor in floors:
        for section in sections:
            for slot_num in range(1, slots_per_section + 1):
                # Determine slot type based on slot number
                if slot_num <= 2:
                    slot_type = 'disabled'
                elif slot_num <= 5:
                    slot_type = 'vip'
                else:
                    slot_type = 'regular'
                
                # Create slot if it doesn't exist
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
    
    print(f"✅ Created {total_created} parking slots")
    print(f"📊 Total slots in system: {ParkingSlot.objects.count()}")

def create_parking_rates():
    """Create default parking rates"""
    print("💰 Setting up parking rates...")
    
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
            print(f"✅ Created rate: {rate}")
        else:
            print(f"ℹ️ Rate already exists: {rate}")

def main():
    """Run all setup functions"""
    print("🚀 Setting up ParkManager system...")
    print("=" * 50)
    
    try:
        create_superuser()
        create_sample_users()
        create_parking_slots()
        create_parking_rates()
        
        print("=" * 50)
        print("🎉 ParkManager setup completed successfully!")
        print("")
        print("📋 Login Credentials:")
        print("  Admin: admin / admin123")
        print("  Clerk: clerk1 / clerk123")
        print("  Customer: customer1 / customer123")
        print("")
        print("🌐 API Endpoints:")
        print("  Base URL: http://localhost:8000/api/")
        print("  Admin Panel: http://localhost:8000/admin/")
        print("  API Docs: http://localhost:8000/swagger/")
        print("")
        print("🚀 Start the server with: python manage.py runserver")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
