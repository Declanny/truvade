"""Messaging write operations."""

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone

from messaging.models import Message, Thread, ThreadParticipant


@transaction.atomic
def get_or_create_direct_thread(*, requester, other_user, booking=None, shortlet=None):
    """Return the existing 1:1 thread between two users, or create one.

    If `booking` is supplied we scope to that booking (multiple bookings can
    have their own thread between the same pair). Otherwise we look for an
    unscoped direct thread.
    """
    if requester.id == other_user.id:
        raise PermissionDenied("Cannot start a thread with yourself.")

    base_qs = Thread.objects.filter(
        participants__user=requester,
    ).filter(participants__user=other_user)

    if booking is not None:
        base_qs = base_qs.filter(booking=booking)
    else:
        base_qs = base_qs.filter(booking__isnull=True, shortlet__isnull=True)

    existing = base_qs.distinct().first()
    if existing:
        return existing, False

    thread = Thread.objects.create(booking=booking, shortlet=shortlet)
    ThreadParticipant.objects.bulk_create(
        [
            ThreadParticipant(thread=thread, user=requester),
            ThreadParticipant(thread=thread, user=other_user),
        ]
    )
    return thread, True


@transaction.atomic
def send_message(*, thread, sender, body, attachment=None):
    """Append a message to a thread and bump last_message_at.

    Guards: sender must be a participant of the thread.
    """
    is_participant = ThreadParticipant.objects.filter(
        thread=thread, user=sender
    ).exists()
    if not is_participant:
        raise PermissionDenied("You are not a participant in this thread.")

    message = Message.objects.create(
        thread=thread, sender=sender, body=body, attachment=attachment
    )
    Thread.objects.filter(pk=thread.pk).update(last_message_at=message.created_at)
    thread.last_message_at = message.created_at
    return message


@transaction.atomic
def mark_thread_read(*, thread, user):
    """Stamp the caller's last_read_at to now."""
    participant = ThreadParticipant.objects.filter(thread=thread, user=user).first()
    if participant is None:
        raise PermissionDenied("You are not a participant in this thread.")
    participant.last_read_at = timezone.now()
    participant.save(update_fields=["last_read_at"])
    return participant


@transaction.atomic
def set_thread_archived(*, thread, user, archived):
    participant = ThreadParticipant.objects.filter(thread=thread, user=user).first()
    if participant is None:
        raise PermissionDenied("You are not a participant in this thread.")
    if participant.is_archived != archived:
        participant.is_archived = archived
        participant.save(update_fields=["is_archived"])
    return participant


@transaction.atomic
def set_thread_muted(*, thread, user, muted):
    participant = ThreadParticipant.objects.filter(thread=thread, user=user).first()
    if participant is None:
        raise PermissionDenied("You are not a participant in this thread.")
    if participant.is_muted != muted:
        participant.is_muted = muted
        participant.save(update_fields=["is_muted"])
    return participant
