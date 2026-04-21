from django.urls import re_path
from .consumers import MyConsumer
from . import consumers
websocket_urlpatterns=[
  re_path(r'ws/ride/(?P<ride_id>\w+)/$', consumers.MyConsumer.as_asgi()),
  ]
  
  