from django.db import models
from django.contrib.auth import get_user_model
from parking.models import ParkingSlot
from django.utils import timezone

User = get_user_model()

class Reservation(models.Model):
    """
    Model for parking reservations
    Handles booking workflow and status tracking
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('waiting', 'Waiting'),
        ('parked', 'Parked'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    slot = models.ForeignKey(ParkingSlot, on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    license_plate = models.CharField(max_length=20)
    reserved_date = models.DateField()
    reserved_time = models.TimeField()
    duration_hours = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Tracking fields
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    arrival_time = models.DateTimeField(null=True, blank=True)
    parking_duration = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Staff tracking
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                   related_name='approved_reservations')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                    related_name='processed_reservations')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reservation {self.id} - {self.customer_name} ({self.status})"
    
    @property
    def reserved_datetime(self):
        return timezone.datetime.combine(self.reserved_date, self.reserved_time)
    
    def can_be_approved(self):
        return self.status == 'pending'
    
    def can_arrive(self):
        return self.status in ['approved', 'waiting']
    
    def approve(self, user):
        """Approve the reservation"""
        if self.can_be_approved():
            self.status = 'approved'
            self.approved_by = user
            self.approved_at = timezone.now()
            self.save()
            return True
        return False
    
    def mark_arrived(self, user):
        """Mark customer as arrived"""
        if self.can_arrive():
            self.status = 'parked'
            self.arrival_time = timezone.now()
            self.processed_by = user
            self.save()
            
            # Update slot status
            self.slot.status = 'occupied'
            self.slot.save()
            return True
        return False
