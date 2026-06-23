import pytest
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from messaging.domain.selectors import (
    get_unread_count_in_thread,
    get_unread_thread_count,
)
from messaging.domain.services import (
    get_or_create_direct_thread,
    mark_thread_read,
    send_message,
    set_thread_archived,
)
from messaging.models import Thread, ThreadParticipant


@pytest.mark.django_db
class TestGetOrCreateDirectThread:
    def test_creates_thread_with_both_participants(self, guest, owner):
        thread, created = get_or_create_direct_thread(requester=guest, other_user=owner)
        assert created is True
        assert ThreadParticipant.objects.filter(thread=thread).count() == 2

    def test_is_idempotent(self, guest, owner):
        t1, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        t2, created = get_or_create_direct_thread(requester=owner, other_user=guest)
        assert t1.id == t2.id
        assert created is False
        assert Thread.objects.count() == 1

    def test_cannot_thread_with_self(self, guest):
        with pytest.raises(PermissionDenied):
            get_or_create_direct_thread(requester=guest, other_user=guest)

    def test_booking_scope_is_separate(self, guest, owner, booking):
        # Direct thread without booking
        t_direct, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        # Booking-scoped thread between same two users
        t_booking, _ = get_or_create_direct_thread(
            requester=guest, other_user=owner, booking=booking
        )
        assert t_direct.id != t_booking.id
        assert t_booking.booking_id == booking.id


@pytest.mark.django_db
class TestSendMessage:
    def test_appends_message_and_bumps_thread(self, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        msg = send_message(thread=thread, sender=guest, body="Hi!")
        assert msg.pk is not None
        thread.refresh_from_db()
        assert thread.last_message_at == msg.created_at

    def test_non_participant_blocked(self, guest, owner, stranger):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        with pytest.raises(PermissionDenied):
            send_message(thread=thread, sender=stranger, body="hi")


@pytest.mark.django_db
class TestMarkThreadRead:
    def test_stamps_last_read_at(self, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        before = timezone.now()
        mark_thread_read(thread=thread, user=guest)
        p = ThreadParticipant.objects.get(thread=thread, user=guest)
        assert p.last_read_at is not None
        assert p.last_read_at >= before

    def test_non_participant_blocked(self, guest, owner, stranger):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        with pytest.raises(PermissionDenied):
            mark_thread_read(thread=thread, user=stranger)


@pytest.mark.django_db
class TestUnreadCounts:
    def test_unread_count_excludes_own_messages(self, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        send_message(thread=thread, sender=guest, body="me 1")
        send_message(thread=thread, sender=guest, body="me 2")
        # From the guest's perspective: 0 unread (they sent everything)
        assert get_unread_count_in_thread(thread=thread, user=guest) == 0
        # From the owner's perspective: 2 unread
        assert get_unread_count_in_thread(thread=thread, user=owner) == 2

    def test_marking_read_clears_unread(self, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        send_message(thread=thread, sender=guest, body="x")
        mark_thread_read(thread=thread, user=owner)
        assert get_unread_count_in_thread(thread=thread, user=owner) == 0

    def test_thread_count_excludes_archived(self, guest, owner):
        t1, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        send_message(thread=t1, sender=owner, body="hi")
        assert get_unread_thread_count(user=guest) == 1
        set_thread_archived(thread=t1, user=guest, archived=True)
        assert get_unread_thread_count(user=guest) == 0


@pytest.mark.django_db
class TestArchive:
    def test_per_participant(self, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        set_thread_archived(thread=thread, user=guest, archived=True)
        assert (
            ThreadParticipant.objects.get(thread=thread, user=guest).is_archived is True
        )
        assert (
            ThreadParticipant.objects.get(thread=thread, user=owner).is_archived
            is False
        )


@pytest.mark.django_db
class TestMessageOrdering:
    def test_messages_returned_in_chronological_order(self, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        m1 = send_message(thread=thread, sender=guest, body="first")
        m2 = send_message(thread=thread, sender=owner, body="second")
        m3 = send_message(thread=thread, sender=guest, body="third")
        from messaging.domain.selectors import get_messages_for_thread

        ids = [m.id for m in get_messages_for_thread(thread=thread)]
        assert ids == [m1.id, m2.id, m3.id]
