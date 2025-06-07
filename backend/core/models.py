from django.db import models

class ParkingSlot(models.Model):
    slot_number = models.CharField(max_length=10, unique=True)
    is_occupied = models.BooleanField(default=False)
    plate_number = models.CharField(max_length=20, blank=True, null=True)
    is_reserved = models.BooleanField(default=False)

    def __str__(self):
        return self.slot_number

class Reservation(models.Model):
    slot = models.ForeignKey(ParkingSlot, on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Reservation for {self.slot.slot_number}"

class ParkingFee(models.Model):
    slot = models.ForeignKey(ParkingSlot, on_delete=models.CASCADE)
    rate_per_hour = models.DecimalField(max_digits=5, decimal_places=2, default=2.50)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_fee = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    plate_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"Fee for {self.slot.slot_number}"