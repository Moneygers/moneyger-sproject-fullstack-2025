from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count, Q
from .models import ParkingSlot, Allocation, ParkingRate
from .serializers import (ParkingSlotSerializer, AllocationSerializer, 
                         AllocationCreateSerializer, ParkingRateSerializer)
from accounts.permissions import IsStaffUser, IsAdminUser

class ParkingSlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing parking slots
    Provides CRUD operations and availability checking
    """
    queryset = ParkingSlot.objects.all()
    serializer_class = ParkingSlotSerializer
    
    def get_permissions(self):
        """Different permissions for different actions"""
        if self.action in ['list', 'retrieve', 'public_availability', 'availability_summary']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsStaffUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by floor
        floor = self.request.query_params.get('floor')
        if floor:
            queryset = queryset.filter(floor=floor)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by section
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section=section)
        
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def availability_summary(self, request):
        """Get parking availability summary by floor"""
        summary = []
        for floor in range(1, 5):
            floor_slots = ParkingSlot.objects.filter(floor=floor)
            total = floor_slots.count()
            available = floor_slots.filter(status='available').count()
            occupied = floor_slots.filter(status='occupied').count()
            reserved = floor_slots.filter(status='reserved').count()
            
            summary.append({
                'floor': floor,
                'total': total,
                'available': available,
                'occupied': occupied,
                'reserved': reserved,
                'occupancy_rate': round((occupied / total * 100) if total > 0 else 0, 2)
            })
        
        return Response({
            'success': True,
            'data': summary
        })
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_availability(self, request):
        """Public endpoint for checking availability (no auth required)"""
        slots = ParkingSlot.objects.select_related().all()
        serializer = self.get_serializer(slots, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        """Allocate a parking slot to a vehicle"""
        slot = self.get_object()
        
        if not slot.is_available():
            return Response({
                'success': False,
                'message': 'Slot is not available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AllocationCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            allocation = serializer.save()
            return Response({
                'success': True,
                'message': 'Slot allocated successfully',
                'data': AllocationSerializer(allocation).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Allocation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        """Release an occupied parking slot"""
        slot = self.get_object()
        
        try:
            allocation = slot.current_allocation
            if allocation.is_active:
                allocation.is_active = False
                allocation.save()
                
                slot.status = 'available'
                slot.save()
                
                return Response({
                    'success': True,
                    'message': 'Slot released successfully'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'No active allocation found'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Allocation.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No allocation found for this slot'
            }, status=status.HTTP_400_BAD_REQUEST)

class AllocationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing parking allocations"""
    queryset = Allocation.objects.filter(is_active=True)
    serializer_class = AllocationSerializer
    permission_classes = [IsStaffUser]
    
    @action(detail=False, methods=['get'])
    def active_count(self, request):
        """Get count of active allocations"""
        count = self.get_queryset().count()
        return Response({
            'success': True,
            'data': {'active_allocations': count}
        })

class ParkingRateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing parking rates"""
    queryset = ParkingRate.objects.all()
    serializer_class = ParkingRateSerializer
    permission_classes = [IsAdminUser]
