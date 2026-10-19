from rest_framework import generics, permissions

from .serializers import RegistrationSerializer, UserSerializer


class RegistrationView(generics.CreateAPIView):
    # Public registration creates accounts through the serializer's password-safe manager call.
    serializer_class = RegistrationSerializer
    permission_classes = (permissions.AllowAny,)


class CurrentUserView(generics.RetrieveAPIView):
    # Used by the frontend after login and on reload to restore the token's user session.
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
