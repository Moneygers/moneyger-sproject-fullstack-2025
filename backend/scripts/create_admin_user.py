"""
Script to create admin user for the parking management system
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

User = get_user_model()

def create_admin_user():
    """Create admin user if it doesn't exist"""
    
    admin_data = {
        'username': 'admin',
        'email': 'admin@parkmanager.com',
        'first_name': 'System',
        'last_name': 'Administrator',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True
    }
    
    if not User.objects.filter(username=admin_data['username']).exists():
        user = User.objects.create_user(**admin_data)
        user.set_password('admin123')  # Change this in production!
        user.save()
        
        print(f"Admin user created successfully!")
        print(f"Username: {admin_data['username']}")
        print(f"Password: admin123")
        print("Please change the password after first login!")
    else:
        print("Admin user already exists!")

def create_sample_staff():
    """Create sample clerk users"""
    
    staff_users = [
        {
            'username': 'clerk1',
            'email': 'clerk1@parkmanager.com',
            'first_name': 'John',
            'last_name': 'Clerk',
            'role': 'clerk',
            'password': 'clerk123'
        },
        {
            'username': 'clerk2',
            'email': 'clerk2@parkmanager.com',
            'first_name': 'Jane',
            'last_name': 'Staff',
            'role': 'clerk',
            'password': 'clerk123'
        }
    ]
    
    for staff_data in staff_users:
        password = staff_data.pop('password')
        
        if not User.objects.filter(username=staff_data['username']).exists():
            user = User.objects.create_user(**staff_data)
            user.set_password(password)
            user.save()
            
            print(f"Staff user created: {staff_data['username']}")
        else:
            print(f"Staff user already exists: {staff_data['username']}")

def create_sample_customer():
    """Create sample customer user"""
    
    customer_data = {
        'username': 'customer1',
        'email': 'customer1@example.com',
        'first_name': 'Jane',
        'last_name': 'Customer',
        'role': 'customer',
        'password': 'customer123'
    }
    
    password = customer_data.pop('password')
    
    if not User.objects.filter(username=customer_data['username']).exists():
        user = User.objects.create_user(**customer_data)
        user.set_password(password)
        user.save()
        
        print(f"Customer user created: {customer_data['username']}")
    else:
        print(f"Customer user already exists: {customer_data['username']}")

if __name__ == '__main__':
    try:
        create_admin_user()
        create_sample_staff()
        create_sample_customer()
        print("\nUser setup completed!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
