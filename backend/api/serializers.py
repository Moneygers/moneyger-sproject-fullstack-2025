from rest_framework import serializers
from .models import ParkSlot, Payment, User, Reservations
from django.contrib.auth.hashers import make_password, check_password

class ParkSlotSerializer(serializers.ModelSerializer):
    current_allocation = serializers.SerializerMethodField()
    floor = serializers.SerializerMethodField()
    display_id = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkSlot
        fields = '__all__'
    
    def get_current_allocation(self, obj):
        """Get current payment/allocation info for occupied slots"""
        if obj.status == 'occupied':
            try:
                # Get the most recent payment for this slot
                payment = Payment.objects.filter(slot=obj).order_by('-created_at').first()
                if payment:
                    return {
                        'license_plate': payment.plate_no,
                        'start_time': payment.created_at.isoformat(),
                        'payment_id': payment.recieptNo,
                        'customer_name': getattr(payment, 'customer_name', None)
                    }
            except Payment.DoesNotExist:
                pass
        return None
    
    def get_floor(self, obj):
        """Extract floor number from structure"""
        if obj.structure:
            # Extract number from FLOOR1, FLOOR2, etc.
            try:
                return int(obj.structure.replace('FLOOR', ''))
            except:
                return 1
        return 1
    
    def get_display_id(self, obj):
        """Generate display ID in format F1-A-1"""
        floor = self.get_floor(obj)
        return f"F{floor}-{obj.section}-{obj.slotNo}"

class PaymentSerializer(serializers.ModelSerializer):
    slot_details = ParkSlotSerializer(source='slot', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        
    def create(self, validated_data):
        # Update slot status when payment is created
        payment = super().create(validated_data)
        return payment

class SlotAssignmentSerializer(serializers.Serializer):
    """Serializer for assigning a vehicle to a slot"""
    license_plate = serializers.CharField(max_length=20)
    customer_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_license_plate(self, value):
        """Validate and format license plate"""
        return value.upper().strip()

class CheckoutSerializer(serializers.Serializer):
    """Serializer for checkout process"""
    payment_method = serializers.CharField(max_length=20)
    print_receipt = serializers.BooleanField(default=False)
    
    def validate_payment_method(self, value):
        """Validate payment method"""
        valid_methods = ['Cash', 'Card', 'GCash']
        if value not in valid_methods:
            raise serializers.ValidationError(f"Payment method must be one of: {', '.join(valid_methods)}")
        return value

class SystemSettingsSerializer(serializers.Serializer):
    """Serializer for system settings"""
    regularHourlyRate = serializers.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    vipHourlyRate = serializers.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    disabledHourlyRate = serializers.DecimalField(max_digits=10, decimal_places=2, default=30.00)
    maxParkingHours = serializers.IntegerField(default=24)
    maxReservationDays = serializers.IntegerField(default=7)
    enableReservations = serializers.BooleanField(default=True)
    enableNotifications = serializers.BooleanField(default=True)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_no', 'username', 'password', 'role']
        
    def create(self, validated_data):
        # Hash password before saving
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        # Hash password if it's being updated
        if 'password' in validated_data and validated_data['password']:
            validated_data['password'] = make_password(validated_data['password'])
        elif 'password' in validated_data and not validated_data['password']:
            # Remove password from validated_data if it's empty
            validated_data.pop('password')
        return super().update(instance, validated_data)

    def validate_username(self, value):
        """Ensure username is unique"""
        if self.instance:
            # If updating, exclude current instance from uniqueness check
            if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
                raise serializers.ValidationError("Username already exists")
        else:
            # If creating, check if username exists
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError("Username already exists")
        return value
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if self.instance:
            # If updating, exclude current instance from uniqueness check
            if User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
                raise serializers.ValidationError("Email already exists")
        else:
            # If creating, check if email exists
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("Email already exists")
        return value

class ReservationsSerializer(serializers.ModelSerializer):
    park_slot_details = ParkSlotSerializer(source='park_slot', read_only=True)
    slot = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='name', read_only=True)
    phone_number = serializers.CharField(source='mobileNo', read_only=True)
    reserved_date = serializers.DateField(source='date', read_only=True)
    reserved_time = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    slot_type = serializers.SerializerMethodField()
    arrival_time = serializers.DateTimeField(required=False, allow_null=True)
    parking_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Reservations
        fields = '__all__'
    
    def get_slot(self, obj):
        """Get formatted slot display"""
        if obj.park_slot:
            return f"F{obj.park_slot.structure.replace('FLOOR', '') if obj.park_slot.structure else '1'}-{obj.park_slot.section}-{obj.park_slot.slotNo}"
        return "N/A"
    
    def get_reserved_time(self, obj):
        """Get formatted time"""
        return "09:00"  # Default time for now
    
    def get_duration_hours(self, obj):
        """Get duration in hours"""
        return 2  # Default duration for now
    
    def get_slot_type(self, obj):
        """Get slot type"""
        if obj.park_slot:
            return obj.park_slot.slot_type
        return "regular"
    
    def get_parking_duration(self, obj):
        """Calculate parking duration in minutes"""
        if hasattr(obj, 'arrival_time') and obj.arrival_time:
            from django.utils import timezone
            duration = timezone.now() - obj.arrival_time
            return int(duration.total_seconds() / 60)
        return 0
        
    def validate(self, data):
        """Custom validation for reservations"""
        park_slot = data.get('park_slot')
        plate_no = data.get('plate_no')
        
        if park_slot and plate_no:
            # Check if slot is available
            if park_slot.status != 'available':
                raise serializers.ValidationError(f"Slot is not available. Current status: {park_slot.status}")
            
            # Check for existing reservations
            existing = Reservations.objects.filter(
                park_slot=park_slot,
                plate_no=plate_no,
                status__in=['pending', 'approved']
            ).exists()
            
            if existing:
                raise serializers.ValidationError("A reservation already exists for this slot and plate number")
        
        return data
        
    def create(self, validated_data):
        # Create the reservation
        reservation = super().create(validated_data)
        
        # Update slot status to reserved
        if reservation.park_slot.status == 'available':
            reservation.park_slot.status = 'reserved'
            reservation.park_slot.save()
        
        return reservation

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            try:
                user = User.objects.get(username=username)
                if check_password(password, user.password):
                    data['user'] = user
                    return data
                else:
                    raise serializers.ValidationError('Invalid credentials')
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
        else:
            raise serializers.ValidationError('Username and password required')

class CustomerReservationSerializer(serializers.Serializer):
    """Serializer for customer reservation requests"""
    park_slot = serializers.IntegerField()
    name = serializers.CharField(max_length=100)
    plate_no = serializers.CharField(max_length=20)
    mobileNo = serializers.CharField(max_length=20)
    date = serializers.DateField()
    
    def validate_park_slot(self, value):
        """Validate that the park slot exists and is available"""
        try:
            slot = ParkSlot.objects.get(id=value)
            if slot.status != 'available':
                raise serializers.ValidationError(f"Slot is not available. Current status: {slot.status}")
            return value
        except ParkSlot.DoesNotExist:
            raise serializers.ValidationError("Invalid park slot ID")
    
    def validate_plate_no(self, value):
        """Format plate number"""
        return value.upper().strip()

class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    totalSlots = serializers.IntegerField()
    availableSlots = serializers.IntegerField()
    occupiedSlots = serializers.IntegerField()
    reservations = serializers.IntegerField()
    todayRevenue = serializers.DecimalField(max_digits=10, decimal_places=2)

class PaymentReportsSerializer(serializers.Serializer):
    """Serializer for payment reports"""
    totalRevenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    transactions = serializers.IntegerField()
    avgTransaction = serializers.DecimalField(max_digits=15, decimal_places=2)
    peakHour = serializers.CharField(max_length=10)
    dailyData = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
