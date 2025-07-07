from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import ParkSlot, User, ParkFee  # Include ParkFee import


@receiver(post_migrate)
def initialize_data(sender, **kwargs):
    from django.contrib.auth.hashers import make_password
    from django.contrib.auth import get_user_model
    from .models import ParkSlot, User, ParkFee

    # --- Create ParkSlots with correct type and section ---
    if not ParkSlot.objects.exists():
        structures = ['FLOOR1', 'FLOOR2', 'FLOOR3', 'FLOOR4']
        slots = []

        for structure in structures:
            slot_no = 1

            # Regular slots (1–10)
            for section in ['A', 'B']:
                for _ in range(10):  # 5 per section
                    slots.append(ParkSlot(
                        slotNo=str(slot_no),
                        slot_type='regular',
                        section=section,
                        status='available',
                        structure=structure
                    ))
                    slot_no += 1

            # VIP slots (11–20)
            for section in ['A', 'B']:
                for _ in range(10):
                    slots.append(ParkSlot(
                        slotNo=str(slot_no),
                        slot_type='vip',
                        section=section,
                        status='available',
                        structure=structure
                    ))
                    slot_no += 1

            # Disabled slots (21–30)
            for section in ['A', 'B']:
                for _ in range(10):
                    slots.append(ParkSlot(
                        slotNo=str(slot_no),
                        slot_type='disabled',
                        section=section,
                        status='available',
                        structure=structure
                    ))
                    slot_no += 1

        ParkSlot.objects.bulk_create(slots)
        print(f"{len(slots)} ParkSlots created.")
    else:
        print("ParkSlots already exist.")

    # --- Create ParkFee default rates ---
    if not ParkFee.objects.exists():
        ParkFee.objects.create(
            regular_hourly_rate=50.00,
            vip_hourly_rate=100.00,
            disabled_hourly_rate=25.00
        )
        print("Default ParkFee created.")
    else:
        print("ParkFee already exists.")

    # --- Create Django superuser ---
    DjangoUser = get_user_model()
    if not DjangoUser.objects.filter(username="admin").exists():
        DjangoUser.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="123"
        )
        print("Django superuser 'admin' created.")
    else:
        print("Django superuser 'admin' already exists.")

    # --- Create system users (admin, clerk, customer) ---
    users_data = [
        {
            "username": "admin",
            "first_name": "Admin",
            "last_name": "User",
            "email": "adminuser@example.com",
            "phone_no": "09123456789",
            "role": "admin"
        },
        {
            "username": "clerk",
            "first_name": "Clerk",
            "last_name": "User",
            "email": "clerkuser@example.com",
            "phone_no": "09123456788",
            "role": "clerk"
        },
        {
            "username": "customer",
            "first_name": "Customer",
            "last_name": "User",
            "email": "customeruser@example.com",
            "phone_no": "09123456787",
            "role": "customer"
        },
    ]

    for user_data in users_data:
        if not User.objects.filter(username=user_data["username"]).exists():
            User.objects.create(
                **user_data,
                password=make_password("123")
            )
            print(f"{user_data['role'].capitalize()} '{user_data['username']}' created.")
        else:
            print(f"User '{user_data['username']}' already exists.")
