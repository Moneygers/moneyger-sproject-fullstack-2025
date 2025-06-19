from rest_framework import serializers
from .models import Reservation
from parking.serializers import ParkingSlotSerializer

class ReservationSerializer(serializers.ModelSerializer):
    """Serializer for reservation data"""
    slot_details = ParkingSlotSerializer(source='slot', read_only=True)
    reserved_datetime = serializers.ReadOnlyField()
    
    class Meta:
        model = Reservation
        fields = ['id', 'slot', 'slot_details', 'customer_name', 'phone_number',
                 'email', 'license_plate', 'reserved_date', 'reserved_time', 'duration_hours',
                 'status', 'created_at', 'approved_at', 'arrival_time', 
                 'parking_duration', 'reserved_datetime']

class ReservationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reservations"""
    class Meta:
        model = Reservation
        fields = ['slot', 'customer_name', 'phone_number', 'email', 'license_plate',
                 'reserved_date', 'reserved_time', 'duration_hours']
    
    def validate(self, attrs):
        # Check if slot is available for the requested time
        slot = attrs['slot']
        reserved_date = attrs['reserved_date']
        reserved_time = attrs['reserved_time']
        
        # Check for conflicting reservations
        conflicting = Reservation.objects.filter(
            slot=slot,
            reserved_date=reserved_date,
            status__in=['approved', 'waiting', 'parked']
        ).exists()
        
        if conflicting:
            raise serializers.ValidationError("Slot is already reserved for this time")
        
        return attrs

class ReservationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating reservation status"""
    class Meta:
        model = Reservation
        fields = ['status', 'parking_duration']
        read_only_fields = ['status']  # Status changes handled by specific actions
