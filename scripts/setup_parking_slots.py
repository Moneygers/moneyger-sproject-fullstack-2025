"""
Script to initialize parking slots in the database
Creates 4 floors with 3 sections each, containing various slot types
"""

import os
import sys
import django

# Add the parent directory to Python path so we can import the Django project
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parkmanager.settings')
django.setup()

from parking.models import ParkingSlot, ParkingRate

def create_parking_slots():
    """Create parking slots for all floors and sections"""
    
    print("Creating parking slots...")
    
    # Define slot configuration
    floors = [1, 2, 3, 4]
    sections = ['A', 'B', 'C']
    slots_per_section = 20
    
    # Slot type distribution
    slot_types = {
        'regular': 0.7,  # 70% regular slots
        'vip': 0.2,      # 20% VIP slots
        'disabled': 0.1  # 10% disabled access slots
    }
    
    total_created = 0
    
    for floor in floors:
        for section in sections:
            for slot_num in range(1, slots_per_section + 1):
                # Determine slot type based on distribution
                if slot_num <= slots_per_section * slot_types['disabled']:
                    slot_type = 'disabled'
                elif slot_num <= slots_per_section * (slot_types['disabled'] + slot_types['vip']):
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
                    print(f"Created slot: Floor {floor}-{section}{slot_num:02d} ({slot_type})")
    
    print(f"\nTotal slots created: {total_created}")
    print(f"Total slots in system: {ParkingSlot.objects.count()}")

def create_parking_rates():
    """Create default parking rates"""
    
    print("\nSetting up parking rates...")
    
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
            print(f"Created rate: {rate}")
        else:
            print(f"Rate already exists: {rate}")

if __name__ == '__main__':
    try:
        create_parking_slots()
        create_parking_rates()
        print("\nParking system setup completed!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
