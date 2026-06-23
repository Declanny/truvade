import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from reviews.domain.services import create_reply, create_review, update_review
from reviews.models import ReviewReply


@pytest.mark.django_db
class TestCreateReview:
    def test_guest_can_review_completed_booking(self, guest, completed_booking):
        review = create_review(
            booking=completed_booking,
            guest=guest,
            rating=5,
            comment="Loved it",
            cleanliness=5,
        )
        assert review.pk is not None
        assert review.booking_id == completed_booking.id
        assert review.shortlet_id == completed_booking.shortlet_id
        assert review.cleanliness == 5

    def test_other_guest_cannot_review(self, other_guest, completed_booking):
        with pytest.raises(PermissionDenied):
            create_review(
                booking=completed_booking,
                guest=other_guest,
                rating=5,
            )

    def test_non_completed_booking_cannot_be_reviewed(
        self, guest, confirmed_booking
    ):
        with pytest.raises(ValidationError):
            create_review(booking=confirmed_booking, guest=guest, rating=4)

    def test_double_review_is_blocked(self, guest, completed_booking):
        create_review(booking=completed_booking, guest=guest, rating=5)
        with pytest.raises(ValidationError):
            create_review(booking=completed_booking, guest=guest, rating=4)


@pytest.mark.django_db
class TestUpdateReview:
    def test_guest_can_edit_own_review(self, guest, completed_booking):
        review = create_review(booking=completed_booking, guest=guest, rating=3)
        updated = update_review(review=review, author=guest, rating=5, comment="Edited")
        assert updated.rating == 5
        assert updated.comment == "Edited"

    def test_non_author_cannot_edit(self, guest, other_guest, completed_booking):
        review = create_review(booking=completed_booking, guest=guest, rating=3)
        with pytest.raises(PermissionDenied):
            update_review(review=review, author=other_guest, rating=1)


@pytest.mark.django_db
class TestCreateReply:
    def test_owner_can_reply(self, guest, owner, completed_booking):
        review = create_review(booking=completed_booking, guest=guest, rating=4)
        reply = create_reply(review=review, author=owner, body="Thanks!")
        assert reply.pk is not None
        assert reply.review_id == review.id

    def test_assigned_host_can_reply(self, guest, host, completed_booking):
        review = create_review(booking=completed_booking, guest=guest, rating=4)
        reply = create_reply(review=review, author=host, body="Cheers")
        assert reply.author_id == host.id

    def test_stranger_cannot_reply(self, guest, stranger, completed_booking):
        review = create_review(booking=completed_booking, guest=guest, rating=4)
        with pytest.raises(PermissionDenied):
            create_reply(review=review, author=stranger, body="hi")

    def test_guest_cannot_reply_to_own_review(
        self, guest, completed_booking
    ):
        review = create_review(booking=completed_booking, guest=guest, rating=4)
        with pytest.raises(PermissionDenied):
            create_reply(review=review, author=guest, body="hi")

    def test_double_reply_is_blocked(self, guest, owner, completed_booking):
        review = create_review(booking=completed_booking, guest=guest, rating=4)
        create_reply(review=review, author=owner, body="first")
        with pytest.raises(ValidationError):
            create_reply(review=review, author=owner, body="second")
        assert ReviewReply.objects.filter(review=review).count() == 1
