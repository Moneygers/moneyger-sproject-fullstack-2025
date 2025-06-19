from django.urls import path
from .views import RevenueReportView, OccupancyReportView

urlpatterns = [
    path('revenue/', RevenueReportView.as_view(), name='revenue-report'),
    path('occupancy/', OccupancyReportView.as_view(), name='occupancy-report'),
]
