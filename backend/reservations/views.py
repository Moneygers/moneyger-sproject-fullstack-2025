from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import Reservation
from .serializers import (ReservationSerializer, ReservationCreateSerializer, 
                         ReservationUpdateSerializer)
from accounts.permissions import IsStaffUser

class ReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing parking reservations
    Handles the complete reservation workflow
    """
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    
    def get_permissions(self):
        """Different permissions for different actions"""
        if self.action == 'create':
            # Anyone can create reservations (public endpoint)
            permission_classes = [AllowAny]
        else:
            # Staff required for other operations
            permission_classes = [IsStaffUser]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReservationUpdateSerializer
        return ReservationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date
        date_filter = self.request.query_params.get('date')
        if date_filter:
            queryset = queryset.filter(reserved_date=date_filter)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new reservation"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            reservation = serializer.save()
            return Response({
                'success': True,
                'message': 'Reservation created successfully',
                'data': ReservationSerializer(reservation).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Reservation creation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending reservation"""
        reservation = self.get_object()
        
        if reservation.approve(request.user):
            return Response({
                'success': True,
                'message': 'Reservation approved successfully',
                'data': ReservationSerializer(reservation).data
            })
        else:
            return Response({
                'success': False,
                'message': 'Cannot approve this reservation'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def arrive(self, request, pk=None):
        """Mark customer as arrived"""
        reservation = self.get_object()
        
        if reservation.mark_arrived(request.user):
            return Response({
                'success': True,
                'message': 'Customer arrival recorded successfully',
                'data': ReservationSerializer(reservation).data
            })
        else:
            return Response({
                'success': False,
                'message': 'Cannot process arrival for this reservation'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reservation"""
        reservation = self.get_object()
        
        if reservation.status in ['pending', 'approved', 'waiting']:
            reservation.status = 'cancelled'
            reservation.save()
            
            # Free up the slot if it was reserved
            if reservation.slot.status == 'reserved':
                reservation.slot.status = 'available'
                reservation.slot.save()
            
            return Response({
                'success': True,
                'message': 'Reservation cancelled successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'Cannot cancel this reservation'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get reservation statistics for dashboard"""
        today = timezone.now().date()
        
        stats = {
            'total_today': Reservation.objects.filter(reserved_date=today).count(),
            'pending': Reservation.objects.filter(status='pending').count(),
            'approved': Reservation.objects.filter(status='approved').count(),
            'active': Reservation.objects.filter(status='parked').count(),
            'completed_today': Reservation.objects.filter(
                reserved_date=today, status='completed'
            ).count(),
        }
        
        return Response({
            'success': True,
            'data': stats
        })
