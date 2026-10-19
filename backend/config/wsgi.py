import os

from django.core.wsgi import get_wsgi_application

# WSGI servers import this object to serve standard Django HTTP requests.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()
