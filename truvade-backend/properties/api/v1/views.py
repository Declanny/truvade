from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiParameter, extend_schema

from core.utils.responses import success_response
from properties.domain.selectors import get_shortlets_for_owner
from properties.domain.services import (
    check_shortlet_editable,
    delete_shortlet_image,
    publish_shortlet,
    upload_shortlet_images,
)
from properties.models import Shortlet, ShortletImage

from .permissions import IsOwner
from .serializers import (
    ShortletCreateSerializer,
    ShortletImageSerializer,
    ShortletSerializer,
)


@extend_schema(
    summary="Shortlet management API",
    description="API for managing shortlet listings",
    tags=["Shortlet"],
)
class ShortletViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwner]
    serializer_class = ShortletSerializer
    queryset = Shortlet.objects.none()

    def get_queryset(self):
        return get_shortlets_for_owner(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return ShortletCreateSerializer
        return ShortletSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response("Shortlets retrieved successfully.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response("Shortlet retrieved successfully.", serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = ShortletSerializer(serializer.instance)
        return success_response(
            "Shortlet created successfully.",
            output.data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        check_shortlet_editable(shortlet=instance)
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Shortlet updated successfully.", serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        check_shortlet_editable(shortlet=instance)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Shortlet updated successfully.", serializer.data)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        shortlet = self.get_object()
        publish_shortlet(shortlet=shortlet)
        return success_response(
            "Shortlet published successfully.",
            ShortletSerializer(shortlet).data,
        )

    @action(detail=True, methods=["post"], url_path="upload-images")
    def upload_images(self, request, pk=None):
        shortlet = self.get_object()
        images = request.FILES.getlist("images")
        if not images:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"images": ["At least 1 image file is required."]})
        created = upload_shortlet_images(shortlet=shortlet, images=images)
        serializer = ShortletImageSerializer(created, many=True)
        return success_response(
            "Images uploaded successfully.",
            serializer.data,
            status_code=status.HTTP_201_CREATED,
        )

    @extend_schema(
        parameters=[
            OpenApiParameter("image_id", int, OpenApiParameter.PATH),
        ],
    )
    @action(
        detail=True,
        methods=["delete"],
        url_path="images/(?P<image_id>[^/.]+)",
        url_name="image-delete",
    )
    def images(self, request, pk=None, image_id=None):
        shortlet = self.get_object()
        try:
            delete_shortlet_image(shortlet=shortlet, image_id=image_id)
        except ShortletImage.DoesNotExist:
            raise NotFound("Image not found.")
        return Response(status=status.HTTP_204_NO_CONTENT)
