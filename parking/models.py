from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ParkingSlot(models.Model):
    """
    Model representing individual parking slots
    Supports different floors, sections, and slot types
    """
    SLOT_TYPES = [
        ('regular', 'Regular'),
        ('vip', 'VIP'),
        ('disabled', 'Disabled Access'),
    ]
    
    SLOT_STATUS = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Under Maintenance'),
    ]
    
    floor = models.IntegerField(choices=[(i, f'Floor {i}') for i in range(1, 5)])
    section = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C')])
    slot_number = models.IntegerField()
    slot_type = models.CharField(max_length=20, choices=SLOT_TYPES, default='regular')
    status = models.CharField(max_length=20, choices=SLOT_STATUS, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['floor', 'section', 'slot_number']
        ordering = ['floor', 'section', 'slot_number']
    
    def __str__(self):
        return f"Floor {self.floor}-{self.section}{self.slot_number:02d}"
    
    @property
    def slot_id(self):
        return f"{self.floor}{self.section}{self.slot_number:02d}"
    
    def is_available(self):
        return self.status == 'available'

class Allocation(models.Model):
    """
    Model representing current parking assignments
    Links vehicles to parking slots
    """
    slot = models.OneToOneField(ParkingSlot, on_delete=models.CASCADE, 
                               related_name='current_allocation')
    license_plate = models.CharField(max_length=20)
    customer_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    start_time = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    allocated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"{self.license_plate} at {self.slot}"
    
    @property
    def duration_hours(self):
        from django.utils import timezone
        if self.is_active:
            delta = timezone.now() - self.start_time
            return round(delta.total_seconds() / 3600, 2)
        return 0

class ParkingRate(models.Model):
    """Model for managing parking rates by slot type"""
    slot_type = models.CharField(max_length=20, choices=ParkingSlot.SLOT_TYPES, unique=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    max_hours = models.IntegerField(default=24)
    
    def __str__(self):
        return f"{self.get_slot_type_display()}: ₱{self.hourly_rate}/hour"
