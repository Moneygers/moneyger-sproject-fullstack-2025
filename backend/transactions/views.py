from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from .models import Transaction, ParkingFeeCalculator
from .serializers import TransactionSerializer, CheckoutSerializer
from parking.models import Allocation
from accounts.permissions import IsStaffUser, IsAdminUser

class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing financial transactions
    Handles payment processing and receipt generation
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsStaffUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Process vehicle checkout and payment"""
        serializer = CheckoutSerializer(data=request.data)
        
        if serializer.is_valid():
            allocation_id = serializer.validated_data['allocation_id']
            payment_method = serializer.validated_data['payment_method']
            
            try:
                allocation = Allocation.objects.get(id=allocation_id, is_active=True)
                
                # Calculate parking fee
                duration = allocation.duration_hours
                fee = ParkingFeeCalculator.calculate_fee(
                    allocation.slot.slot_type, 
                    duration
                )
                
                # Create transaction
                transaction = Transaction.objects.create(
                    allocation=allocation,
                    amount=fee,
                    transaction_type='parking_fee',
                    payment_method=payment_method,
                    customer_name=allocation.customer_name,
                    license_plate=allocation.license_plate,
                    processed_by=request.user
                )
                
                # Release the slot
                allocation.is_active = False
                allocation.save()
                
                allocation.slot.status = 'available'
                allocation.slot.save()
                
                return Response({
                    'success': True,
                    'message': 'Checkout completed successfully',
                    'data': {
                        'transaction': TransactionSerializer(transaction).data,
                        'receipt_number': transaction.receipt_number,
                        'amount': transaction.amount,
                        'duration_hours': duration
                    }
                })
                
            except Allocation.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Active allocation not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': False,
            'message': 'Invalid checkout data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def daily_revenue(self, request):
        """Get daily revenue summary"""
        today = timezone.now().date()
        
        revenue = Transaction.objects.filter(
            created_at__date=today
        ).aggregate(
            total_revenue=Sum('amount'),
            transaction_count=Count('id')
        )
        
        return Response({
            'success': True,
            'data': {
                'date': today,
                'total_revenue': revenue['total_revenue'] or 0,
                'transaction_count': revenue['transaction_count'] or 0
            }
        })
