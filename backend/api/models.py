from django.db import models

class ParkSlot(models.Model):
    SLOT_STRUCTURE_CHOICES = [
        ('FLOOR1', 'FLOOR1'),
        ('FLOOR2', 'FLOOR2'),
        ('FLOOR3', 'FLOOR3'),
        ('FLOOR4', 'FLOOR4'),
    ]

    SLOT_TYPE_CHOICES = [
        ('disabled', 'Disabled'),
        ('vip', 'VIP'),
        ('regular', 'Regular'),
    ]

    SECTION_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
    ]

    id = models.AutoField(primary_key=True)
    slotNo = models.CharField(max_length=10)  # Identifier like "A1", "B2", etc.
    slot_type = models.CharField(max_length=10, choices=SLOT_TYPE_CHOICES)
    section = models.CharField(max_length=1, choices=SECTION_CHOICES)
    status = models.CharField(max_length=10, choices=[
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('occupied', 'Occupied'),
        ('waiting', 'Waiting'),
    ], default='available')
    structure = models.CharField(max_length=20, choices=SLOT_STRUCTURE_CHOICES)

    def __str__(self):
        return f"Slot {self.slotNo} - {self.structure} - {self.status}"

class Payment(models.Model):
    recieptNo = models.AutoField(primary_key=True)
    slot = models.ForeignKey(ParkSlot, on_delete=models.CASCADE)
    plate_no = models.CharField(max_length=20)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    mode_of_payment = models.CharField(max_length=20, choices=[
        ('cash', 'Cash'),
        ('gcash', 'Gcash'),
    ], null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.pk is None or self.slot.status == 'reserved':
            self.slot.status = 'occupied'
            self.slot.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment {self.recieptNo} for plate {self.plate_no}"

class User(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('clerk', 'Clerk'),
        ('customer', 'Customer'),
    ]

    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone_no = models.CharField(max_length=20)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=300)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.username} - {self.role}"

class Reservations(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('arrived', 'Arrived'),
    ]

    id = models.AutoField(primary_key=True)
    park_slot = models.ForeignKey(ParkSlot, on_delete=models.CASCADE)
    plate_no = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    mobileNo = models.CharField(max_length=20)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    arrival_time = models.DateTimeField(null=True, blank=True)
    mode_of_payment = models.CharField(max_length=20, choices=[
        ('cash', 'Cash'),
        ('gcash', 'Gcash'),
    ], null=True, blank=True)

    class Meta:
        unique_together = ('park_slot', 'plate_no', 'created_at')

    def save(self, *args, **kwargs):
        if self.pk is None and self.park_slot.status == 'available':
            self.park_slot.status = 'reserved'
            self.park_slot.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reservation for plate {self.plate_no} at slot {self.park_slot.slotNo}"
