"""
WebSocket URL routing for parking app
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/parking/status/$', consumers.ParkingStatusConsumer.as_asgi()),
]
