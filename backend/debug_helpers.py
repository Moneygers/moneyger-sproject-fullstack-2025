"""
Helper functions to understand what's happening in the system
Use these to debug and learn how components interact
"""

import json
from django.conf import settings
from django.urls import get_resolver
from django.apps import apps

def show_url_patterns():
    """
    Display all URL patterns in the system
    Shows how requests are routed
    """
    print("🌐 URL Patterns in the System:")
    print("=" * 50)
    
    resolver = get_resolver()
    
    def print_patterns(patterns, prefix=""):
        for pattern in patterns:
            if hasattr(pattern, 'url_patterns'):
                # This is an include() - go deeper
                print(f"{prefix}{pattern.pattern} -> INCLUDE")
                print_patterns(pattern.url_patterns, prefix + "  ")
            else:
                # This is an actual endpoint
                view_name = getattr(pattern.callback, '__name__', 'Unknown')
                print(f"{prefix}{pattern.pattern} -> {view_name}")
    
    print_patterns(resolver.url_patterns)

def show_installed_apps():
    """
    Show all installed apps and their models
    """
    print("📱 Installed Apps and Models:")
    print("=" * 50)
    
    for app_config in apps.get_app_configs():
        print(f"\n{app_config.name}:")
        models = app_config.get_models()
        if models:
            for model in models:
                field_names = [f.name for f in model._meta.fields]
                print(f"  - {model.__name__}: {', '.join(field_names[:5])}...")
        else:
            print("  - No models")

def show_middleware_stack():
    """
    Display the middleware stack and explain what each does
    """
    print("🔧 Middleware Stack (Order Matters!):")
    print("=" * 50)
    
    middleware_descriptions = {
        'corsheaders.middleware.CorsMiddleware': 'Handles Cross-Origin Resource Sharing',
        'django.middleware.security.SecurityMiddleware': 'Adds security headers',
        'whitenoise.middleware.WhiteNoiseMiddleware': 'Serves static files',
        'django.contrib.sessions.middleware.SessionMiddleware': 'Manages user sessions',
        'django.middleware.common.CommonMiddleware': 'Common functionality',
        'django.middleware.csrf.CsrfViewMiddleware': 'CSRF protection',
        'django.contrib.auth.middleware.AuthenticationMiddleware': 'User authentication',
        'django.contrib.messages.middleware.MessageMiddleware': 'Message framework',
        'django.middleware.clickjacking.XFrameOptionsMiddleware': 'Clickjacking protection',
    }
    
    for i, middleware in enumerate(settings.MIDDLEWARE, 1):
        description = middleware_descriptions.get(middleware, 'Custom middleware')
        print(f"{i}. {middleware}")
        print(f"   → {description}")

def show_database_schema():
    """
    Show the database schema and relationships
    """
    print("🗄️ Database Schema:")
    print("=" * 50)
    
    from accounts.models import User
    from parking.models import ParkingSlot, Allocation, ParkingRate
    from reservations.models import Reservation
    from transactions.models import Transaction
    
    models_to_analyze = [User, ParkingSlot, Allocation, ParkingRate, Reservation, Transaction]
    
    for model in models_to_analyze:
        print(f"\n{model.__name__}:")
        
        # Show fields
        for field in model._meta.fields:
            field_type = field.__class__.__name__
            
            if hasattr(field, 'related_model') and field.related_model:
                print(f"  - {field.name}: {field_type} -> {field.related_model.__name__}")
            else:
                print(f"  - {field.name}: {field_type}")
        
        # Show reverse relationships
        for rel in model._meta.related_objects:
            print(f"  ← {rel.related_name or rel.name}: {rel.related_model.__name__}")

def trace_request_path(url_path):
    """
    Trace how a specific URL would be processed
    """
    print(f"🔍 Tracing Request Path: {url_path}")
    print("=" * 50)
    
    from django.urls import resolve
    from django.urls.exceptions import Resolver404
    
    try:
        match = resolve(url_path)
        
        print(f"1. URL Pattern Matched: {match.url_name}")
        print(f"2. View Function: {match.func}")
        print(f"3. View Arguments: {match.args}")
        print(f"4. View Keyword Arguments: {match.kwargs}")
        print(f"5. App Name: {match.app_name}")
        print(f"6. Namespace: {match.namespace}")
        
        # Try to get the view class if it's a class-based view
        if hasattr(match.func, 'view_class'):
            view_class = match.func.view_class
            print(f"7. View Class: {view_class}")
            print(f"8. View Methods: {[m for m in dir(view_class) if not m.startswith('_')]}")
        
    except Resolver404:
        print(f"❌ URL pattern not found for: {url_path}")

def show_serializer_fields(serializer_class):
    """
    Show what fields a serializer handles
    """
    print(f"📝 Serializer Fields: {serializer_class.__name__}")
    print("=" * 50)
    
    serializer = serializer_class()
    
    for field_name, field in serializer.fields.items():
        field_type = field.__class__.__name__
        
        # Check if it's read-only
        read_only = getattr(field, 'read_only', False)
        write_only = getattr(field, 'write_only', False)
        required = getattr(field, 'required', True)
        
        flags = []
        if read_only:
            flags.append('READ-ONLY')
        if write_only:
            flags.append('WRITE-ONLY')
        if not required:
            flags.append('OPTIONAL')
        
        flag_str = f" [{', '.join(flags)}]" if flags else ""
        print(f"  - {field_name}: {field_type}{flag_str}")

def show_model_relationships(model_class):
    """
    Show all relationships for a specific model
    """
    print(f"🔗 Model Relationships: {model_class.__name__}")
    print("=" * 50)
    
    print("Forward Relationships (this model points to others):")
    for field in model_class._meta.fields:
        if hasattr(field, 'related_model') and field.related_model:
            relationship_type = field.__class__.__name__
            print(f"  - {field.name}: {relationship_type} -> {field.related_model.__name__}")
    
    print("\nReverse Relationships (other models point to this):")
    for rel in model_class._meta.related_objects:
        relationship_type = rel.__class__.__name__
        accessor_name = rel.related_name or f"{rel.related_model.__name__.lower()}_set"
        print(f"  - {accessor_name}: {relationship_type} <- {rel.related_model.__name__}")

def show_permissions_hierarchy():
    """
    Show the permission system hierarchy
    """
    print("🔐 Permission System Hierarchy:")
    print("=" * 50)
    
    from accounts.permissions import IsAdminUser, IsStaffUser, IsCustomerUser
    
    print("Permission Classes:")
    print("  1. IsAdminUser")
    print("     - Can access all admin endpoints")
    print("     - Full system control")
    print("     - User management")
    print()
    print("  2. IsStaffUser (includes Admin + Clerk)")
    print("     - Parking slot management")
    print("     - Reservation processing")
    print("     - Transaction handling")
    print()
    print("  3. IsCustomerUser")
    print("     - Create reservations")
    print("     - View own data")
    print()
    print("  4. AllowAny (Public endpoints)")
    print("     - Registration")
    print("     - Public parking availability")
    print("     - Create reservations")

# Usage examples
if __name__ == "__main__":
    print("🔧 Django Backend Debug Helpers")
    print("=" * 60)
    
    # Uncomment the functions you want to run
    show_url_patterns()
    # show_installed_apps()
    # show_middleware_stack()
    # show_database_schema()
    # trace_request_path('/api/parking/slots/')
    # 
    # from parking.serializers import ParkingSlotSerializer
    # show_serializer_fields(ParkingSlotSerializer)
    # 
    # from parking.models import ParkingSlot
    # show_model_relationships(ParkingSlot)
    # 
    # show_permissions_hierarchy()
