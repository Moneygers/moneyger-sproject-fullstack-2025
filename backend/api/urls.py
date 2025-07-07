from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'slots', views.ParkSlotViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'reservations', views.ReservationsViewSet)

urlpatterns = [
    # Authentication URLs
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    
    # Dashboard and Stats
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    
    # Reports
    path('reports/payments/', views.payment_reports, name='payment_reports'),
    path('reports/transactions/', views.transaction_reports, name='transaction_reports'),
    
    # System Settings
    path('settings/', views.system_settings_view, name='system_settings'),
    path('settings/reset/', views.reset_system_settings, name='reset_system_settings'),
    
    # Customer view
    path('available-slots/', views.available_slots, name='available_slots'),
    
    # Include router URLs
    path('', include(router.urls)),
    
    path('test-sms/', views.test_sms, name='test-sms'),  # SMS testing endpoint
    path('textbee-info/', views.textbee_service_info, name='textbee-info'),  # TextBee service info

    path('profanity/', views.profanity, name='profanity'),

]