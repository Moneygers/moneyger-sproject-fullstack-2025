from django.contrib import admin
from .models import ParkingSlot, Allocation, ParkingRate

@admin.register(ParkingSlot)
class ParkingSlotAdmin(admin.ModelAdmin):
    list_display = ['slot_id', 'floor', 'section', 'slot_number', 'slot_type', 'status', 'created_at']
    list_filter = ['floor', 'section', 'slot_type', 'status']
    search_fields = ['floor', 'section', 'slot_number']
    ordering = ['floor', 'section', 'slot_number']

@admin.register(Allocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = ['license_plate', 'customer_name', 'slot', 'start_time', 'is_active']
    list_filter = ['is_active', 'start_time']
    search_fields = ['license_plate', 'customer_name']
    ordering = ['-start_time']

@admin.register(ParkingRate)
class ParkingRateAdmin(admin.ModelAdmin):
    list_display = ['slot_type', 'hourly_rate', 'max_hours']
    list_filter = ['slot_type']
