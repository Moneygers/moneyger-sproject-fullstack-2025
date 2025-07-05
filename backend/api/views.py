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
from .services import sms_service
import logging
import threading

logger = logging.getLogger(__name__)

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
                # Fallback: Try to find a recent reservation with 'arrived' or 'approved' status
                reservation = Reservations.objects.filter(
                    park_slot=slot,
                    status__in=['arrived', 'approved']
                ).order_by('-created_at').first()

                if not reservation:
                    return Response({
                        'error': 'No payment or valid reservation record found for this slot'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Simulate a payment object from reservation (temporary for fee calculation and response)
                class TempPayment:
                    plate_no = reservation.plate_no
                    created_at = reservation.arrival_time or reservation.created_at
                    recieptNo = None
                    customer_name = reservation.name
                    amount = 0
                    mode_of_payment = None
                    def save(self): pass  # Do nothing

                payment = TempPayment()


            # Validate checkout data
            serializer = CheckoutSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            payment_method = serializer.validated_data['payment_method']
            print(payment_method)
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
            payment.mode_of_payment = payment_method.lower()
            payment.save()

            # Update slot status
            slot.status = 'available'
            slot.save()

            # ✅ Automatically complete reservation if one exists
            reservation = Reservations.objects.filter(
                park_slot=slot,
                status__in=['approved', 'arrived']
            ).order_by('-created_at').first()

            if reservation:
                reservation.status = 'completed'
                reservation.mode_of_payment = payment_method.lower()
                reservation.fee = total_fee
                reservation.save()

            # Prepare response data
            response_data = {
                'slot_id': slot.id,
                'license_plate': payment.plate_no,
                'duration': f"{duration_hours}h {int((duration.total_seconds() % 3600) / 60)}m",
                'total_fee': float(total_fee),
                'payment_method': payment_method,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'receipt_printed': print_receipt,
                'reservation_updated': bool(reservation)
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

    @action(detail=False, methods=['get'], url_path='occupied-detailed')
    def occupied_detailed(self, request):
        """Return occupied slots with current_allocation info (either from Reservations or Payments)"""
        occupied_slots = ParkSlot.objects.filter(status='occupied')
        enriched_slots = []

        for slot in occupied_slots:
            current_allocation = None

            # Check for active reservation
            reservation = Reservations.objects.filter(
                park_slot=slot,
                status='arrived'
            ).order_by('-created_at').first()

            if reservation:
                current_allocation = {
                    'license_plate': reservation.plate_no,
                    'start_time': reservation.arrival_time.isoformat(),
                    'customer_name': reservation.name
                }
            else:
                # Fallback to payment record
                payment = Payment.objects.filter(slot=slot).order_by('-created_at').first()
                if payment:
                    current_allocation = {
                        'license_plate': payment.plate_no,
                        'start_time': payment.created_at.isoformat(),
                        'customer_name': None
                    }

            enriched_slots.append({
                'id': slot.id,
                'slotNo': slot.slotNo,
                'structure': slot.structure,
                'section': slot.section,
                'slot_type': slot.slot_type,
                'status': slot.status,
                'display_id': getattr(slot, 'display_id', None),
                'floor': getattr(slot, 'floor', None),
                'current_allocation': current_allocation
            })

        return Response(enriched_slots)

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
                'success': True
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

def send_sms_async(reservation, sms_type):
    """Send SMS in background thread to avoid blocking the response"""
    try:
        if sms_type == 'approved':
            sms_service.send_reservation_approved_sms(reservation)
        elif sms_type == 'rejected':
            sms_service.send_reservation_rejected_sms(reservation)
        elif sms_type == 'arrival':
            sms_service.send_arrival_confirmation_sms(reservation)
    except Exception as e:
        logger.error(f"Background SMS error for reservation {reservation.id}: {str(e)}")

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
                
                logger.info(f"New reservation created: ID {reservation.id}, Phone: {reservation.mobileNo}")
                
                return Response({
                    'reservation': ReservationsSerializer(reservation).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Failed to create reservation: {str(e)}")
            return Response({
                'error': f'Failed to create reservation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a reservation and send SMS notification"""
        try:
            reservation = self.get_object()
            
            if reservation.status != 'pending':
                return Response({
                    'error': 'Only pending reservations can be approved'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update reservation status first
            reservation.status = 'approved'
            reservation.save()
            
            # Send immediate success response
            response_data = {
                'message': 'Reservation approved successfully',
                'reservation': ReservationsSerializer(reservation).data
            }
            
            # Send SMS in background thread to avoid blocking
            sms_thread = threading.Thread(target=send_sms_async, args=(reservation, 'approved'))
            sms_thread.daemon = True
            sms_thread.start()
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to approve reservation {pk}: {str(e)}")
            return Response({
                'error': f'Failed to approve reservation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a reservation and send SMS notification"""
        try:
            reservation = self.get_object()
            
            if reservation.status != 'pending':
                return Response({
                    'error': 'Only pending reservations can be rejected'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update reservation status first
            reservation.status = 'rejected'
            reservation.save()
            
            # Make slot available again
            if reservation.park_slot.status == 'reserved':
                reservation.park_slot.status = 'available'
                reservation.park_slot.save()
            
            # Send immediate success response
            response_data = {
                'message': 'Reservation rejected successfully',
                'reservation': ReservationsSerializer(reservation).data
            }
            
            # Send SMS in background thread to avoid blocking
            sms_thread = threading.Thread(target=send_sms_async, args=(reservation, 'rejected'))
            sms_thread.daemon = True
            sms_thread.start()
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to reject reservation {pk}: {str(e)}")
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
                'reservation': ReservationsSerializer(reservation).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to complete reservation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def arrival(self, request, pk=None):
        """Record customer arrival, assign fee, and send SMS confirmation"""
        try:
            reservation = self.get_object()

            if reservation.status != 'approved':
                return Response({
                    'error': 'Only approved reservations can record arrival'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get hourly rate
            hourly_rate = SYSTEM_SETTINGS['regularHourlyRate']

            # Set arrival time
            arrival_time = timezone.now()
            reservation.arrival_time = arrival_time

            # For now, set fee to 1 hour's rate on arrival — final adjustment can happen on checkout
            reservation.fee = hourly_rate

            # Update reservation status
            reservation.status = 'arrived'
            reservation.save()

            # Update park slot status
            reservation.park_slot.status = 'occupied'
            reservation.park_slot.save()

            # Send immediate success response
            response_data = {
                'message': 'Customer arrival recorded successfully',
                'reservation': ReservationsSerializer(reservation).data
            }
            
            # Send SMS in background thread to avoid blocking
            sms_thread = threading.Thread(target=send_sms_async, args=(reservation, 'arrival'))
            sms_thread.daemon = True
            sms_thread.start()

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Failed to record arrival for reservation {pk}: {str(e)}")
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

        # Payments made today
        today_payments = Payment.objects.filter(date=today)
        payment_total = today_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')

        # Completed reservations today
        today_reservations = Reservations.objects.filter(
            date=today,
            status='completed',
            fee__isnull=False,
            fee__gt=0
        )
        reservation_total = today_reservations.aggregate(total=Sum('fee'))['total'] or Decimal('0')

        # Combined revenue
        today_revenue = payment_total + reservation_total

        
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
        # 1. Date range handling
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=7)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # 2. Fetch valid payments and reservations
        payments = Payment.objects.filter(
            date__range=[start_date, end_date],
            amount__isnull=False,
            amount__gt=0
        )

        reservations = Reservations.objects.filter(
            date__range=[start_date, end_date],
            status='completed',
            fee__isnull=False,
            fee__gt=0
        )

        # 3. Compute totals
        payment_total = payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        reservation_total = reservations.aggregate(total=Sum('fee'))['total'] or Decimal('0')
        total_revenue = payment_total + reservation_total

        total_transactions = payments.count() + reservations.count()

        if total_transactions > 0:
            avg_transaction = round(float(total_revenue) / total_transactions, 2)
        else:
            avg_transaction = 0.0

        # 4. Peak hour from Payment (we assume Reservations are handled via checkout, so peak is only for Payments)
        try:
            peak_hour_data = payments.annotate(
                hour=Extract('created_at', 'hour')
            ).values('hour').annotate(
                count=Count('recieptNo')
            ).order_by('-count').first()

            peak_hour = f"{int(peak_hour_data['hour']):02d}:00" if peak_hour_data else "N/A"
        except Exception as e:
            print(f"Peak hour calc failed: {e}")
            peak_hour = "N/A"

        # 5. Daily revenue: combine both
        daily_data = []
        current_date = start_date
        while current_date <= end_date:
            day_payment_total = payments.filter(date=current_date).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            day_reservation_total = reservations.filter(date=current_date).aggregate(total=Sum('fee'))['total'] or Decimal('0')
            daily_data.append({
                'name': current_date.strftime('%a'),
                'revenue': float(day_payment_total + day_reservation_total),
                'date': current_date.isoformat()
            })
            current_date += timedelta(days=1)

        # 6. Response
        return Response({
            'totalRevenue': float(total_revenue),
            'transactions': total_transactions,
            'avgTransaction': avg_transaction,
            'peakHour': peak_hour,
            'dailyData': daily_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error in payment_reports: {str(e)}")
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

# Test SMS endpoint for debugging
@api_view(['POST'])
def test_sms(request):
    """Test endpoint to send SMS via TextBee with enhanced error reporting"""
    try:
        phone_number = request.data.get('phone_number')
        message = request.data.get('message', 'Test message from MoneyGers Parking System via TextBee! 🚗📱')
        
        if not phone_number:
            return Response({
                'error': 'phone_number is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"🧪 Testing SMS via TextBee to {phone_number}")
        
        # Get service status first
        service_status = sms_service.get_service_status()
        
        # Send test SMS
        success = sms_service.send_sms(phone_number, message)
        
        return Response({
            'success': success,
            'message': 'SMS sent successfully via TextBee! Check your phone.' if success else 'Failed to send SMS via TextBee. Check logs for details.',
            'phone_number': phone_number,
            'formatted_number': sms_service.format_phone_number(phone_number),
            'service_status': service_status,
            'sms_service': 'TextBee',
            'troubleshooting': {
                'api_key_note': 'Make sure TEXTBEE_API_KEY is set correctly',
                'device_id_note': 'Make sure TEXTBEE_DEVICE_ID is set correctly',
                'device_status_note': 'Check if your TextBee device is online and connected',
                'common_issues': [
                    'Invalid API key or Device ID',
                    'TextBee device is offline',
                    'Insufficient credits in TextBee account',
                    'Network connectivity issues'
                ]
            }
        }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Test SMS error: {str(e)}")
        return Response({
            'error': f'Failed to send test SMS: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# TextBee service info endpoint
@api_view(['GET'])
def textbee_service_info(request):
    """Get TextBee service information for debugging"""
    try:
        service_status = sms_service.get_service_status()
        
        return Response({
            'service_status': service_status,
            'configuration_help': {
                'step_1': 'Set TEXTBEE_API_KEY in your environment variables',
                'step_2': 'Set TEXTBEE_DEVICE_ID in your environment variables',
                'step_3': 'Make sure your TextBee device is online',
                'step_4': 'Test SMS using the test-sms endpoint',
                'step_5': 'Check TextBee dashboard for device status and credits'
            },
            'common_401_fixes': [
                'Verify API key is correct (check TextBee dashboard)',
                'Verify Device ID is correct (check TextBee dashboard)',
                'Ensure device is online and connected',
                'Check if API key has proper permissions',
                'Verify account has sufficient credits'
            ]
        })
            
    except Exception as e:
        return Response({
            'error': f'Failed to get service info: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
