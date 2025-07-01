"""
Django management command to set up parking system
Usage: python manage.py setup_parking
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from parking.models import ParkingSlot, ParkingRate

User = get_user_model()

class Command(BaseCommand):
    help = 'Set up the parking management system with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-users',
            action='store_true',
            help='Skip user creation',
        )
        parser.add_argument(
            '--skip-slots',
            action='store_true',
            help='Skip parking slot creation',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Setting up ParkManager system...')
        )

        if not options['skip_users']:
            self.create_users()
        
        if not options['skip_slots']:
            self.create_parking_slots()
            self.create_parking_rates()

        self.stdout.write(
            self.style.SUCCESS('🎉 Setup completed successfully!')
        )
        self.stdout.write('📋 Login Credentials:')
        self.stdout.write('  Admin: admin / admin123')
        self.stdout.write('  Clerk: clerk1 / clerk123')
        self.stdout.write('  Customer: customer1 / customer123')

    def create_users(self):
        """Create user accounts"""
        self.stdout.write('👤 Creating users...')
        
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
                self.stdout.write(f'✅ Created user: {username}')
            else:
                self.stdout.write(f'ℹ️ User already exists: {username}')

    def create_parking_slots(self):
        """Create parking slots"""
        self.stdout.write('🅿️ Creating parking slots...')
        
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
        
        self.stdout.write(f'✅ Created {total_created} parking slots')
        self.stdout.write(f'📊 Total slots: {ParkingSlot.objects.count()}')

    def create_parking_rates(self):
        """Create parking rates"""
        self.stdout.write('💰 Setting up parking rates...')
        
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
                self.stdout.write(f'✅ Created rate: {rate}')
            else:
                self.stdout.write(f'ℹ️ Rate already exists: {rate}')
