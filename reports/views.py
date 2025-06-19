from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from transactions.models import Transaction
from parking.models import ParkingSlot, Allocation
from reservations.models import Reservation
from accounts.permissions import IsAdminUser

class RevenueReportView(APIView):
    """
    Generate revenue reports and analytics
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Get date range from query params
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Daily revenue breakdown
        daily_revenue = []
        current_date = start_date
        
        while current_date <= end_date:
            day_revenue = Transaction.objects.filter(
                created_at__date=current_date
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            daily_revenue.append({
                'date': current_date,
                'revenue': float(day_revenue)
            })
            current_date += timedelta(days=1)
        
        # Payment method breakdown
        payment_methods = Transaction.objects.filter(
            created_at__date__gte=start_date
        ).values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return Response({
            'success': True,
            'data': {
                'period': f'{start_date} to {end_date}',
                'daily_revenue': daily_revenue,
                'payment_methods': list(payment_methods),
                'total_revenue': sum(day['revenue'] for day in daily_revenue)
            }
        })

class OccupancyReportView(APIView):
    """
    Generate occupancy and utilization reports
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Current occupancy
        total_slots = ParkingSlot.objects.count()
        occupied_slots = ParkingSlot.objects.filter(status='occupied').count()
        reserved_slots = ParkingSlot.objects.filter(status='reserved').count()
        available_slots = ParkingSlot.objects.filter(status='available').count()
        
        # Occupancy by floor
        floor_occupancy = []
        for floor in range(1, 5):
            floor_slots = ParkingSlot.objects.filter(floor=floor)
            floor_total = floor_slots.count()
            floor_occupied = floor_slots.filter(status='occupied').count()
            
            floor_occupancy.append({
                'floor': floor,
                'total': floor_total,
                'occupied': floor_occupied,
                'occupancy_rate': round((floor_occupied / floor_total * 100) if floor_total > 0 else 0, 2)
            })
        
        # Average parking duration
        avg_duration = Allocation.objects.filter(
            is_active=False
        ).aggregate(avg_duration=Avg('duration_hours'))
        
        return Response({
            'success': True,
            'data': {
                'current_occupancy': {
                    'total_slots': total_slots,
                    'occupied': occupied_slots,
                    'reserved': reserved_slots,
                    'available': available_slots,
                    'occupancy_rate': round((occupied_slots / total_slots * 100) if total_slots > 0 else 0, 2)
                },
                'floor_occupancy': floor_occupancy,
                'average_parking_duration': avg_duration['avg_duration'] or 0
            }
        })
