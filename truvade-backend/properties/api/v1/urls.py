from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ShortletViewSet

router = DefaultRouter()
router.register(r"shortlets", ShortletViewSet, basename="shortlet")

urlpatterns = [
    path("", include(router.urls)),
]
