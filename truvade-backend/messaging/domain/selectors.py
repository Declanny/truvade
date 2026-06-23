"""Messaging read operations."""

from django.db.models import Count, Exists, OuterRef, Q

from messaging.models import Message, Thread, ThreadParticipant


def _participant_qs(*, user):
    return ThreadParticipant.objects.filter(user=user)


def get_threads_for_user(*, user, include_archived=False):
    """Return threads the user participates in, ordered by last activity."""
    membership_qs = _participant_qs(user=user)
    if not include_archived:
        membership_qs = membership_qs.filter(is_archived=False)

    thread_ids = membership_qs.values_list("thread_id", flat=True)

    return (
        Thread.objects.filter(pk__in=thread_ids)
        .select_related("booking", "shortlet")
        .prefetch_related("participants", "participants__user")
        .order_by("-last_message_at", "-created_at")
    )


def get_thread_if_participant(*, user, thread_id):
    """Return a thread only if the user is a participant — else None."""
    try:
        thread = Thread.objects.get(pk=thread_id)
    except Thread.DoesNotExist:
        return None
    if not ThreadParticipant.objects.filter(thread=thread, user=user).exists():
        return None
    return thread


def get_messages_for_thread(*, thread):
    return (
        Message.objects.filter(thread=thread)
        .select_related("sender")
        .order_by("created_at")
    )


def get_participant(*, thread, user):
    try:
        return ThreadParticipant.objects.get(thread=thread, user=user)
    except ThreadParticipant.DoesNotExist:
        return None


def get_unread_thread_count(*, user):
    """Number of threads with at least one message the caller hasn't seen.

    A participant with no last_read_at sees any message from another
    participant as unread; otherwise unread means created_at > last_read_at.
    Archived threads do not count.
    """
    unread_after_read = Message.objects.filter(
        thread_id=OuterRef("thread_id"),
        created_at__gt=OuterRef("last_read_at"),
    ).exclude(sender=user)
    any_from_others = Message.objects.filter(
        thread_id=OuterRef("thread_id"),
    ).exclude(sender=user)

    qs = (
        ThreadParticipant.objects.filter(user=user, is_archived=False)
        .annotate(
            has_unread_after=Exists(unread_after_read),
            has_any_from_others=Exists(any_from_others),
        )
        .filter(
            Q(last_read_at__isnull=False, has_unread_after=True)
            | Q(last_read_at__isnull=True, has_any_from_others=True)
        )
    )
    return qs.aggregate(total=Count("id"))["total"] or 0


def get_unread_count_in_thread(*, thread, user):
    """Count messages in this thread the user hasn't read."""
    participant = get_participant(thread=thread, user=user)
    if participant is None:
        return 0
    qs = Message.objects.filter(thread=thread).exclude(sender=user)
    if participant.last_read_at is not None:
        qs = qs.filter(created_at__gt=participant.last_read_at)
    return qs.count()


def get_last_message(*, thread):
    return Message.objects.filter(thread=thread).order_by("-created_at").first()
