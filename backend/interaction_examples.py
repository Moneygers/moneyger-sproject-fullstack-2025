"""
Practical examples showing how different files interact
Run these in Django shell: python manage.py shell
"""

# Example 1: How a complete request flows through the system
def example_slot_allocation():
    """
    Shows how files interact when allocating a parking slot
    """
    
    # 1. CLIENT REQUEST comes in
    # POST /api/parking/slots/1/allocate/
    # Body: {"license_plate": "ABC-123", "customer_name": "John Doe", "phone_number": "123-456-7890"}
    
    # 2. URLS.PY routing
    # parkmanager/urls.py -> path('api/parking/', include('parking.urls'))
    # parking/urls.py -> router.register(r'slots', ParkingSlotViewSet)
    # Creates endpoint: /slots/{id}/allocate/
    
    # 3. VIEW handles the request
    from parking.views import ParkingSlotViewSet
    from parking.models import ParkingSlot
    from parking.serializers import AllocationCreateSerializer
    
    # Get the slot (this is what happens in the view)
    slot = ParkingSlot.objects.get(id=1)
    print(f"Slot status before: {slot.status}")
    
    # 4. SERIALIZER validates data
    data = {
        "slot": slot.id,
        "license_plate": "ABC-123", 
        "customer_name": "John Doe",
        "phone_number": "123-456-7890"
    }
    
    # This is what happens inside the view
    serializer = AllocationCreateSerializer(data=data)
    if serializer.is_valid():
        # 5. MODEL operations happen in serializer.save()
        allocation = serializer.save()
        print(f"Allocation created: {allocation}")
        print(f"Slot status after: {slot.status}")
    else:
        print(f"Validation errors: {serializer.errors}")

# Example 2: Authentication flow
def example_authentication():
    """
    Shows how authentication works across files
    """
    
    # 1. User login request
    # POST /api/auth/login/
    # Body: {"username": "admin", "password": "admin123"}
    
    from accounts.serializers import LoginSerializer
    from accounts.models import User
    from rest_framework_simplejwt.tokens import RefreshToken
    
    # 2. SERIALIZER validates credentials
    login_data = {"username": "admin", "password": "admin123"}
    serializer = LoginSerializer(data=login_data)
    
    if serializer.is_valid():
        # 3. MODEL authentication (Django handles this)
        user = serializer.validated_data['user']
        print(f"Authenticated user: {user.username} ({user.role})")
        
        # 4. JWT token generation
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        print(f"Access token generated: {access_token[:50]}...")
        
        # 5. This token is used in subsequent requests
        # Header: Authorization: Bearer {access_token}
        
    else:
        print(f"Login failed: {serializer.errors}")

# Example 3: Permission checking
def example_permissions():
    """
    Shows how permissions work across the system
    """
    
    from accounts.models import User
    from accounts.permissions import IsStaffUser, IsAdminUser
    from django.http import HttpRequest
    
    # Get different types of users
    admin_user = User.objects.filter(role='admin').first()
    clerk_user = User.objects.filter(role='clerk').first()
    customer_user = User.objects.filter(role='customer').first()
    
    # Create mock request objects
    def create_mock_request(user):
        request = HttpRequest()
        request.user = user
        return request
    
    # Test permissions
    staff_permission = IsStaffUser()
    admin_permission = IsAdminUser()
    
    users_to_test = [
        ("Admin", admin_user),
        ("Clerk", clerk_user), 
        ("Customer", customer_user)
    ]
    
    for role, user in users_to_test:
        if user:
            request = create_mock_request(user)
            
            staff_access = staff_permission.has_permission(request, None)
            admin_access = admin_permission.has_permission(request, None)
            
            print(f"{role} user:")
            print(f"  - Can access staff endpoints: {staff_access}")
            print(f"  - Can access admin endpoints: {admin_access}")

# Example 4: Database relationships
def example_relationships():
    """
    Shows how models relate to each other
    """
    
    from parking.models import ParkingSlot, Allocation
    from reservations.models import Reservation
    from transactions.models import Transaction
    from accounts.models import User
    
    # Get a parking slot
    slot = ParkingSlot.objects.first()
    print(f"Slot: {slot}")
    
    # Check if it has an allocation (OneToOne relationship)
    try:
        allocation = slot.current_allocation
        print(f"Current allocation: {allocation}")
        print(f"  - License plate: {allocation.license_plate}")
        print(f"  - Duration: {allocation.duration_hours} hours")
    except Allocation.DoesNotExist:
        print("No current allocation")
    
    # Get reservations for this slot (ForeignKey relationship)
    reservations = Reservation.objects.filter(slot=slot)
    print(f"Reservations for this slot: {reservations.count()}")
    
    # Get transactions related to allocations (ForeignKey relationship)
    transactions = Transaction.objects.filter(allocation__slot=slot)
    print(f"Transactions for this slot: {transactions.count()}")
    
    # Show reverse relationships
    admin_user = User.objects.filter(role='admin').first()
    if admin_user:
        approved_reservations = admin_user.approved_reservations.all()
        print(f"Reservations approved by {admin_user.username}: {approved_reservations.count()}")

# Example 5: Serializer data transformation
def example_serializers():
    """
    Shows how serializers transform data
    """
    
    from parking.models import ParkingSlot
    from parking.serializers import ParkingSlotSerializer
    
    # Get a slot with related data
    slot = ParkingSlot.objects.select_related('current_allocation').first()
    
    # Serialize to JSON-like format
    serializer = ParkingSlotSerializer(slot)
    data = serializer.data
    
    print("Raw model data:")
    print(f"  - ID: {slot.id}")
    print(f"  - Floor: {slot.floor}")
    print(f"  - Section: {slot.section}")
    print(f"  - Status: {slot.status}")
    
    print("\nSerialized data (what API returns):")
    for key, value in data.items():
        print(f"  - {key}: {value}")
    
    # Show computed fields
    print(f"\nComputed slot_id: {slot.slot_id}")

# Example 6: ViewSet automatic endpoints
def example_viewset_endpoints():
    """
    Shows what endpoints are automatically created by ViewSets
    """
    
    from parking.views import ParkingSlotViewSet
    from rest_framework.routers import DefaultRouter
    
    # This is what happens in urls.py
    router = DefaultRouter()
    router.register(r'slots', ParkingSlotViewSet)
    
    print("Automatically created endpoints:")
    for pattern in router.urls:
        print(f"  - {pattern.pattern}")
    
    # Custom actions are also registered
    print("\nCustom actions:")
    for action_name, action_func in ParkingSlotViewSet.get_extra_actions():
        print(f"  - {action_name}: {action_func}")

# Example 7: Settings configuration impact
def example_settings_impact():
    """
    Shows how settings.py affects the entire application
    """
    
    from django.conf import settings
    
    print("Key settings that affect the entire app:")
    print(f"  - DEBUG mode: {settings.DEBUG}")
    print(f"  - Database engine: {settings.DATABASES['default']['ENGINE']}")
    print(f"  - Installed apps: {len(settings.INSTALLED_APPS)} apps")
    print(f"  - Middleware: {len(settings.MIDDLEWARE)} middleware classes")
    print(f"  - Time zone: {settings.TIME_ZONE}")
    
    # REST Framework settings
    print(f"\nREST Framework configuration:")
    rf_settings = settings.REST_FRAMEWORK
    for key, value in rf_settings.items():
        print(f"  - {key}: {value}")

# Example 8: Complete CRUD operation flow
def example_crud_flow():
    """
    Shows how Create, Read, Update, Delete operations flow through the system
    """
    
    from parking.models import ParkingSlot
    from parking.serializers import ParkingSlotSerializer
    
    print("=== CREATE ===")
    # This simulates POST /api/parking/slots/
    create_data = {
        'floor': 5,
        'section': 'A', 
        'slot_number': 1,
        'slot_type': 'regular',
        'status': 'available'
    }
    
    serializer = ParkingSlotSerializer(data=create_data)
    if serializer.is_valid():
        new_slot = serializer.save()
        print(f"Created: {new_slot}")
    
    print("\n=== READ ===")
    # This simulates GET /api/parking/slots/
    all_slots = ParkingSlot.objects.all()[:3]  # Get first 3
    serializer = ParkingSlotSerializer(all_slots, many=True)
    print(f"Retrieved {len(serializer.data)} slots")
    
    print("\n=== UPDATE ===")
    # This simulates PUT /api/parking/slots/1/
    if all_slots:
        slot_to_update = all_slots[0]
        update_data = {'status': 'maintenance'}
        
        serializer = ParkingSlotSerializer(slot_to_update, data=update_data, partial=True)
        if serializer.is_valid():
            updated_slot = serializer.save()
            print(f"Updated: {updated_slot} - Status: {updated_slot.status}")
    
    print("\n=== DELETE ===")
    # This simulates DELETE /api/parking/slots/1/
    if new_slot:
        slot_id = new_slot.id
        new_slot.delete()
        print(f"Deleted slot with ID: {slot_id}")

if __name__ == "__main__":
    print("🎓 ParkManager Backend - File Interaction Examples")
    print("=" * 60)
    
    print("\n1. Slot Allocation Flow:")
    example_slot_allocation()
    
    print("\n2. Authentication Flow:")
    example_authentication()
    
    print("\n3. Permission System:")
    example_permissions()
    
    print("\n4. Database Relationships:")
    example_relationships()
    
    print("\n5. Serializer Transformations:")
    example_serializers()
    
    print("\n6. ViewSet Endpoints:")
    example_viewset_endpoints()
    
    print("\n7. Settings Impact:")
    example_settings_impact()
    
    print("\n8. CRUD Operations:")
    example_crud_flow()
