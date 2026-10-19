import os

from django.core.asgi import get_asgi_application

# ASGI servers import this object to serve asynchronous-capable Django requests.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_asgi_application()
