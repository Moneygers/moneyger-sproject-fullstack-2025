from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import check_password, make_password
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg
from django.db.models.functions import Extract
from .models import ParkSlot, Payment, User, Reservations, ParkFee
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
import json
import os
from django.conf import settings

logger = logging.getLogger(__name__)

# Authentication Views
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
import logging
from .models import User, ParkSlot, Payment, Reservations, ParkFee
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

class AuthViewSet(viewsets.ViewSet):
    def create(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
def google_oauth_view(request):
    """Handle Google OAuth sign-in"""
    try:
        # Get the credential token from the request
        credential = request.data.get('credential')
        if not credential:
            return Response({
                'error': 'No credential provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Google Client ID and Secret
        GOOGLE_CLIENT_ID = "793231314826-duihujnitj4ch5s0n04mkejiaqnmutiv.apps.googleusercontent.com"
        GOOGLE_CLIENT_SECRET = "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"
        
        # Verify the token
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            
            idinfo = id_token.verify_oauth2_token(
                credential, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # Extract user information
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            google_id = idinfo.get('sub')
            
            if not email:
                return Response({
                    'error': 'Email not provided by Google'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user already exists
            try:
                user = User.objects.get(email=email)
                # User exists, log them in
                user_data = UserSerializer(user).data
                return Response({
                    'message': 'Login successful',
                    'user': user_data,
                    'token': f'token_{user.id}'
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                # Create new user account
                username = email.split('@')[0]  # Use email prefix as username
                counter = 1
                original_username = username
                
                # Ensure username is unique
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                # Create the user
                user = User.objects.create(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    username=username,
                    password=make_password(google_id),  # Use Google ID as password hash
                    phone_no='',  # Empty phone number for Google users
                    role='customer'
                )
                
                user_data = UserSerializer(user).data
                return Response({
                    'message': 'Account created and login successful',
                    'user': user_data,
                    'token': f'token_{user.id}'
                }, status=status.HTTP_201_CREATED)
                
        except ValueError as e:
            logger.error(f"Google token verification failed: {str(e)}")
            return Response({
                'error': f'Invalid Google token: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Google OAuth verification error: {str(e)}")
            return Response({
                'error': f'Token verification failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except ImportError as e:
        logger.error(f"Google OAuth library not installed: {str(e)}")
        return Response({
            'error': 'Google OAuth library not installed. Please install google-auth.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        return Response({
            'error': f'Google OAuth failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def logout_view(request):
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

# System Settings Views - Updated to use ParkFee database table
@api_view(['GET', 'PUT'])
def system_settings_view(request):
    if request.method == 'GET':
        try:
            # Get the latest park fee settings from database
            park_fee = ParkFee.objects.first()
            if park_fee:
                settings = {
                    'regularHourlyRate': float(park_fee.regular_hourly_rate),
                    'vipHourlyRate': float(park_fee.vip_hourly_rate),
                    'disabledHourlyRate': float(park_fee.disabled_hourly_rate),
                    'maxParkingHours': 24,
                    'maxReservationDays': 7,
                    'enableReservations': True,
                    'enableNotifications': True,
                }
            else:
                # Create default settings if none exist
                park_fee = ParkFee.objects.create(
                    regular_hourly_rate=50.00,
                    vip_hourly_rate=100.00,
                    disabled_hourly_rate=30.00
                )
                settings = {
                    'regularHourlyRate': 50.00,
                    'vipHourlyRate': 100.00,
                    'disabledHourlyRate': 30.00,
                    'maxParkingHours': 24,
                    'maxReservationDays': 7,
                    'enableReservations': True,
                    'enableNotifications': True,
                }
            return Response(settings, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PUT':
        try:
            serializer = SystemSettingsSerializer(data=request.data)
            if serializer.is_valid():
                # Update or create park fee record
                park_fee, created = ParkFee.objects.get_or_create(
                    defaults={
                        'regular_hourly_rate': serializer.validated_data['regularHourlyRate'],
                        'vip_hourly_rate': serializer.validated_data['vipHourlyRate'],
                        'disabled_hourly_rate': serializer.validated_data['disabledHourlyRate']
                    }
                )
                
                if not created:
                    park_fee.regular_hourly_rate = serializer.validated_data['regularHourlyRate']
                    park_fee.vip_hourly_rate = serializer.validated_data['vipHourlyRate']
                    park_fee.disabled_hourly_rate = serializer.validated_data['disabledHourlyRate']
                    park_fee.save()
                
                # Return updated settings
                updated_settings = {
                    'regularHourlyRate': float(park_fee.regular_hourly_rate),
                    'vipHourlyRate': float(park_fee.vip_hourly_rate),
                    'disabledHourlyRate': float(park_fee.disabled_hourly_rate),
                    'maxParkingHours': serializer.validated_data.get('maxParkingHours', 24),
                    'maxReservationDays': serializer.validated_data.get('maxReservationDays', 7),
                    'enableReservations': serializer.validated_data.get('enableReservations', True),
                    'enableNotifications': serializer.validated_data.get('enableNotifications', True),
                }
                return Response(updated_settings, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def reset_system_settings(request):
    """Reset system settings to defaults"""
    try:
        # Update or create park fee record with defaults
        park_fee, created = ParkFee.objects.get_or_create(
            defaults={
                'regular_hourly_rate': 50.00,
                'vip_hourly_rate': 100.00,
                'disabled_hourly_rate': 30.00
            }
        )
        
        if not created:
            park_fee.regular_hourly_rate = 50.00
            park_fee.vip_hourly_rate = 100.00
            park_fee.disabled_hourly_rate = 30.00
            park_fee.save()
        
        default_settings = {
            'regularHourlyRate': 50.00,
            'vipHourlyRate': 100.00,
            'disabledHourlyRate': 30.00,
            'maxParkingHours': 24,
            'maxReservationDays': 7,
            'enableReservations': True,
            'enableNotifications': True,
        }
        return Response(default_settings, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add new endpoint to get current parking rates
@api_view(['GET'])
def get_parking_rates(request):
    """Get current parking rates from database"""
    try:
        park_fee = ParkFee.objects.first()
        if park_fee:
            rates = {
                'regular': float(park_fee.regular_hourly_rate),
                'vip': float(park_fee.vip_hourly_rate),
                'disabled': float(park_fee.disabled_hourly_rate)
            }
        else:
            # Return default rates if no record exists
            rates = {
                'regular': 50.00,
                'vip': 100.00,
                'disabled': 30.00
            }
        return Response(rates, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            
        return queryset.order_by('id')
    
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
            
            # Get the hourly rate from database based on slot type
            park_fee = ParkFee.objects.first()
            if park_fee:
                if slot.slot_type == 'vip':
                    hourly_rate = park_fee.vip_hourly_rate
                elif slot.slot_type == 'disabled':
                    hourly_rate = park_fee.disabled_hourly_rate
                else:
                    hourly_rate = park_fee.regular_hourly_rate
            else:
                # Fallback to default rates
                hourly_rate = Decimal('50.00')
            
            # Create payment record with initial amount set to 0 (will be calculated on checkout)
            payment = Payment.objects.create(
                slot=slot,
                plate_no=license_plate,
                date=timezone.now().date(),
                amount=Decimal('0.00'),  # Set to 0, will be calculated on checkout
                mode_of_payment=None  # Will be updated on checkout
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
                    'start_time': payment.created_at.isoformat(),
                    'hourly_rate': float(hourly_rate)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to assign slot: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Checkout a vehicle from a parking slot - handles both payments and reservations separately"""
        try:
            slot = self.get_object()

            if slot.status != 'occupied':
                return Response({
                    'error': f'Slot is not occupied. Current status: {slot.status}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate checkout data
            serializer = CheckoutSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            payment_method = serializer.validated_data['payment_method']
            print_receipt = serializer.validated_data.get('print_receipt', False)

            # Check if this is a reservation or direct payment
            reservation = Reservations.objects.filter(
                park_slot=slot,
                status='arrived'
            ).order_by('-created_at').first()

            # Get hourly rate based on slot type from database
            park_fee = ParkFee.objects.first()
            if park_fee:
                if slot.slot_type == 'vip':
                    hourly_rate = park_fee.vip_hourly_rate
                elif slot.slot_type == 'disabled':
                    hourly_rate = park_fee.disabled_hourly_rate
                else:
                    hourly_rate = park_fee.regular_hourly_rate
            else:
                # Fallback to default rates if no park fee record exists
                if slot.slot_type == 'vip':
                    hourly_rate = Decimal('100.00')
                elif slot.slot_type == 'disabled':
                    hourly_rate = Decimal('30.00')
                else:
                    hourly_rate = Decimal('50.00')

            # Initial fee should be the same as the hourly rate from database
            initial_fee = hourly_rate

            if reservation:
                # This is a RESERVATION checkout - update reservation only, no payment record
                logger.info(f"Processing RESERVATION checkout for slot {slot.id}, reservation {reservation.id}")
                
                # Calculate parking duration and fee
                start_time = reservation.arrival_time
                end_time = timezone.now()
                duration = end_time - start_time
                
                # Calculate duration in minutes
                duration_minutes = int(duration.total_seconds() / 60)

                # Calculate total fee: initial fee + (minutes * hourly rate)
                additional_fee = duration_minutes * hourly_rate
                total_fee = initial_fee + additional_fee

                logger.info(f"Reservation checkout calculation: Initial fee: ₱{initial_fee} + ({duration_minutes} minutes * ₱{hourly_rate}/min) = ₱{initial_fee} + ₱{additional_fee} = ₱{total_fee}")

                # Update ONLY the reservation record
                reservation.status = 'completed'
                reservation.mode_of_payment = payment_method.lower()
                reservation.fee = total_fee
                reservation.save()

                # Update slot status
                slot.status = 'available'
                slot.save()

                # Format duration for response
                duration_hours = duration_minutes // 60
                duration_mins = duration_minutes % 60
                duration_formatted = f"{duration_hours}h {duration_mins}m"

                # Prepare response data
                response_data = {
                    'slot_id': slot.id,
                    'license_plate': reservation.plate_no,
                    'customer_name': reservation.name,
                    'duration': duration_formatted,
                    'duration_minutes': duration_minutes,
                    'initial_fee': float(initial_fee),
                    'additional_fee': float(additional_fee),
                    'total_fee': float(total_fee),
                    'payment_method': payment_method,
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'receipt_printed': print_receipt,
                    'reservation_updated': True,
                    'payment_created': False,
                    'checkout_type': 'reservation',
                    'hourly_rate': float(hourly_rate)
                }

                return Response(response_data, status=status.HTTP_200_OK)

            else:
                # This is a DIRECT PAYMENT checkout - update payment record only
                payment = Payment.objects.filter(slot=slot).order_by('-created_at').first()

                if not payment:
                    return Response({
                        'error': 'No payment record found for this slot'
                    }, status=status.HTTP_400_BAD_REQUEST)

                logger.info(f"Processing PAYMENT checkout for slot {slot.id}, payment {payment.recieptNo}")

                # Calculate parking duration and fee
                start_time = payment.created_at
                end_time = timezone.now()
                duration = end_time - start_time
                
                # Calculate duration in minutes
                duration_minutes = int(duration.total_seconds() / 60)

                # Calculate total fee: initial fee + (minutes * hourly rate)
                additional_fee = duration_minutes * hourly_rate
                total_fee = initial_fee + additional_fee

                logger.info(f"Payment checkout calculation: Initial fee: ₱{initial_fee} + ({duration_minutes} minutes * ₱{hourly_rate}/min) = ₱{initial_fee} + ₱{additional_fee} = ₱{total_fee}")

                # Update ONLY the payment record
                payment.amount = total_fee
                payment.mode_of_payment = payment_method.lower()
                payment.save()

                # Update slot status
                slot.status = 'available'
                slot.save()

                # Format duration for response
                duration_hours = duration_minutes // 60
                duration_mins = duration_minutes % 60
                duration_formatted = f"{duration_hours}h {duration_mins}m"

                # Prepare response data
                response_data = {
                    'slot_id': slot.id,
                    'license_plate': payment.plate_no,
                    'customer_name': None,
                    'duration': duration_formatted,
                    'duration_minutes': duration_minutes,
                    'initial_fee': float(initial_fee),
                    'additional_fee': float(additional_fee),
                    'total_fee': float(total_fee),
                    'payment_method': payment_method,
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'receipt_printed': print_receipt,
                    'reservation_updated': False,
                    'payment_created': True,
                    'checkout_type': 'payment',
                    'hourly_rate': float(hourly_rate)
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Checkout error: {str(e)}")
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

            # Check for active reservation first
            reservation = Reservations.objects.filter(
                park_slot=slot,
                status='arrived'
            ).order_by('-created_at').first()

            if reservation:
                current_allocation = {
                    'license_plate': reservation.plate_no,
                    'start_time': reservation.arrival_time.isoformat(),
                    'customer_name': reservation.name,
                    'source': 'reservation'
                }
            else:
                # Fallback to payment record
                payment = Payment.objects.filter(slot=slot).order_by('-created_at').first()
                if payment:
                    current_allocation = {
                        'license_plate': payment.plate_no,
                        'start_time': payment.created_at.isoformat(),
                        'customer_name': None,
                        'source': 'payment'
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
        """Record customer arrival, assign initial fee, and send SMS confirmation"""
        try:
            reservation = self.get_object()

            if reservation.status != 'approved':
                return Response({
                    'error': 'Only approved reservations can record arrival'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get initial fee from database based on slot type (same as hourly rate)
            park_fee = ParkFee.objects.first()
            if park_fee:
                if reservation.park_slot.slot_type == 'vip':
                    initial_fee = park_fee.vip_hourly_rate
                elif reservation.park_slot.slot_type == 'disabled':
                    initial_fee = park_fee.disabled_hourly_rate
                else:
                    initial_fee = park_fee.regular_hourly_rate
            else:
                initial_fee = Decimal('50.00')

            # Set arrival time
            arrival_time = timezone.now()
            reservation.arrival_time = arrival_time

            # Set initial fee on arrival (same as hourly rate)
            reservation.fee = initial_fee

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

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reservation and make slot available again"""
        try:
            reservation = self.get_object()
            
            if reservation.status not in ['pending', 'approved']:
                return Response({
                    'error': 'Only pending or approved reservations can be cancelled'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update reservation status
            reservation.status = 'cancelled'
            reservation.save()
            
            # Make slot available again
            if reservation.park_slot.status == 'reserved':
                reservation.park_slot.status = 'available'
                reservation.park_slot.save()
            
            return Response({
                'message': 'Reservation cancelled successfully',
                'reservation': ReservationsSerializer(reservation).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to cancel reservation {pk}: {str(e)}")
            return Response({
                'error': f'Failed to cancel reservation: {str(e)}'
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

        # Payments made today (only completed payments with payment method)
        today_payments = Payment.objects.filter(
            date=today,
            mode_of_payment__isnull=False,
            amount__gt=0
        ).exclude(mode_of_payment='')
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

        # 2. Fetch valid payments and reservations separately
        payments = Payment.objects.filter(
            date__range=[start_date, end_date],
            amount__isnull=False,
            amount__gt=0,
            mode_of_payment__isnull=False  # Only payments with payment method set
        ).exclude(mode_of_payment='')  # Exclude empty payment methods

        reservations = Reservations.objects.filter(
            date__range=[start_date, end_date],
            status='completed',  # Only completed reservations
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
            'totalPayment': float(payment_total),
            'totalReservation': float(reservation_total),
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

# Review Transactions Endpoint - Only completed reservations and payments with mode_of_payment
@api_view(['GET'])
def transaction_reports(request):
    """
    Return only completed transactions:
    - Reservations with status='completed' 
    - Payments with mode_of_payment set (not null/empty)
    """
    try:
        # Apply date filters if provided
        date_filter = request.query_params.get('date_filter', 'all')
        type_filter = request.query_params.get('type_filter', 'all')
        
        # Calculate date range based on filter
        today = timezone.now().date()
        if date_filter == 'today':
            start_date = today
            end_date = today
        elif date_filter == 'week':
            start_date = today - timedelta(days=7)
            end_date = today
        elif date_filter == 'month':
            start_date = today - timedelta(days=30)
            end_date = today
        else:
            start_date = None
            end_date = None

        # Fetch only payments with mode_of_payment set (completed transactions)
        payments_query = Payment.objects.select_related('slot').filter(
            mode_of_payment__isnull=False
        ).exclude(mode_of_payment='')
        
        if start_date and end_date:
            payments_query = payments_query.filter(date__range=[start_date, end_date])
        
        # Fetch only completed reservations
        reservations_query = Reservations.objects.select_related('park_slot').filter(
            status='completed'
        )
        if start_date and end_date:
            reservations_query = reservations_query.filter(date__range=[start_date, end_date])

        # Convert to list format expected by frontend
        transactions = []
        
        # Process payments (only those with payment method set)
        if type_filter in ['all', 'parking_fee']:
            for payment in payments_query:
                # Calculate duration if possible
                duration = "N/A"
                if hasattr(payment, 'created_at'):
                    # This is a simplified duration calculation
                    duration = "1h+"  # Default since we don't track end time in payments
                
                transactions.append({
                    'id': f"payment_{payment.recieptNo}",
                    'receipt_number': f"PAY-{payment.recieptNo}",
                    'transaction_type': 'parking_fee',
                    'payment_method': payment.mode_of_payment,
                    'amount': float(payment.amount) if payment.amount else 0.0,
                    'license_plate': payment.plate_no,
                    'duration': duration,
                    'status': 'Completed',
                    'created_at': payment.created_at.isoformat() if hasattr(payment, 'created_at') else payment.date.isoformat(),
                    'slot_info': f"F{payment.slot.structure.replace('FLOOR', '') if payment.slot.structure else '1'}-{payment.slot.section}-{payment.slot.slotNo}" if payment.slot else "N/A"
                })

        # Process completed reservations only
        if type_filter in ['all', 'reservation_fee']:
            for reservation in reservations_query:
                # Calculate duration if arrival_time exists
                duration = "N/A"
                if reservation.arrival_time:
                    # Calculate duration from arrival to completion (simplified)
                    duration = "2h+"  # Default duration
                
                # Only include reservations with fees
                if reservation.fee and reservation.fee > 0:
                    transactions.append({
                        'id': f"reservation_{reservation.id}",
                        'receipt_number': f"RES-{reservation.id}",
                        'transaction_type': 'reservation_fee',
                        'payment_method': reservation.mode_of_payment or 'cash',
                        'amount': float(reservation.fee),
                        'license_plate': reservation.plate_no,
                        'duration': duration,
                        'status': 'Completed',
                        'created_at': reservation.created_at.isoformat(),
                        'slot_info': f"F{reservation.park_slot.structure.replace('FLOOR', '') if reservation.park_slot.structure else '1'}-{reservation.park_slot.section}-{reservation.park_slot.slotNo}" if reservation.park_slot else "N/A",
                        'customer_name': reservation.name
                    })

        # Sort by created_at (most recent first)
        transactions.sort(key=lambda x: x['created_at'], reverse=True)

        logger.info(f"Transaction reports: Found {len(transactions)} completed transactions")

        return Response(transactions, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in transaction_reports: {str(e)}")
        return Response({
            'error': f'Failed to fetch transaction reports: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Profanity checker
@api_view(['POST'])
def profanity(request):
    """
    API endpoint that checks if input text contains profanity
    Expects JSON: {"text": "your text here"}
    Returns: {"profanity": true/false, "message": "...", "detected": [...], "text": "..."}
    """
    try:
        # Get the input text from request
        text = request.data.get('text', '')
        
        if not text:
            return Response({
                'error': 'No text provided',
                'profanity': False,
                'detected': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Load profanity words from JSON file
        profane_words = load_profane_words()
        
        # Check if any profane words are in the text and collect them
        is_profane, detected_words = check_profanity(text.lower(), profane_words)
        
        return Response({
            'profanity': is_profane,
            'message': 'Profanity detected' if is_profane else 'No profanity detected',
            'detected': detected_words,
            'text': text
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'profanity': False,
            'detected': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def load_profane_words():
    """
    Load profane words from JSON file
    """
    try:
        json_path = os.path.join(settings.BASE_DIR, 'profane-words-english.json')
        
        with open(json_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        if isinstance(data, list):
            return [word.lower() for word in data]
        elif isinstance(data, dict):
            if 'words' in data:
                return [word.lower() for word in data['words']]
            elif 'profanity' in data:
                return [word.lower() for word in data['profanity']]
            else:
                for value in data.values():
                    if isinstance(value, list):
                        return [word.lower() for word in value]
        
        return []
        
    except FileNotFoundError:
        raise Exception("profane-words-english.json file not found")
    except json.JSONDecodeError:
        raise Exception("Invalid JSON format in profane-words-english.json")


def check_profanity(text, profane_words):
    """
    Check if text contains any profane words and return detected ones
    """
    words = text.split()
    detected = set()

    for word in words:
        clean_word = ''.join(char for char in word if char.isalnum()).lower()
        if clean_word in profane_words:
            detected.add(clean_word)

    # Also check if any profane word is a substring of the text
    for profane_word in profane_words:
        if profane_word in text and profane_word not in detected:
            detected.add(profane_word)

    return bool(detected), list(detected)
