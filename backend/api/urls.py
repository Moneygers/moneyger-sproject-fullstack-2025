from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'slots', views.ParkSlotViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'reservations', views.ReservationsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/google/', views.google_oauth_view, name='google_oauth'),
    
    # Dashboard and reports
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('reports/payments/', views.payment_reports, name='payment_reports'),
    path('reports/transactions/', views.transaction_reports, name='transaction_reports'),
    
    # System settings
    path('settings/', views.system_settings_view, name='system_settings'),
    path('settings/reset/', views.reset_system_settings, name='reset_system_settings'),
    path('parking-rates/', views.get_parking_rates, name='parking_rates'),
    
    # Customer endpoints
    path('available-slots/', views.available_slots, name='available_slots'),
    
    # SMS testing endpoints
    path('test-sms/', views.test_sms, name='test_sms'),
    path('textbee-info/', views.textbee_service_info, name='textbee_service_info'),
    
    # Profanity check
    path('profanity/', views.profanity, name='profanity'),
]
