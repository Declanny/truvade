from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from properties.domain.selectors import get_properties_for_owner
from properties.domain.services import (
    check_property_editable,
    delete_property_image,
    publish_property,
)
from properties.models import PropertyImage

from .permissions import IsOwner
from .serializers import PropertyCreateSerializer, PropertySerializer


class PropertyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwner]
    serializer_class = PropertySerializer

    def get_queryset(self):
        return get_properties_for_owner(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return PropertyCreateSerializer
        return PropertySerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = PropertySerializer(serializer.instance)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            check_property_editable(property_instance=instance)
        except ValidationError as e:
            return Response(
                {"detail": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            check_property_editable(property_instance=instance)
        except ValidationError as e:
            return Response(
                {"detail": e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        prop = self.get_object()
        try:
            publish_property(property_instance=prop)
        except ValidationError as e:
            return Response(
                {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(PropertySerializer(prop).data)

    @action(
        detail=True,
        methods=["delete"],
        url_path="images/(?P<image_id>[^/.]+)",
        url_name="image-delete",
    )
    def images(self, request, pk=None, image_id=None):
        prop = self.get_object()
        try:
            delete_property_image(property_instance=prop, image_id=image_id)
        except PropertyImage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
