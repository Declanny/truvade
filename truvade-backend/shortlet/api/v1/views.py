from django.contrib.auth import get_user_model

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiParameter, extend_schema

from accounts.api.v1.permissions import IsHostRole
from core.utils.responses import success_response
from shortlet.domain.selectors import (
    get_available_hosts_for_shortlet,
    get_shortlets_for_host,
    get_shortlets_for_owner,
)
from shortlet.domain.services import (
    assign_host_to_shortlet,
    check_shortlet_editable,
    delete_shortlet_image,
    publish_shortlet,
    unassign_host_from_shortlet,
    update_host_assignment_permissions,
    upload_shortlet_images,
)
from shortlet.models import Shortlet, ShortletImage

from .permissions import IsOwner
from .serializers import (
    AssignHostSerializer,
    AvailableHostSerializer,
    ShortletCreateSerializer,
    ShortletHostAssignmentSerializer,
    ShortletImageSerializer,
    ShortletSerializer,
    UpdateAssignmentPermissionsSerializer,
)

User = get_user_model()


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

    @action(detail=True, methods=["post"], url_path="assign-host")
    def assign_host(self, request, pk=None):
        shortlet = self.get_object()
        serializer = AssignHostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        host = User.objects.filter(id=serializer.validated_data["host_id"]).first()
        if host is None:
            from django.core.exceptions import ValidationError

            raise ValidationError("Host not found.")
        assignment = assign_host_to_shortlet(
            shortlet=shortlet,
            host=host,
            role=serializer.validated_data["role"],
            assigned_by=request.user,
        )
        return success_response(
            "Host assigned successfully.",
            ShortletHostAssignmentSerializer(assignment).data,
            status_code=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="available-hosts")
    def available_hosts(self, request, pk=None):
        shortlet = self.get_object()
        hosts = get_available_hosts_for_shortlet(shortlet=shortlet)
        return success_response(
            "Available hosts retrieved.",
            AvailableHostSerializer(hosts, many=True).data,
        )

    @action(
        detail=True,
        methods=["delete"],
        url_path="assignments/(?P<assignment_id>[^/.]+)",
        url_name="assignment-delete",
    )
    def unassign_host(self, request, pk=None, assignment_id=None):
        shortlet = self.get_object()
        unassign_host_from_shortlet(
            shortlet=shortlet,
            assignment_id=assignment_id,
            owner=request.user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["patch"],
        url_path="assignments/(?P<assignment_id>[^/.]+)/permissions",
        url_name="assignment-permissions",
    )
    def update_assignment_permissions(self, request, pk=None, assignment_id=None):
        self.get_object()  # ensure ownership check
        serializer = UpdateAssignmentPermissionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = update_host_assignment_permissions(
            assignment_id=assignment_id,
            owner=request.user,
            can_edit=serializer.validated_data["can_edit"],
            can_upload_images=serializer.validated_data["can_upload_images"],
        )
        return success_response(
            "Permissions updated.",
            ShortletHostAssignmentSerializer(assignment).data,
        )


@extend_schema(tags=["Shortlets"], responses=ShortletSerializer(many=True))
class HostShortletListView(APIView):
    """Lists shortlets assigned to the authenticated host."""

    permission_classes = [IsAuthenticated, IsHostRole]

    def get(self, request):
        shortlets = get_shortlets_for_host(host=request.user)
        return success_response(
            "Assigned shortlets retrieved.",
            ShortletSerializer(shortlets, many=True).data,
        )
