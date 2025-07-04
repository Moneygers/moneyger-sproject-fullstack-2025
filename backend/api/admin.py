from django.contrib import admin
from .models import ParkSlot, Payment, User, Reservations

@admin.register(ParkSlot)
class ParkSlotAdmin(admin.ModelAdmin):
    list_display = ('id','slotNo', 'structure', 'section', 'slot_type', 'status')
    list_filter = ('structure', 'section', 'slot_type', 'status')
    search_fields = ('slotNo',)
    ordering = ('structure', 'section', 'slotNo')
    
    fieldsets = (
        ('Slot Information', {
            'fields': ('slotNo', 'structure', 'section')
        }),
        ('Slot Configuration', {
            'fields': ('slot_type', 'status')
        }),
    )
    
    actions = ['make_available', 'make_occupied', 'make_reserved']
    
    def make_available(self, request, queryset):
        queryset.update(status='available')
        self.message_user(request, f'{queryset.count()} slots marked as available.')
    make_available.short_description = "Mark selected slots as available"
    
    def make_occupied(self, request, queryset):
        queryset.update(status='occupied')
        self.message_user(request, f'{queryset.count()} slots marked as occupied.')
    make_occupied.short_description = "Mark selected slots as occupied"
    
    def make_reserved(self, request, queryset):
        queryset.update(status='reserved')
        self.message_user(request, f'{queryset.count()} slots marked as reserved.')
    make_reserved.short_description = "Mark selected slots as reserved"

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('recieptNo', 'plate_no', 'slot', 'amount', 'mode_of_payment', 'date', 'created_at')
    list_filter = ('mode_of_payment', 'date', 'created_at')
    search_fields = ('plate_no', 'recieptNo')
    ordering = ('-created_at',)
    readonly_fields = ('recieptNo', 'created_at')
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('recieptNo', 'slot', 'plate_no', 'amount')
        }),
        ('Payment Details', {
            'fields': ('mode_of_payment', 'date', 'created_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('slot', 'plate_no')
        return self.readonly_fields

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id','username', 'first_name', 'last_name', 'email', 'role')
    list_filter = ('role',)
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    
    fieldsets = (
        ('Account Information', {
            'fields': ('username', 'password', 'role')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone_no')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change or 'password' in form.changed_data:
            # Hash password if it's a new user or password was changed
            from django.contrib.auth.hashers import make_password
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)

@admin.register(Reservations)
class ReservationsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'plate_no', 'park_slot', 'status', 'fee', 'mode_of_payment', 'date', 'arrival_time', 'created_at')
    list_filter = ('mode_of_payment', 'status', 'date', 'created_at', 'arrival_time')
    search_fields = ('name', 'plate_no', 'mobileNo')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'arrival_time')
    
    fieldsets = (
        ('Reservation Information', {
            'fields': ('park_slot', 'status', 'fee', 'date', 'created_at')
        }),
        ('Customer Information', {
            'fields': ('mode_of_payment', 'name', 'plate_no', 'mobileNo')
        }),
        ('Arrival Information', {
            'fields': ('arrival_time',),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['approve_reservations', 'complete_reservations', 'reset_to_pending', 'mark_as_arrived']
    
    def approve_reservations(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='approved')
        self.message_user(request, f'{updated} reservations approved.')
    approve_reservations.short_description = "Approve selected pending reservations"
    
    def complete_reservations(self, request, queryset):
        completed_count = 0
        for reservation in queryset.filter(status__in=['approved', 'arrived']):
            reservation.status = 'completed'
            reservation.park_slot.status = 'available'
            reservation.park_slot.save()
            reservation.save()
            completed_count += 1
        self.message_user(request, f'{completed_count} reservations completed and slots made available.')
    complete_reservations.short_description = "Complete selected reservations"
    
    def reset_to_pending(self, request, queryset):
        updated = queryset.update(status='pending')
        self.message_user(request, f'{updated} reservations reset to pending.')
    reset_to_pending.short_description = "Reset selected reservations to pending"
    
    def mark_as_arrived(self, request, queryset):
        from django.utils import timezone
        updated_count = 0
        for reservation in queryset.filter(status='approved'):
            reservation.status = 'arrived'
            reservation.arrival_time = timezone.now()
            reservation.save()
            updated_count += 1
        self.message_user(request, f'{updated_count} reservations marked as arrived.')
    mark_as_arrived.short_description = "Mark selected approved reservations as arrived"
    
    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status == 'completed':
            # Make most fields readonly for completed reservations
            return self.readonly_fields + ('park_slot', 'name', 'plate_no', 'mobileNo', 'date', 'status')
        return self.readonly_fields

# Customize admin site headers
admin.site.site_header = "ParkManager Administration"
admin.site.site_title = "ParkManager Admin"
admin.site.index_title = "Welcome to ParkManager where you're our bitch"
