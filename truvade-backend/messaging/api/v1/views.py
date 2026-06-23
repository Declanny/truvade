from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from bookings.models import Booking
from core.utils.responses import success_response
from messaging.domain.selectors import (
    get_messages_for_thread,
    get_thread_if_participant,
    get_threads_for_user,
    get_unread_thread_count,
)
from messaging.domain.services import (
    get_or_create_direct_thread,
    mark_thread_read,
    send_message,
    set_thread_archived,
    set_thread_muted,
)

from .serializers import (
    CreateThreadSerializer,
    MessageSerializer,
    SendMessageSerializer,
    ThreadSummarySerializer,
    UpdateParticipantSerializer,
)

User = get_user_model()


@extend_schema(tags=["Messaging"], summary="List my threads")
class ThreadListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        include_archived = request.query_params.get("archived") in (
            "1",
            "true",
            "True",
        )
        threads = get_threads_for_user(
            user=request.user, include_archived=include_archived
        )
        serializer = ThreadSummarySerializer(
            threads, many=True, context={"user": request.user}
        )
        return success_response("Threads retrieved.", serializer.data)

    @extend_schema(
        request=CreateThreadSerializer,
        summary="Start or fetch a thread with another user",
    )
    def post(self, request):
        serializer = CreateThreadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        booking = None
        other_user = None
        if data.get("booking_id"):
            try:
                booking = Booking.objects.select_related(
                    "guest", "shortlet", "shortlet__owner"
                ).get(pk=data["booking_id"])
            except Booking.DoesNotExist:
                raise NotFound("Booking not found.")
            # Caller must be a party to the booking — guest or shortlet owner.
            if request.user.id == booking.guest_id:
                other_user = booking.shortlet.owner
            elif request.user.id == booking.shortlet.owner_id:
                other_user = booking.guest
            else:
                raise DRFPermissionDenied("You are not part of this booking.")
        else:
            try:
                other_user = User.objects.get(pk=data["user_id"])
            except User.DoesNotExist:
                raise NotFound("User not found.")

        try:
            thread, _created = get_or_create_direct_thread(
                requester=request.user, other_user=other_user, booking=booking
            )
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))

        if data.get("initial_message"):
            send_message(
                thread=thread, sender=request.user, body=data["initial_message"]
            )

        serializer = ThreadSummarySerializer(thread, context={"user": request.user})
        return success_response(
            "Thread ready.",
            serializer.data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Messaging"])
class ThreadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Thread summary + messages")
    def get(self, request, thread_id):
        thread = get_thread_if_participant(user=request.user, thread_id=thread_id)
        if thread is None:
            raise NotFound("Thread not found.")

        messages = get_messages_for_thread(thread=thread)
        thread_data = ThreadSummarySerializer(
            thread, context={"user": request.user}
        ).data
        message_data = MessageSerializer(messages, many=True).data
        return success_response(
            "Thread retrieved.",
            {"thread": thread_data, "messages": message_data},
        )

    @extend_schema(
        request=UpdateParticipantSerializer,
        summary="Archive or mute this thread for me",
    )
    def patch(self, request, thread_id):
        thread = get_thread_if_participant(user=request.user, thread_id=thread_id)
        if thread is None:
            raise NotFound("Thread not found.")

        serializer = UpdateParticipantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if "is_archived" in serializer.validated_data:
            set_thread_archived(
                thread=thread,
                user=request.user,
                archived=serializer.validated_data["is_archived"],
            )
        if "is_muted" in serializer.validated_data:
            set_thread_muted(
                thread=thread,
                user=request.user,
                muted=serializer.validated_data["is_muted"],
            )
        return success_response(
            "Thread updated.",
            ThreadSummarySerializer(thread, context={"user": request.user}).data,
        )


@extend_schema(
    tags=["Messaging"],
    request=SendMessageSerializer,
    summary="Send a message in a thread",
)
class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, thread_id):
        thread = get_thread_if_participant(user=request.user, thread_id=thread_id)
        if thread is None:
            raise NotFound("Thread not found.")

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        body = serializer.validated_data["body"].strip()
        if not body:
            raise DRFValidationError("Message body is required.")

        try:
            message = send_message(thread=thread, sender=request.user, body=body)
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))

        return success_response(
            "Message sent.",
            MessageSerializer(message).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Messaging"], summary="Mark a thread as read up to now")
class MarkThreadReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, thread_id):
        thread = get_thread_if_participant(user=request.user, thread_id=thread_id)
        if thread is None:
            raise NotFound("Thread not found.")
        mark_thread_read(thread=thread, user=request.user)
        return success_response("Marked as read.", None)


@extend_schema(tags=["Messaging"], summary="Unread thread badge count")
class UnreadThreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = get_unread_thread_count(user=request.user)
        return success_response("Unread count retrieved.", {"unread": count})
