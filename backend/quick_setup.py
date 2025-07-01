"""
Quick setup using Django shell commands
Alternative method if the main setup script doesn't work
"""

setup_commands = """
# Import required modules
from django.contrib.auth import get_user_model
from parking.models import ParkingSlot, ParkingRate

User = get_user_model()

# Create admin user
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@parkmanager.com', 'admin123', role='admin', first_name='System', last_name='Administrator')
    print('✅ Admin user created')
else:
    print('ℹ️ Admin user already exists')

# Create clerk user
if not User.objects.filter(username='clerk1').exists():
    User.objects.create_user('clerk1', 'clerk1@parkmanager.com', 'clerk123', role='clerk', first_name='John', last_name='Clerk')
    print('✅ Clerk user created')
else:
    print('ℹ️ Clerk user already exists')

# Create customer user
if not User.objects.filter(username='customer1').exists():
    User.objects.create_user('customer1', 'customer1@example.com', 'customer123', role='customer', first_name='Jane', last_name='Customer')
    print('✅ Customer user created')
else:
    print('ℹ️ Customer user already exists')

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
                defaults={'slot_type': slot_type, 'status': 'available'}
            )
            if created:
                total_created += 1

print(f'✅ Created {total_created} parking slots')
print(f'📊 Total slots: {ParkingSlot.objects.count()}')

# Create parking rates
rates = [
    {'slot_type': 'regular', 'hourly_rate': 50.00, 'max_hours': 24},
    {'slot_type': 'vip', 'hourly_rate': 100.00, 'max_hours': 24},
    {'slot_type': 'disabled', 'hourly_rate': 30.00, 'max_hours': 24},
]

for rate_data in rates:
    rate, created = ParkingRate.objects.get_or_create(
        slot_type=rate_data['slot_type'],
        defaults={'hourly_rate': rate_data['hourly_rate'], 'max_hours': rate_data['max_hours']}
    )
    if created:
        print(f'✅ Created rate: {rate}')
    else:
        print(f'ℹ️ Rate exists: {rate}')

print('🎉 Setup completed!')
"""

if __name__ == '__main__':
    print("Copy and paste the following commands into Django shell:")
    print("Run: python manage.py shell")
    print("=" * 50)
    print(setup_commands)
