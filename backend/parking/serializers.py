from rest_framework import serializers
from .models import ParkingSlot, Allocation, ParkingRate

class ParkingSlotSerializer(serializers.ModelSerializer):
    """Serializer for parking slot data"""
    slot_id = serializers.ReadOnlyField()
    current_allocation = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkingSlot
        fields = ['id', 'floor', 'section', 'slot_number', 'slot_type', 
                 'status', 'slot_id', 'current_allocation', 'created_at']
    
    def get_current_allocation(self, obj):
        try:
            if hasattr(obj, 'current_allocation') and obj.current_allocation.is_active:
                return AllocationSerializer(obj.current_allocation).data
        except Allocation.DoesNotExist:
            pass
        return None

class AllocationSerializer(serializers.ModelSerializer):
    """Serializer for parking allocations"""
    slot_details = ParkingSlotSerializer(source='slot', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = Allocation
        fields = ['id', 'slot', 'slot_details', 'license_plate', 'customer_name',
                 'phone_number', 'start_time', 'duration_hours', 'is_active']

class AllocationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new allocations"""
    class Meta:
        model = Allocation
        fields = ['slot', 'license_plate', 'customer_name', 'phone_number']
    
    def validate_slot(self, value):
        if not value.is_available():
            raise serializers.ValidationError("Slot is not available")
        return value
    
    def create(self, validated_data):
        # Update slot status to occupied
        slot = validated_data['slot']
        slot.status = 'occupied'
        slot.save()
        
        # Create allocation
        allocation = Allocation.objects.create(
            allocated_by=self.context['request'].user,
            **validated_data
        )
        return allocation

class ParkingRateSerializer(serializers.ModelSerializer):
    """Serializer for parking rates"""
    class Meta:
        model = ParkingRate
        fields = ['id', 'slot_type', 'hourly_rate', 'max_hours']
