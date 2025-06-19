"""
Complete setup script that runs all initialization tasks
"""

import os
import sys
import django

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parkmanager.settings')
django.setup()

from django.contrib.auth import get_user_model
from parking.models import ParkingSlot, ParkingRate

User = get_user_model()

def setup_users():
    """Create all user accounts"""
    print("👤 Setting up users...")
    
    users = [
        {
            'username': 'admin',
            'email': 'admin@parkmanager.com',
            'password': 'admin123',
            'first_name': 'System',
            'last_name': 'Administrator',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        },
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
    
    for user_data in users:
        password = user_data.pop('password')
        username = user_data['username']
        
        if not User.objects.filter(username=username).exists():
            if user_data.get('is_superuser'):
                user = User.objects.create_superuser(**user_data)
            else:
                user = User.objects.create_user(**user_data)
            user.set_password(password)
            user.save()
            print(f"✅ Created user: {username}")
        else:
            print(f"ℹ️ User already exists: {username}")

def setup_parking_slots():
    """Create parking slots"""
    print("\n🅿️ Setting up parking slots...")
    
    floors = [1, 2, 3, 4]
    sections = ['A', 'B', 'C']
    slots_per_section = 20
    total_created = 0
    
    for floor in floors:
        for section in sections:
            for slot_num in range(1, slots_per_section + 1):
                # Determine slot type
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
    
    print(f"✅ Created {total_created} parking slots")
    print(f"📊 Total slots in system: {ParkingSlot.objects.count()}")

def setup_parking_rates():
    """Create parking rates"""
    print("\n💰 Setting up parking rates...")
    
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
    """Run complete setup"""
    print("🚀 ParkManager Complete Setup")
    print("=" * 40)
    
    try:
        setup_users()
        setup_parking_slots()
        setup_parking_rates()
        
        print("\n" + "=" * 40)
        print("🎉 Setup completed successfully!")
        print("\n📋 Login Credentials:")
        print("  Admin: admin / admin123")
        print("  Clerk: clerk1 / clerk123")
        print("  Customer: customer1 / customer123")
        print("\n🌐 URLs:")
        print("  Admin Panel: http://localhost:8000/admin/")
        print("  API Docs: http://localhost:8000/swagger/")
        print("  API Base: http://localhost:8000/api/")
        print("\n🚀 Start server: python manage.py runserver")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
