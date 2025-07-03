from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import check_password
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg
from django.db.models.functions import Extract
from .models import ParkSlot, Payment, User, Reservations
from .serializers import (
    ParkSlotSerializer, 
    PaymentSerializer, 
    UserSerializer, 
    ReservationsSerializer,
    LoginSerializer,
    SlotAssignmentSerializer,
    SystemSettingsSerializer,
    DashboardStatsSerializer,
    CheckoutSerializer,
    PaymentReportsSerializer
)

# System Settings Storage (In production, this would be in database)
SYSTEM_SETTINGS = {
    'regularHourlyRate': Decimal('50.00'),
    'vipHourlyRate': Decimal('100.00'),
    'disabledHourlyRate': Decimal('30.00'),
    'maxParkingHours': 24,
    'maxReservationDays': 7,
    'enableReservations': True,
    'enableNotifications': True,
}

# Authentication Views
@api_view(['POST'])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        user_data = UserSerializer(user).data
        return Response({
            'message': 'Login successful',
            'user': user_data,
            'token': f'token_{user.id}'  # Simple token for demo
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_view(request):
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

# System Settings Views
@api_view(['GET', 'PUT'])
def system_settings_view(request):
    if request.method == 'GET':
        return Response(SYSTEM_SETTINGS, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = SystemSettingsSerializer(data=request.data)
        if serializer.is_valid():
            # Update global settings
            SYSTEM_SETTINGS.update(serializer.validated_data)
            return Response(SYSTEM_SETTINGS, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def reset_system_settings(request):
    """Reset system settings to defaults"""
    global SYSTEM_SETTINGS
    SYSTEM_SETTINGS = {
        'regularHourlyRate': Decimal('50.00'),
        'vipHourlyRate': Decimal('100.00'),
        'disabledHourlyRate': Decimal('30.00'),
        'maxParkingHours': 24,
        'maxReservationDays': 7,
        'enableReservations': True,
        'enableNotifications': True,
    }
    return Response(SYSTEM_SETTINGS, status=status.HTTP_200_OK)

# ParkSlot ViewSet
class ParkSlotViewSet(viewsets.ModelViewSet):
    queryset = ParkSlot.objects.all()
    serializer_class = ParkSlotSerializer
    
    def get_queryset(self):
        queryset = ParkSlot.objects.all()
        status_filter = self.request.query_params.get('status', None)
        structure_filter = self.request.query_params.get('structure', None)
        slot_type_filter = self.request.query_params.get('slot_type', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if structure_filter:
            queryset = queryset.filter(structure=structure_filter)
        if slot_type_filter:
            queryset = queryset.filter(slot_type=slot_type_filter)
            
        return queryset.order_by('structure', 'section', 'slotNo')
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign a vehicle to a parking slot and create payment record"""
        try:
            slot = self.get_object()
            serializer = SlotAssignmentSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            if slot.status != 'available':
                return Response({
                    'error': f'Slot is not available. Current status: {slot.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            license_plate = serializer.validated_data['license_plate']
            
            # Get the regular hourly rate from system settings
            hourly_rate = SYSTEM_SETTINGS['regularHourlyRate']
            
            # Create payment record
            payment = Payment.objects.create(
                slot=slot,
                plate_no=license_plate,
                date=timezone.now().date(),
                amount=hourly_rate,
                mode_of_payment=None  # Will be updated later
            )
            
            # Update slot status
            slot.status = 'occupied'
            slot.save()
            
            # Return updated slot data
            slot_data = ParkSlotSerializer(slot).data
            
            return Response({
                'message': f'Vehicle {license_plate} assigned to slot',
                'slot': slot_data,
                'payment': {
                    'id': payment.recieptNo,
                    'amount': float(payment.amount),
                    'license_plate': payment.plate_no,
                    'start_time': payment.created_at.isoformat()
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to assign slot: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Checkout a vehicle from a parking slot"""
        try:
            slot = self.get_object()
            
            if slot.status != 'occupied':
                return Response({
                    'error': f'Slot is not occupied. Current status: {slot.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the most recent payment for this slot
            payment = Payment.objects.filter(slot=slot).order_by('-created_at').first()
            
            if not payment:
                return Response({
                    'error': 'No payment record found for this slot'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate checkout data
            serializer = CheckoutSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            payment_method = serializer.validated_data['payment_method']
            print_receipt = serializer.validated_data.get('print_receipt', False)
            
            # Calculate parking duration and fee
            start_time = payment.created_at
            end_time = timezone.now()
            duration = end_time - start_time
            duration_hours = max(1, int(duration.total_seconds() / 3600))  # Minimum 1 hour
            
            # Get hourly rate based on slot type
            if slot.slot_type == 'vip':
                hourly_rate = SYSTEM_SETTINGS['vipHourlyRate']
            elif slot.slot_type == 'disabled':
                hourly_rate = SYSTEM_SETTINGS['disabledHourlyRate']
            else:
                hourly_rate = SYSTEM_SETTINGS['regularHourlyRate']
            
            total_fee = hourly_rate * duration_hours
            
            # Update payment record
            payment.amount = total_fee
            payment.mode_of_payment = payment_method
            payment.save()
            
            # Update slot status
            slot.status = 'available'
            slot.save()
            
            # Prepare response data
            response_data = {
                'message': 'Vehicle checked out successfully',
                'slot_id': slot.id,
                'license_plate': payment.plate_no,
                'duration': f"{duration_hours}h {int((duration.total_seconds() % 3600) / 60)}m",
                'total_fee': float(total_fee),
                'payment_method': payment_method,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'receipt_printed': print_receipt
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to checkout vehicle: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        """Release a parking slot"""
        try:
            slot = self.get_object()
            
            if slot.status != 'occupied':
                return Response({
                    'error': f'Slot is not occupied. Current status: {slot.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update slot status
            slot.status = 'available'
            slot.save()
            
            # Return updated slot data
            slot_data = ParkSlotSerializer(slot).data
            
            return Response({
                'message': f'Slot has been released',
                'slot': slot_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to release slot: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def assign_vehicle(self, request, pk=None):
        """Legacy endpoint for backward compatibility"""
        return self.assign(request, pk)
    
    @action(detail=True, methods=['post'])
    def release_vehicle(self, request, pk=None):
        """Legacy endpoint for backward compatibility"""
        return self.release(request, pk)

# Payment ViewSet
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        queryset = Payment.objects.all().select_related('slot')
        date_filter = self.request.query_params.get('date', None)
        mode_filter = self.request.query_params.get('mode_of_payment', None)
        
        if date_filter:
            queryset = queryset.filter(date=date_filter)
        if mode_filter:
            queryset = queryset.filter(mode_of_payment=mode_filter)
            
        return queryset.order_by('-created_at')

# User ViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all()
        role_filter = self.request.query_params.get('role', None)
        
        if role_filter:
            queryset = queryset.filter(role=role_filter)
            
        return queryset.order_by('first_name', 'last_name')
    
    def create(self, request, *args, **kwargs):
        # Handle phone_number to phone_no field mapping
        data = request.data.copy()
        if 'phone_number' in data:
            data['phone_no'] = data.pop('phone_number')
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        try:
            # Handle phone_number to phone_no field mapping
            data = request.data.copy()
            if 'phone_number' in data:
                data['phone_no'] = data.pop('phone_number')
            
            # Remove confirmPassword if it exists
            if 'confirmPassword' in data:
                data.pop('confirmPassword')
            
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Debug logging
            print(f"Updating user {instance.id} with data: {data}")
            
            serializer = self.get_serializer(instance, data=data, partial=partial)
            if serializer.is_valid():
                self.perform_update(serializer)
                return Response(serializer.data)
            else:
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Update error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Custom delete method with proper error handling"""
        try:
            instance = self.get_object()
            username = instance.username
            self.perform_destroy(instance)
            return Response({
                'message': f'User {username} deleted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Failed to delete user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests for partial updates"""
        data = request.data.copy()
        if 'phone_number' in data:
            data['phone_no'] = data.pop('phone_number')
        
        # Remove confirmPassword if it exists
        if 'confirmPassword' in data:
            data.pop('confirmPassword')
        
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

# Reservations ViewSet
class ReservationsViewSet(viewsets.ModelViewSet):
    queryset = Reservations.objects.all()
    serializer_class = ReservationsSerializer
    
    def get_queryset(self):
        queryset = Reservations.objects.all().select_related('park_slot')
        status_filter = self.request.query_params.get('status', None)
        date_filter = self.request.query_params.get('date', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_filter:
            queryset = queryset.filter(date=date_filter)
            
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Create a new reservation with proper validation"""
        try:
            data = request.data.copy()
            
            # Validate that the slot exists and is available
            park_slot_id = data.get('park_slot')
            if not park_slot_id:
                return Response({
                    'error': 'park_slot field is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                park_slot = ParkSlot.objects.get(id=park_slot_id)
            except ParkSlot.DoesNotExist:
                return Response({
                    'error': 'Invalid park_slot ID'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if park_slot.status != 'available':
                return Response({
                    'error': f'Slot is not available. Current status: {park_slot.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if there's already a reservation for this slot and plate
            existing_reservation = Reservations.objects.filter(
                park_slot=park_slot,
                plate_no=data.get('plate_no'),
                status__in=['pending', 'approved']
            ).first()
            
            if existing_reservation:
                return Response({
                    'error': 'A reservation already exists for this slot and plate number'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                # Create the reservation
                reservation = serializer.save()
                
                # Update slot status to reserved
                park_slot.status = 'reserved'
                park_slot.save()
                
                return Response({
                    'message': 'Reservation created successfully',
                    'reservation': ReservationsSerializer(reservation).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': f'Failed to create reservation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a reservation"""
        try:
            reservation = self.get_object()
            
            if reservation.status != 'pending':
                return Response({
                    'error': 'Only pending reservations can be approved'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            reservation.status = 'approved'
            reservation.save()
            
            return Response({
                'message': 'Reservation approved successfully',
                'reservation': ReservationsSerializer(reservation).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to approve reservation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a reservation"""
        try:
            reservation = self.get_object()
            
            if reservation.status != 'pending':
                return Response({
                    'error': 'Only pending reservations can be rejected'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            reservation.status = 'rejected'
            reservation.save()
            
            # Make slot available again
            if reservation.park_slot.status == 'reserved':
                reservation.park_slot.status = 'available'
                reservation.park_slot.save()
            
            return Response({
                'message': 'Reservation rejected successfully',
                'reservation': ReservationsSerializer(reservation).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to reject reservation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a reservation"""
        try:
            reservation = self.get_object()
            
            if reservation.status not in ['approved', 'arrived']:
                return Response({
                    'error': 'Only approved or arrived reservations can be completed'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            reservation.status = 'completed'
            reservation.save()
            
            # Make slot available again
            reservation.park_slot.status = 'available'
            reservation.park_slot.save()
            
            return Response({
                'message': 'Reservation completed successfully',
                'reservation': ReservationsSerializer(reservation).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to complete reservation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def arrival(self, request, pk=None):
        """Record customer arrival"""
        try:
            reservation = self.get_object()
            
            if reservation.status != 'approved':
                return Response({
                    'error': 'Only approved reservations can record arrival'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set arrival time and update status to arrived
            reservation.arrival_time = timezone.now()
            reservation.status = 'arrived'
            reservation.save()
            
            # Update park slot status to occupied
            reservation.park_slot.status = 'occupied'
            reservation.park_slot.save()
            
            return Response({
                'message': 'Customer arrival recorded successfully',
                'reservation': ReservationsSerializer(reservation).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to record arrival: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Dashboard Stats View
@api_view(['GET'])
def dashboard_stats(request):
    try:
        # Get slot statistics
        total_slots = ParkSlot.objects.count()
        available_slots = ParkSlot.objects.filter(status='available').count()
        occupied_slots = ParkSlot.objects.filter(status='occupied').count()
        
        # Get reservation statistics (active reservations)
        active_reservations = Reservations.objects.filter(
            status__in=['pending', 'approved', 'arrived']
        ).count()
        
        # Calculate today's revenue
        today = timezone.now().date()
        today_payments = Payment.objects.filter(date=today)
        today_revenue = sum(payment.amount for payment in today_payments if payment.amount)
        
        # Prepare data in the format expected by frontend
        stats_data = {
            'totalSlots': total_slots,
            'availableSlots': available_slots,
            'occupiedSlots': occupied_slots,
            'reservations': active_reservations,
            'todayRevenue': float(today_revenue)
        }
        
        # Validate with serializer
        serializer = DashboardStatsSerializer(data=stats_data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': f'Failed to fetch dashboard stats: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Payment Reports View
@api_view(['GET'])
def payment_reports(request):
    try:
        # Get date range from query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Default to last 7 days if no date range provided
        if not start_date or not end_date:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=7)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get all payments within date range that have an amount
        # Remove the mode_of_payment filter to include all payments
        payments = Payment.objects.filter(
            date__range=[start_date, end_date],
            amount__isnull=False,  # Ensure amount is not null
            amount__gt=0  # Ensure amount is greater than 0
        )
        
        print(f"Date range: {start_date} to {end_date}")
        print(f"Found {payments.count()} payments")
        print(f"Payment amounts: {[float(p.amount) for p in payments]}")
        
        # Calculate total revenue
        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        print(f"Total revenue: {total_revenue}")
        
        # Calculate total transactions
        total_transactions = payments.count()
        
        # Calculate average transaction with proper handling
        if total_transactions > 0:
            avg_transaction = total_revenue / total_transactions
            # Round to 2 decimal places to avoid precision issues
            avg_transaction = round(float(avg_transaction), 2)
        else:
            avg_transaction = 0.0
        
        # Find peak hour using Django ORM functions
        try:
            peak_hour_data = payments.annotate(
                hour=Extract('created_at', 'hour')
            ).values('hour').annotate(
                count=Count('recieptNo')
            ).order_by('-count').first()
            
            peak_hour = f"{int(peak_hour_data['hour'])}:00" if peak_hour_data else "N/A"
        except Exception as e:
            print(f"Peak hour calculation error: {e}")
            peak_hour = "N/A"
        
        # Generate daily data for chart
        daily_data = []
        current_date = start_date
        while current_date <= end_date:
            day_payments = payments.filter(date=current_date)
            day_revenue = day_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            daily_data.append({
                'name': current_date.strftime('%a'),
                'revenue': float(day_revenue),
                'date': current_date.isoformat()
            })
            current_date += timedelta(days=1)
        
        # Prepare response data
        report_data = {
            'totalRevenue': float(total_revenue),
            'transactions': total_transactions,
            'avgTransaction': avg_transaction,
            'peakHour': peak_hour,
            'dailyData': daily_data
        }
        
        print(f"Report data: {report_data}")
        
        # Return data directly without serializer validation to avoid decimal precision issues
        return Response(report_data, status=status.HTTP_200_OK)
            
    except Exception as e:
        print(f"Payment reports error: {str(e)}")
        return Response({
            'error': f'Failed to fetch payment reports: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Available Slots for Customer View
@api_view(['GET'])
def available_slots(request):
    available_slots = ParkSlot.objects.filter(status='available')
    structure_filter = request.query_params.get('structure', None)
    
    if structure_filter:
        available_slots = available_slots.filter(structure=structure_filter)
    
    serializer = ParkSlotSerializer(available_slots, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
