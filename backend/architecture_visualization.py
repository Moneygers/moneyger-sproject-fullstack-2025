"""
Visual representation of how all components connect
"""

def print_architecture_diagram():
    """
    ASCII diagram showing component relationships
    """
    print("""
🏗️ ParkManager Backend Architecture

┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUESTS                          │
│                   (Web, Mobile, API calls)                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   parkmanager/urls.py                          │
│                  (Main Traffic Director)                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ /api/auth/        → accounts/                           │   │
│   │ /api/parking/     → parking/                            │   │
│   │ /api/reservations/→ reservations/                       │   │
│   │ /api/transactions/→ transactions/                       │   │
│   │ /api/reports/     → reports/                            │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  accounts/  │  │  parking/   │  │reservations/│
│             │  │             │  │             │
│ 👤 Users    │  │ 🅿️ Slots    │  │ 📅 Bookings │
│ 🔐 Auth     │  │ 🚗 Vehicles │  │ ✅ Approvals│
│ 🛡️ Perms    │  │ 📡 Real-time│  │ 📋 Workflow │
└─────┬───────┘  └─────┬───────┘  └─────┬───────┘
      │                │                │
      └────────────────┼────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│transactions/│  │  reports/   │  │  scripts/   │
│             │  │             │  │             │
│ 💰 Payments │  │ 📊 Analytics│  │ 🛠️ Setup    │
│ 🧾 Receipts │  │ 📈 Revenue  │  │ 🔧 Maintenance│
│ 💳 Methods  │  │ 📉 Trends   │  │ 🎯 Utilities │
└─────┬───────┘  └─────┬───────┘  └─────────────┘
      │                │
      └────────────────┼────────────────┐
                       │                │
                       ▼                ▼
              ┌─────────────────────────────┐
              │         DATABASE            │
              │                             │
              │ 👥 Users     🅿️ Slots       │
              │ 📅 Reservations 💰 Transactions│
              │ 🔗 Relationships            │
              └─────────────────────────────┘

🔄 Data Flow:
1. Client → parkmanager/urls.py → App URLs → Views
2. Views → Serializers → Models → Database
3. Database → Models → Serializers → Views → Client

🔗 App Dependencies:
accounts ← parking ← reservations ← transactions ← reports
   ↑                                                  ↑
   └──────────────── scripts ────────────────────────┘
""")

def print_request_flow_example():
    """
    Shows detailed request flow example
    """
    print("""
🔄 Complete Request Flow Example: "Allocate Parking Slot"

1. 📱 CLIENT REQUEST
   POST /api/parking/slots/5/allocate/
   Headers: Authorization: Bearer jwt_token
   Body: {"license_plate": "ABC-123", "customer_name": "John"}

2. 🚦 MAIN URL ROUTER (parkmanager/urls.py)
   path('api/parking/', include('parking.urls'))
   → Routes to parking app

3. 🎯 APP URL ROUTER (parking/urls.py)  
   router.register(r'slots', ParkingSlotViewSet)
   → Creates /slots/{id}/allocate/ endpoint

4. 🔐 AUTHENTICATION (accounts/permissions.py)
   JWTAuthentication validates token
   IsStaffUser checks if user has staff role
   → User must be clerk or admin

5. 🎬 VIEW PROCESSING (parking/views.py)
   ParkingSlotViewSet.allocate() method:
   - Gets slot with id=5
   - Checks if slot is available
   - Validates input data

6. ✅ DATA VALIDATION (parking/serializers.py)
   AllocationCreateSerializer:
   - Validates license_plate format
   - Validates customer_name
   - Checks slot availability

7. 💾 DATABASE OPERATIONS (parking/models.py)
   - Updates ParkingSlot.status = 'occupied'
   - Creates new Allocation record
   - Links allocation to user (from accounts app)

8. 📡 REAL-TIME UPDATES (parking/consumers.py)
   broadcast_parking_update(slot_id=5)
   → Sends WebSocket message to all connected clients

9. 📊 RESPONSE GENERATION
   Returns JSON: {"success": true, "data": {...}}

10. 📈 ANALYTICS IMPACT (reports app)
    New allocation affects:
    - Occupancy statistics
    - Usage patterns
    - Staff performance metrics

Cross-App Interactions in this single request:
- accounts: User authentication & permission checking
- parking: Core slot allocation logic
- reports: Analytics data updated
- (Future) transactions: Will calculate fees when released
""")

def print_database_relationships():
    """
    Shows how database tables relate across apps
    """
    print("""
🗄️ Database Relationships Across Apps

accounts_user (accounts app)
├── id (Primary Key)
├── username, email, role
└── Related to:
    ├── reservations_reservation.approved_by → User
    ├── reservations_reservation.processed_by → User  
    ├── transactions_transaction.processed_by → User
    └── parking_allocation.allocated_by → User

parking_parkingslot (parking app)
├── id (Primary Key)
├── floor, section, slot_number, status
└── Related to:
    ├── parking_allocation.slot → ParkingSlot (OneToOne)
    ├── reservations_reservation.slot → ParkingSlot (ForeignKey)
    └── transactions_transaction.allocation.slot → ParkingSlot (Indirect)

parking_allocation (parking app)
├── id (Primary Key)
├── slot_id → parking_parkingslot (OneToOne)
├── allocated_by_id → accounts_user (ForeignKey)
├── license_plate, customer_name, start_time
└── Related to:
    └── transactions_transaction.allocation → Allocation (ForeignKey)

reservations_reservation (reservations app)
├── id (Primary Key)
├── slot_id → parking_parkingslot (ForeignKey)
├── approved_by_id → accounts_user (ForeignKey)
├── processed_by_id → accounts_user (ForeignKey)
├── customer_name, reserved_date, status
└── Related to:
    └── transactions_transaction.reservation → Reservation (ForeignKey)

transactions_transaction (transactions app)
├── id (Primary Key)
├── allocation_id → parking_allocation (ForeignKey, nullable)
├── reservation_id → reservations_reservation (ForeignKey, nullable)
├── processed_by_id → accounts_user (ForeignKey)
└── amount, payment_method, receipt_number

🔗 Key Relationships:
1. User can approve many Reservations (1:N)
2. User can process many Transactions (1:N)
3. ParkingSlot has one current Allocation (1:1)
4. ParkingSlot can have many Reservations (1:N)
5. Allocation can have many Transactions (1:N)
6. Reservation can have many Transactions (1:N)

📊 Reports App Queries:
- Joins ALL tables to generate analytics
- No models of its own, aggregates data from other apps
- Examples:
  * Revenue by user role (User + Transaction)
  * Occupancy by floor (ParkingSlot + Allocation)
  * Booking patterns (Reservation + ParkingSlot)
""")

if __name__ == "__main__":
    print_architecture_diagram()
    print_request_flow_example()
    print_database_relationships()
