import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from wishlists.domain.selectors import (
    get_recently_viewed_for_user,
    get_saved_shortlet_ids,
)
from wishlists.domain.services import (
    add_item,
    create_wishlist,
    delete_wishlist,
    get_or_create_default_wishlist,
    record_view,
    remove_item,
    toggle_save,
    update_wishlist,
)
from wishlists.models import Wishlist, WishlistItem


@pytest.mark.django_db
class TestDefaultWishlist:
    def test_creates_on_first_call(self, guest):
        assert not Wishlist.objects.filter(owner=guest).exists()
        wl = get_or_create_default_wishlist(user=guest)
        assert wl.is_default is True
        assert wl.owner_id == guest.id

    def test_idempotent(self, guest):
        wl1 = get_or_create_default_wishlist(user=guest)
        wl2 = get_or_create_default_wishlist(user=guest)
        assert wl1.id == wl2.id
        assert Wishlist.objects.filter(owner=guest, is_default=True).count() == 1


@pytest.mark.django_db
class TestUpdateWishlist:
    def test_owner_can_rename(self, guest):
        wl = create_wishlist(user=guest, name="Original")
        update_wishlist(wishlist=wl, user=guest, name="Renamed")
        wl.refresh_from_db()
        assert wl.name == "Renamed"

    def test_non_owner_cannot_edit(self, guest, other_guest):
        wl = create_wishlist(user=guest, name="Mine")
        with pytest.raises(PermissionDenied):
            update_wishlist(wishlist=wl, user=other_guest, name="Hijacked")


@pytest.mark.django_db
class TestDeleteWishlist:
    def test_owner_can_delete_non_default(self, guest):
        wl = create_wishlist(user=guest, name="Trip")
        delete_wishlist(wishlist=wl, user=guest)
        assert not Wishlist.objects.filter(pk=wl.pk).exists()

    def test_default_is_protected(self, guest):
        wl = get_or_create_default_wishlist(user=guest)
        with pytest.raises(ValidationError):
            delete_wishlist(wishlist=wl, user=guest)


@pytest.mark.django_db
class TestAddRemoveItem:
    def test_add_is_idempotent(self, guest, shortlet):
        wl = create_wishlist(user=guest, name="X")
        item1, created1 = add_item(wishlist=wl, user=guest, shortlet=shortlet)
        item2, created2 = add_item(wishlist=wl, user=guest, shortlet=shortlet)
        assert created1 is True
        assert created2 is False
        assert item1.id == item2.id
        assert WishlistItem.objects.filter(wishlist=wl).count() == 1

    def test_non_owner_blocked(self, guest, other_guest, shortlet):
        wl = create_wishlist(user=guest, name="X")
        with pytest.raises(PermissionDenied):
            add_item(wishlist=wl, user=other_guest, shortlet=shortlet)

    def test_remove(self, guest, shortlet):
        wl = create_wishlist(user=guest, name="X")
        add_item(wishlist=wl, user=guest, shortlet=shortlet)
        assert remove_item(wishlist=wl, user=guest, shortlet=shortlet) is True
        assert remove_item(wishlist=wl, user=guest, shortlet=shortlet) is False


@pytest.mark.django_db
class TestToggleSave:
    def test_first_toggle_saves(self, guest, shortlet):
        assert toggle_save(user=guest, shortlet=shortlet) is True
        assert shortlet.id in get_saved_shortlet_ids(user=guest)

    def test_second_toggle_removes(self, guest, shortlet):
        toggle_save(user=guest, shortlet=shortlet)
        assert toggle_save(user=guest, shortlet=shortlet) is False
        assert shortlet.id not in get_saved_shortlet_ids(user=guest)

    def test_isolated_per_user(self, guest, other_guest, shortlet):
        toggle_save(user=guest, shortlet=shortlet)
        assert shortlet.id not in get_saved_shortlet_ids(user=other_guest)


@pytest.mark.django_db
class TestRecordView:
    def test_records_first_view(self, guest, shortlet):
        record_view(user=guest, shortlet=shortlet)
        viewed = list(get_recently_viewed_for_user(user=guest))
        assert [v.shortlet_id for v in viewed] == [shortlet.id]

    def test_dedupes_subsequent_views(self, guest, shortlet):
        v1 = record_view(user=guest, shortlet=shortlet)
        v2 = record_view(user=guest, shortlet=shortlet)
        assert v1.id == v2.id

    def test_orders_by_recency(self, guest, shortlet, other_shortlet):
        record_view(user=guest, shortlet=shortlet)
        record_view(user=guest, shortlet=other_shortlet)
        ids = [v.shortlet_id for v in get_recently_viewed_for_user(user=guest)]
        assert ids == [other_shortlet.id, shortlet.id]
