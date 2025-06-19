import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ParkingSlot
from .serializers import ParkingSlotSerializer

class ParkingStatusConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time parking status updates
    Broadcasts slot availability changes to connected clients
    """
    
    async def connect(self):
        # Join parking status group
        self.group_name = 'parking_status'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial parking status
        parking_data = await self.get_parking_status()
        await self.send(text_data=json.dumps({
            'type': 'parking_status',
            'data': parking_data
        }))
    
    async def disconnect(self, close_code):
        # Leave parking status group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        # Handle incoming WebSocket messages
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'request_update':
            # Send current parking status
            parking_data = await self.get_parking_status()
            await self.send(text_data=json.dumps({
                'type': 'parking_status',
                'data': parking_data
            }))
    
    async def parking_status_update(self, event):
        """Handle parking status updates from group"""
        await self.send(text_data=json.dumps({
            'type': 'parking_status_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_parking_status(self):
        """Get current parking status from database"""
        slots = ParkingSlot.objects.select_related('current_allocation').all()
        serializer = ParkingSlotSerializer(slots, many=True)
        return serializer.data

# Utility function to broadcast parking updates
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_parking_update(slot_id=None):
    """Broadcast parking status update to all connected clients"""
    channel_layer = get_channel_layer()
    
    if slot_id:
        # Get specific slot data
        try:
            slot = ParkingSlot.objects.select_related('current_allocation').get(id=slot_id)
            slot_data = ParkingSlotSerializer(slot).data
            
            async_to_sync(channel_layer.group_send)(
                'parking_status',
                {
                    'type': 'parking_status_update',
                    'data': {
                        'slot_updated': slot_data,
                        'timestamp': timezone.now().isoformat()
                    }
                }
            )
        except ParkingSlot.DoesNotExist:
            pass
    else:
        # Broadcast full status update
        slots = ParkingSlot.objects.select_related('current_allocation').all()
        slots_data = ParkingSlotSerializer(slots, many=True).data
        
        async_to_sync(channel_layer.group_send)(
            'parking_status',
            {
                'type': 'parking_status_update',
                'data': {
                    'full_update': slots_data,
                    'timestamp': timezone.now().isoformat()
                }
            }
        )
