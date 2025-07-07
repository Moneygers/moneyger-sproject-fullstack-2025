from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import ParkSlot, User


@receiver(post_migrate)
def initialize_data(sender, **kwargs):
    from django.contrib.auth.hashers import make_password
    from django.contrib.auth import get_user_model
    from .models import ParkSlot, User

    # --- Create ParkSlots in correct visual grouping ---
    if not ParkSlot.objects.exists():
        structures = ['FLOOR1', 'FLOOR2', 'FLOOR3', 'FLOOR4']
        sections = ['A', 'B']
        slot_types = ['regular', 'vip', 'disabled']
        slots = []

        for structure in structures:
            for section in sections:
                for slot_type in slot_types:  # loop by type first
                    for i in range(1, 6):  # 1 to 5
                        slots.append(ParkSlot(
                            slotNo=str(i),
                            slot_type=slot_type,
                            section=section,
                            status='available',
                            structure=structure
                        ))

        ParkSlot.objects.bulk_create(slots)
        print(f"{len(slots)} ParkSlots created.")
    else:
        print("ParkSlots already exist.")

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
