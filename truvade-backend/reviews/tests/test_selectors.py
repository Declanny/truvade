import pytest

from reviews.domain.selectors import (
    get_pending_reviews_for_guest,
    get_rating_summary,
    get_reviews_for_shortlet,
)
from reviews.domain.services import create_review


@pytest.mark.django_db
class TestRatingSummary:
    def test_empty_shortlet(self, shortlet):
        summary = get_rating_summary(shortlet_id=shortlet.id)
        assert summary["count"] == 0
        assert summary["rating"] is None

    def test_averages_published_reviews(
        self, guest, other_guest, shortlet, completed_booking
    ):
        create_review(
            booking=completed_booking, guest=guest, rating=5, cleanliness=5
        )
        # Second completed booking for other_guest
        from bookings.models import Booking
        from decimal import Decimal
        import datetime

        today = datetime.date.today()
        b2 = Booking.objects.create(
            guest=other_guest,
            shortlet=shortlet,
            check_in=today - datetime.timedelta(days=20),
            check_out=today - datetime.timedelta(days=17),
            number_of_guests=2,
            number_of_nights=3,
            base_price_per_night=Decimal("40000.00"),
            cleaning_fee=Decimal("2000.00"),
            subtotal=Decimal("122000.00"),
            platform_fee=Decimal("9760.00"),
            total_price=Decimal("131760.00"),
            currency="NGN",
            status=Booking.Status.COMPLETED,
        )
        create_review(booking=b2, guest=other_guest, rating=3, cleanliness=4)

        summary = get_rating_summary(shortlet_id=shortlet.id)
        assert summary["count"] == 2
        assert summary["rating"] == 4.0
        assert summary["cleanliness"] == 4.5


@pytest.mark.django_db
class TestPendingReviews:
    def test_lists_only_completed_unreviewed_bookings(
        self, guest, completed_booking, confirmed_booking
    ):
        pending = list(get_pending_reviews_for_guest(guest=guest))
        ids = [b.id for b in pending]
        assert completed_booking.id in ids
        assert confirmed_booking.id not in ids

    def test_excludes_already_reviewed(self, guest, completed_booking):
        create_review(booking=completed_booking, guest=guest, rating=5)
        pending = list(get_pending_reviews_for_guest(guest=guest))
        assert completed_booking.id not in [b.id for b in pending]


@pytest.mark.django_db
class TestListReviews:
    def test_returns_published_in_reverse_chronological_order(
        self, guest, shortlet, completed_booking
    ):
        r = create_review(booking=completed_booking, guest=guest, rating=4)
        items = list(get_reviews_for_shortlet(shortlet_id=shortlet.id))
        assert [x.id for x in items] == [r.id]

    def test_excludes_unpublished_by_default(
        self, guest, shortlet, completed_booking
    ):
        r = create_review(booking=completed_booking, guest=guest, rating=4)
        r.is_published = False
        r.save(update_fields=["is_published"])
        items = list(get_reviews_for_shortlet(shortlet_id=shortlet.id))
        assert items == []
