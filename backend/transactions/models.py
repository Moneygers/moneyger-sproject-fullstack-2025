from django.db import models
from django.contrib.auth import get_user_model
from parking.models import Allocation
from reservations.models import Reservation
from decimal import Decimal

User = get_user_model()

class Transaction(models.Model):
    """
    Model for tracking all financial transactions
    Supports multiple payment methods and transaction types
    """
    TRANSACTION_TYPES = [
        ('parking_fee', 'Parking Fee'),
        ('reservation_fee', 'Reservation Fee'),
        ('penalty', 'Penalty'),
        ('refund', 'Refund'),
    ]
    
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('gcash', 'GCash'),
        ('online', 'Online Payment'),
    ]
    
    # References
    allocation = models.ForeignKey(Allocation, on_delete=models.CASCADE, null=True, blank=True)
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, null=True, blank=True)
    
    # Transaction details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    receipt_number = models.CharField(max_length=50, unique=True)
    
    # Customer details
    customer_name = models.CharField(max_length=100)
    license_plate = models.CharField(max_length=20, blank=True)
    
    # Tracking
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Transaction {self.receipt_number} - ₱{self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = self.generate_receipt_number()
        super().save(*args, **kwargs)
    
    def generate_receipt_number(self):
        """Generate unique receipt number"""
        from django.utils import timezone
        import random
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        return f"RCP{timestamp}{random_num}"

class ParkingFeeCalculator:
    """Utility class for calculating parking fees"""
    
    @staticmethod
    def calculate_fee(slot_type, hours):
        """Calculate parking fee based on slot type and duration"""
        from parking.models import ParkingRate
        
        try:
            rate = ParkingRate.objects.get(slot_type=slot_type)
            # Round up to next hour for partial hours
            import math
            billable_hours = math.ceil(hours) if hours > 0 else 1
            return Decimal(str(rate.hourly_rate * billable_hours))
        except ParkingRate.DoesNotExist:
            # Default rates if not configured
            default_rates = {
                'regular': Decimal('50.00'),
                'vip': Decimal('100.00'),
                'disabled': Decimal('30.00'),
            }
            import math
            billable_hours = math.ceil(hours) if hours > 0 else 1
            return default_rates.get(slot_type, Decimal('50.00')) * billable_hours
