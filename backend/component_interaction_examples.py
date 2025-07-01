"""
Real examples showing how all components interact with each other
Run in Django shell: python manage.py shell
"""

def complete_parking_scenario():
    """
    Shows how ALL components work together in a real parking scenario
    """
    print("🎬 Complete Parking Scenario - All Components Working Together")
    print("=" * 70)
    
    # Import all the models from different apps
    from accounts.models import User
    from parking.models import ParkingSlot, Allocation
    from reservations.models import Reservation
    from transactions.models import Transaction, ParkingFeeCalculator
    from django.utils import timezone
    from datetime import datetime, timedelta
    
    print("\n1. 👤 ACCOUNTS APP - User Management")
    print("-" * 40)
    
    # Get users from different roles
    admin = User.objects.filter(role='admin').first()
    clerk = User.objects.filter(role='clerk').first()
    customer = User.objects.filter(role='customer').first()
    
    print(f"Admin user: {admin.username if admin else 'None'}")
    print(f"Clerk user: {clerk.username if clerk else 'None'}")  
    print(f"Customer user: {customer.username if customer else 'None'}")
    
    print("\n2. 🅿️ PARKING APP - Slot Management")
    print("-" * 40)
    
    # Find an available slot
    available_slot = ParkingSlot.objects.filter(status='available').first()
    if available_slot:
        print(f"Found available slot: {available_slot}")
        print(f"  - Location: Floor {available_slot.floor}, Section {available_slot.section}")
        print(f"  - Slot Type: {available_slot.slot_type}")
        print(f"  - Status: {available_slot.status}")
    
    print("\n3. 📅 RESERVATIONS APP - Booking System")
    print("-" * 40)
    
    if available_slot and customer:
        # Create a reservation (simulating customer booking)
        reservation_data = {
            'slot': available_slot,
            'customer_name': f"{customer.first_name} {customer.last_name}",
            'phone_number': '+1234567890',
            'email': customer.email,
            'license_plate': 'ABC-123',
            'reserved_date': timezone.now().date(),
            'reserved_time': timezone.now().time(),
            'duration_hours': 3
        }
        
        # Check if reservation already exists to avoid duplicates
        existing_reservation = Reservation.objects.filter(
            slot=available_slot,
            status__in=['pending', 'approved', 'parked']
        ).first()
        
        if not existing_reservation:
            reservation = Reservation.objects.create(**reservation_data)
            print(f"✅ Reservation created: {reservation}")
            print(f"  - Status: {reservation.status}")
            print(f"  - Reserved for: {reservation.reserved_date} at {reservation.reserved_time}")
            
            # Staff approves the reservation
            if clerk:
                reservation.approve(clerk)
                print(f"✅ Reservation approved by: {clerk.username}")
                print(f"  - New status: {reservation.status}")
                
                # Customer arrives
                reservation.mark_arrived(clerk)
                print(f"✅ Customer arrived, processed by: {clerk.username}")
                print(f"  - Final status: {reservation.status}")
                print(f"  - Slot status now: {available_slot.status}")
        else:
            reservation = existing_reservation
            print(f"ℹ️ Using existing reservation: {reservation}")
    
    print("\n4. 💰 TRANSACTIONS APP - Payment Processing")
    print("-" * 40)
    
    # Find an active allocation for checkout
    active_allocation = Allocation.objects.filter(is_active=True).first()
    
    if active_allocation:
        print(f"Processing checkout for: {active_allocation}")
        print(f"  - Vehicle: {active_allocation.license_plate}")
        print(f"  - Duration: {active_allocation.duration_hours} hours")
        
        # Calculate parking fee
        fee = ParkingFeeCalculator.calculate_fee(
            active_allocation.slot.slot_type,
            active_allocation.duration_hours
        )
        print(f"  - Calculated fee: ₱{fee}")
        
        # Create transaction (simulating checkout)
        if clerk:
            transaction = Transaction.objects.create(
                allocation=active_allocation,
                amount=fee,
                transaction_type='parking_fee',
                payment_method='cash',
                customer_name=active_allocation.customer_name,
                license_plate=active_allocation.license_plate,
                processed_by=clerk
            )
            
            print(f"✅ Transaction created: {transaction.receipt_number}")
            print(f"  - Amount: ₱{transaction.amount}")
            print(f"  - Payment method: {transaction.payment_method}")
            print(f"  - Processed by: {transaction.processed_by.username}")
            
            # Release the slot (this would happen in the checkout process)
            active_allocation.is_active = False
            active_allocation.save()
            
            active_allocation.slot.status = 'available'
            active_allocation.slot.save()
            
            print(f"✅ Slot released: {active_allocation.slot}")
    
    print("\n5. 📊 REPORTS APP - Analytics")
    print("-" * 40)
    
    # Generate some basic analytics (simulating reports app)
    total_slots = ParkingSlot.objects.count()
    occupied_slots = ParkingSlot.objects.filter(status='occupied').count()
    available_slots = ParkingSlot.objects.filter(status='available').count()
    
    print(f"Parking Statistics:")
    print(f"  - Total slots: {total_slots}")
    print(f"  - Occupied: {occupied_slots}")
    print(f"  - Available: {available_slots}")
    print(f"  - Occupancy rate: {(occupied_slots/total_slots*100):.1f}%")
    
    # Revenue statistics
    today = timezone.now().date()
    daily_transactions = Transaction.objects.filter(created_at__date=today)
    daily_revenue = sum(t.amount for t in daily_transactions)
    
    print(f"\nRevenue Statistics (Today):")
    print(f"  - Transactions: {daily_transactions.count()}")
    print(f"  - Total revenue: ₱{daily_revenue}")
    
    # Reservation statistics
    pending_reservations = Reservation.objects.filter(status='pending').count()
    approved_reservations = Reservation.objects.filter(status='approved').count()
    
    print(f"\nReservation Statistics:")
    print(f"  - Pending reservations: {pending_reservations}")
    print(f"  - Approved reservations: {approved_reservations}")
    
    print("\n6. 🛠️ SCRIPTS - System Maintenance")
    print("-" * 40)
    print("Scripts handle:")
    print("  - Initial system setup (creating slots, users)")
    print("  - Data maintenance (cleanup, backups)")
    print("  - Development helpers (test data)")
    print("  - System monitoring (health checks)")

def show_data_flow_between_apps():
    """
    Shows how data flows between different apps
    """
    print("\n🔄 Data Flow Between Apps")
    print("=" * 50)
    
    from accounts.models import User
    from parking.models import ParkingSlot
    from reservations.models import Reservation
    from transactions.models import Transaction
    
    # Show relationships between apps
    print("\n📊 Cross-App Relationships:")
    
    # 1. User relationships
    admin_user = User.objects.filter(role='admin').first()
    if admin_user:
        approved_reservations = Reservation.objects.filter(approved_by=admin_user).count()
        processed_transactions = Transaction.objects.filter(processed_by=admin_user).count()
        
        print(f"\n👤 {admin_user.username} (Admin):")
        print(f"  - Approved reservations: {approved_reservations}")
        print(f"  - Processed transactions: {processed_transactions}")
    
    # 2. Parking slot relationships
    slot_with_data = ParkingSlot.objects.first()
    if slot_with_data:
        slot_reservations = Reservation.objects.filter(slot=slot_with_data).count()
        slot_transactions = Transaction.objects.filter(allocation__slot=slot_with_data).count()
        
        print(f"\n🅿️ {slot_with_data} relationships:")
        print(f"  - Total reservations: {slot_reservations}")
        print(f"  - Related transactions: {slot_transactions}")
        
        # Check current allocation
        try:
            current_allocation = slot_with_data.current_allocation
            print(f"  - Current allocation: {current_allocation.license_plate}")
        except:
            print(f"  - Current allocation: None")
    
    # 3. Show app dependencies
    print(f"\n🔗 App Dependencies:")
    print(f"  accounts → (no dependencies)")
    print(f"  parking → accounts (for user tracking)")
    print(f"  reservations → accounts + parking (users + slots)")
    print(f"  transactions → accounts + parking + reservations (all data)")
    print(f"  reports → ALL apps (aggregates all data)")
    print(f"  scripts → ALL apps (initializes all data)")

def demonstrate_api_endpoint_mapping():
    """
    Shows how URLs map to different apps and their purposes
    """
    print("\n🌐 API Endpoint Mapping")
    print("=" * 50)
    
    endpoints = {
        "Authentication & Users": {
            "/api/auth/login/": "accounts app - User login",
            "/api/auth/register/": "accounts app - User registration", 
            "/api/auth/users/": "accounts app - User management",
            "/api/auth/users/me/": "accounts app - Current user profile"
        },
        "Parking Management": {
            "/api/parking/slots/": "parking app - List/manage slots",
            "/api/parking/slots/{id}/allocate/": "parking app - Allocate slot",
            "/api/parking/slots/{id}/release/": "parking app - Release slot",
            "/api/parking/slots/availability_summary/": "parking app - Availability stats",
            "/api/parking/allocations/": "parking app - Active allocations"
        },
        "Reservation System": {
            "/api/reservations/": "reservations app - Manage bookings",
            "/api/reservations/{id}/approve/": "reservations app - Approve booking",
            "/api/reservations/{id}/arrive/": "reservations app - Mark arrival",
            "/api/reservations/{id}/cancel/": "reservations app - Cancel booking",
            "/api/reservations/dashboard_stats/": "reservations app - Booking stats"
        },
        "Payment Processing": {
            "/api/transactions/": "transactions app - Transaction history",
            "/api/transactions/checkout/": "transactions app - Process payment",
            "/api/transactions/daily_revenue/": "transactions app - Revenue stats"
        },
        "Analytics & Reports": {
            "/api/reports/revenue/": "reports app - Revenue analytics",
            "/api/reports/occupancy/": "reports app - Occupancy analytics"
        }
    }
    
    for category, endpoints_dict in endpoints.items():
        print(f"\n📂 {category}:")
        for endpoint, description in endpoints_dict.items():
            print(f"  {endpoint:&lt;40} → {description}")

def show_file_structure_purpose():
    """
    Shows the purpose of each file in each app
    """
    print("\n📁 File Structure & Purpose")
    print("=" * 50)
    
    structure = {
        "parkmanager/ (Main Project)": {
            "settings.py": "Global configuration (database, apps, middleware)",
            "urls.py": "Main URL router (directs traffic to apps)",
            "wsgi.py": "Web server interface for deployment",
            "asgi.py": "Async server interface for WebSockets",
            "celery.py": "Background task configuration"
        },
        "accounts/ (User Management)": {
            "models.py": "User model with roles and permissions",
            "views.py": "Login, registration, user management logic",
            "serializers.py": "User data validation and transformation",
            "permissions.py": "Role-based access control classes",
            "urls.py": "Authentication-related URL patterns"
        },
        "parking/ (Slot Operations)": {
            "models.py": "ParkingSlot, Allocation, ParkingRate models",
            "views.py": "Slot allocation, release, status management",
            "serializers.py": "Parking data validation and formatting",
            "consumers.py": "WebSocket handlers for real-time updates",
            "routing.py": "WebSocket URL routing"
        },
        "reservations/ (Booking System)": {
            "models.py": "Reservation model with workflow states",
            "views.py": "Booking creation, approval, arrival logic",
            "serializers.py": "Reservation data validation",
            "urls.py": "Booking-related URL patterns"
        },
        "transactions/ (Payment Processing)": {
            "models.py": "Transaction model and fee calculator",
            "views.py": "Payment processing and checkout logic",
            "serializers.py": "Transaction data validation"
        },
        "reports/ (Analytics)": {
            "views.py": "Revenue and occupancy report generation",
            "urls.py": "Analytics endpoint routing"
        },
        "scripts/ (Utilities)": {
            "setup_all.py": "Complete system initialization",
            "create_admin_user.py": "Create admin and sample users",
            "setup_parking_slots.py": "Create parking infrastructure"
        }
    }
    
    for app_name, files in structure.items():
        print(f"\n📂 {app_name}:")
        for filename, purpose in files.items():
            print(f"  {filename:&lt;20} → {purpose}")

if __name__ == "__main__":
    print("🏗️ ParkManager Backend - Complete Component Analysis")
    print("=" * 70)
    
    # Run all demonstrations
    complete_parking_scenario()
    show_data_flow_between_apps()
    demonstrate_api_endpoint_mapping()
    show_file_structure_purpose()
    
    print("\n" + "=" * 70)
    print("🎯 Summary: All components work together to provide a complete")
    print("   parking management system with user management, real-time")
    print("   slot tracking, reservation system, payment processing,")
    print("   and business analytics!")
