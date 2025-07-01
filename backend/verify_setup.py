"""
Script to verify that the ParkManager backend is properly set up
Run this after setup to ensure everything is working correctly
"""

import os
import sys
import requests
import json
from datetime import datetime

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def check_django_setup():
    """Check if Django is properly set up"""
    print_info("Checking Django setup...")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parkmanager.settings')
        import django
        django.setup()
        
        from django.contrib.auth import get_user_model
        from parking.models import ParkingSlot, ParkingRate
        from reservations.models import Reservation
        from transactions.models import Transaction
        
        User = get_user_model()
        
        # Check users
        admin_count = User.objects.filter(role='admin').count()
        clerk_count = User.objects.filter(role='clerk').count()
        customer_count = User.objects.filter(role='customer').count()
        
        print_success(f"Users created - Admin: {admin_count}, Clerk: {clerk_count}, Customer: {customer_count}")
        
        # Check parking slots
        slot_count = ParkingSlot.objects.count()
        available_slots = ParkingSlot.objects.filter(status='available').count()
        
        print_success(f"Parking slots created - Total: {slot_count}, Available: {available_slots}")
        
        # Check parking rates
        rate_count = ParkingRate.objects.count()
        print_success(f"Parking rates configured: {rate_count}")
        
        return True
        
    except Exception as e:
        print_error(f"Django setup check failed: {e}")
        return False

def check_server_running():
    """Check if the Django server is running"""
    print_info("Checking if server is running...")
    
    try:
        response = requests.get('http://localhost:8000/api/', timeout=5)
        if response.status_code == 200:
            print_success("Server is running and responding")
            return True
        else:
            print_warning(f"Server responded with status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_warning("Server is not running. Start it with: python manage.py runserver")
        return False
    except Exception as e:
        print_error(f"Error checking server: {e}")
        return False

def test_api_endpoints():
    """Test key API endpoints"""
    print_info("Testing API endpoints...")
    
    base_url = 'http://localhost:8000/api'
    
    # Test public endpoints
    endpoints_to_test = [
        ('GET', '/parking/slots/public_availability/', 'Public parking availability'),
        ('GET', '/parking/slots/availability_summary/', 'Parking availability summary'),
    ]
    
    for method, endpoint, description in endpoints_to_test:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print_success(f"{description} - Working")
                else:
                    print_warning(f"{description} - Response format unexpected")
            else:
                print_error(f"{description} - Status code: {response.status_code}")
                
        except Exception as e:
            print_error(f"{description} - Error: {e}")

def test_authentication():
    """Test authentication system"""
    print_info("Testing authentication...")
    
    try:
        # Test login
        login_url = 'http://localhost:8000/api/auth/login/'
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        response = requests.post(login_url, json=login_data, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'tokens' in data.get('data', {}):
                print_success("Authentication system working")
                return data['data']['tokens']['access']
            else:
                print_error("Authentication response format unexpected")
        else:
            print_error(f"Authentication failed - Status code: {response.status_code}")
            
    except Exception as e:
        print_error(f"Authentication test failed: {e}")
    
    return None

def test_protected_endpoints(token):
    """Test protected endpoints with authentication"""
    if not token:
        print_warning("Skipping protected endpoint tests - no auth token")
        return
    
    print_info("Testing protected endpoints...")
    
    headers = {'Authorization': f'Bearer {token}'}
    base_url = 'http://localhost:8000/api'
    
    protected_endpoints = [
        ('GET', '/parking/slots/', 'Parking slots management'),
        ('GET', '/reservations/', 'Reservations management'),
        ('GET', '/transactions/', 'Transactions management'),
    ]
    
    for method, endpoint, description in protected_endpoints:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                print_success(f"{description} - Working")
            elif response.status_code == 401:
                print_error(f"{description} - Authentication failed")
            else:
                print_warning(f"{description} - Status code: {response.status_code}")
                
        except Exception as e:
            print_error(f"{description} - Error: {e}")

def check_admin_panel():
    """Check if admin panel is accessible"""
    print_info("Checking admin panel...")
    
    try:
        response = requests.get('http://localhost:8000/admin/', timeout=5)
        if response.status_code == 200:
            print_success("Admin panel is accessible")
        else:
            print_error(f"Admin panel returned status code: {response.status_code}")
    except Exception as e:
        print_error(f"Admin panel check failed: {e}")

def check_api_documentation():
    """Check if API documentation is accessible"""
    print_info("Checking API documentation...")
    
    docs_endpoints = [
        ('http://localhost:8000/swagger/', 'Swagger documentation'),
        ('http://localhost:8000/redoc/', 'ReDoc documentation'),
    ]
    
    for url, description in docs_endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print_success(f"{description} is accessible")
            else:
                print_warning(f"{description} returned status code: {response.status_code}")
        except Exception as e:
            print_error(f"{description} check failed: {e}")

def main():
    """Run all verification checks"""
    print(f"{Colors.BOLD}🔍 ParkManager Backend Verification{Colors.END}")
    print("=" * 40)
    print()
    
    # Check Django setup
    django_ok = check_django_setup()
    print()
    
    # Check if server is running
    server_running = check_server_running()
    print()
    
    if server_running:
        # Test API endpoints
        test_api_endpoints()
        print()
        
        # Test authentication
        token = test_authentication()
        print()
        
        # Test protected endpoints
        test_protected_endpoints(token)
        print()
        
        # Check admin panel
        check_admin_panel()
        print()
        
        # Check API documentation
        check_api_documentation()
        print()
    
    # Summary
    print("=" * 40)
    if django_ok and server_running:
        print_success("🎉 ParkManager backend is properly set up and running!")
        print()
        print(f"{Colors.BOLD}📋 Quick Access Links:{Colors.END}")
        print("   API Base: http://localhost:8000/api/")
        print("   Admin Panel: http://localhost:8000/admin/")
        print("   API Docs: http://localhost:8000/swagger/")
        print()
        print(f"{Colors.BOLD}🔐 Default Credentials:{Colors.END}")
        print("   Admin: admin / admin123")
        print("   Clerk: clerk1 / clerk123")
        print("   Customer: customer1 / customer123")
    else:
        print_error("❌ Setup verification failed. Please check the errors above.")
        if not server_running:
            print_info("Start the server with: python manage.py runserver")

if __name__ == '__main__':
    main()
