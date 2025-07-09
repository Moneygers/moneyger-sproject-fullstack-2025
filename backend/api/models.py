from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string

class ParkFee(models.Model):
    id = models.AutoField(primary_key=True)
    regular_hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    vip_hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    disabled_hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rates - Regular: ₱{self.regular_hourly_rate}, VIP: ₱{self.vip_hourly_rate}, Disabled: ₱{self.disabled_hourly_rate}"



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
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
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

class ReservationOTP(models.Model):
    phone_number = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    is_used = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)  # OTP expires in 5 minutes
        if not self.otp_code:
            self.otp_code = self.generate_otp()
        super().save(*args, **kwargs)
    
    def generate_otp(self):
        """Generate a 6-digit OTP"""
        return ''.join(random.choices(string.digits, k=6))
    
    def is_expired(self):
        """Check if OTP has expired"""
        return timezone.now() > self.expires_at
    
    def verify(self, input_otp):
        """Verify the OTP"""
        if self.is_expired():
            return False, "OTP has expired"
        if self.is_used:
            return False, "OTP has already been used"
        if self.otp_code != input_otp:
            return False, "Invalid OTP"
        
        self.is_verified = True
        self.is_used = True
        self.save()
        return True, "OTP verified successfully"
    
    def __str__(self):
        return f"OTP for {self.phone_number} - {self.otp_code}"
    
    class Meta:
        ordering = ['-created_at']
