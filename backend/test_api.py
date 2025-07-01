"""
Simple script to test the API endpoints
Run this after starting the server to verify everything works
"""

import requests
import json

BASE_URL = 'http://localhost:8000/api'

def test_login():
    """Test user login"""
    print("🔐 Testing login...")
    
    response = requests.post(f'{BASE_URL}/auth/login/', json={
        'username': 'admin',
        'password': 'admin123'
    })
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Login successful!")
        return data['data']['tokens']['access']
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_parking_slots(token):
    """Test parking slots endpoint"""
    print("🅿️ Testing parking slots...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/parking/slots/', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Retrieved {len(data['data'])} parking slots")
    else:
        print(f"❌ Failed to get parking slots: {response.text}")

def test_public_availability():
    """Test public availability endpoint (no auth required)"""
    print("🌐 Testing public availability...")
    
    response = requests.get(f'{BASE_URL}/parking/slots/public_availability/')
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Public availability working - {len(data['data'])} slots")
    else:
        print(f"❌ Public availability failed: {response.text}")

def test_create_reservation():
    """Test creating a reservation (public endpoint)"""
    print("📝 Testing reservation creation...")
    
    # First get an available slot
    response = requests.get(f'{BASE_URL}/parking/slots/public_availability/')
    if response.status_code == 200:
        slots = response.json()['data']
        available_slots = [slot for slot in slots if slot['status'] == 'available']
        
        if available_slots:
            slot_id = available_slots[0]['id']
            
            reservation_data = {
                'slot': slot_id,
                'customer_name': 'Test Customer',
                'phone_number': '+1234567890',
                'email': 'test@example.com',
                'license_plate': 'ABC-123',
                'reserved_date': '2024-01-15',
                'reserved_time': '10:00:00',
                'duration_hours': 2
            }
            
            response = requests.post(f'{BASE_URL}/reservations/', json=reservation_data)
            
            if response.status_code == 201:
                print("✅ Reservation created successfully!")
            else:
                print(f"❌ Reservation creation failed: {response.text}")
        else:
            print("⚠️ No available slots for reservation test")

def main():
    """Run all API tests"""
    print("🧪 Testing ParkManager API...")
    print("=" * 50)
    
    # Test public endpoint first
    test_public_availability()
    
    # Test authentication
    token = test_login()
    
    if token:
        # Test authenticated endpoints
        test_parking_slots(token)
        
    # Test public reservation creation
    test_create_reservation()
    
    print("=" * 50)
    print("🎉 API testing completed!")

if __name__ == '__main__':
    main()
