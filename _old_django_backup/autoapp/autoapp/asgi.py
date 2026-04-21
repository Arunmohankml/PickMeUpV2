# autoapp/autoapp/asgi.py

import os
import sys
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# 👇 This is KEY — manually add the outer autoapp/ to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import home.routing  # ✅ Now this should work

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'autoapp.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            home.routing.websocket_urlpatterns
        )
    ),
})