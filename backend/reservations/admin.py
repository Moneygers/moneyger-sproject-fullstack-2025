from django.contrib import admin
from .models import Reservation

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'slot', 'reserved_date', 'reserved_time', 'status', 'created_at']
    list_filter = ['status', 'reserved_date', 'created_at']
    search_fields = ['customer_name', 'license_plate', 'phone_number']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'approved_at', 'arrival_time']
