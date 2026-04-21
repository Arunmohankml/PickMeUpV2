import json
from channels.generic.websocket import AsyncWebsocketConsumer

class MyConsumer(AsyncWebsocketConsumer):  
    async def connect(self):  
        self.ride_id = self.scope['url_route']['kwargs']['ride_id']  
        self.room_group_name = f'ride_{self.ride_id}'  

        # Join ride group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)  
        await self.accept()  
        print(f"✅ Client connected to {self.room_group_name}")

    async def disconnect(self, close_code):  
        # Leave group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)  
        print(f"❌ Client disconnected from {self.room_group_name}")

    async def receive(self, text_data):  
        try:
            data = json.loads(text_data)
            # Broadcast to group
            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'broadcast_location',  # maps to broadcast_location()
                    'message': json.dumps(data)   # ensure it's JSON serializable
                }
            )
        except Exception as e:
            print(f"🚨 Error in receive: {e}")

    async def broadcast_location(self, event):  
        # Send message to WebSocket
        await self.send(text_data=event['message'])