from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParkingSlotViewSet, AllocationViewSet, ParkingRateViewSet

router = DefaultRouter()
router.register(r'slots', ParkingSlotViewSet)
router.register(r'allocations', AllocationViewSet)
router.register(r'rates', ParkingRateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
