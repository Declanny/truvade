from accounts.models import OwnerHostMembership
from shortlet.models import Shortlet, ShortletHostAssignment

_PUBLIC_PREFETCH = ["images", "amenities", "host_assignments__host"]


def get_public_shortlets(
    *,
    city=None,
    state=None,
    min_price=None,
    max_price=None,
    min_bedrooms=None,
    shortlet_type=None,
    featured=None,
    guest_favorite=None,
    sort_by="newest",
):
    qs = (
        Shortlet.objects.filter(status=Shortlet.Status.ACTIVE)
        .select_related("owner")
        .prefetch_related(*_PUBLIC_PREFETCH)
    )
    if city:
        qs = qs.filter(city__iexact=city)
    if state:
        qs = qs.filter(state__iexact=state)
    if min_price is not None:
        qs = qs.filter(base_price__gte=min_price)
    if max_price is not None:
        qs = qs.filter(base_price__lte=max_price)
    if min_bedrooms is not None:
        qs = qs.filter(bedrooms__gte=min_bedrooms)
    if shortlet_type:
        qs = qs.filter(shortlet_type=shortlet_type)
    if featured is not None:
        qs = qs.filter(featured=featured)
    if guest_favorite is not None:
        qs = qs.filter(guest_favorite=guest_favorite)

    order = {"price_asc": "base_price", "price_desc": "-base_price"}.get(
        sort_by, "-created_at"
    )
    return qs.order_by(order)


def get_public_shortlet(*, pk):
    return (
        Shortlet.objects.filter(pk=pk, status=Shortlet.Status.ACTIVE)
        .select_related("owner")
        .prefetch_related(*_PUBLIC_PREFETCH)
        .first()
    )


def get_shortlets_for_owner(*, owner):
    return (
        Shortlet.objects.filter(owner=owner)
        .select_related("owner")
        .prefetch_related("images", "host_assignments__host")
    )


def get_shortlet_host_assignments(*, shortlet):
    return ShortletHostAssignment.objects.filter(shortlet=shortlet).select_related(
        "host", "assigned_by"
    )


def get_shortlets_for_host(*, host):
    return (
        Shortlet.objects.filter(host_assignments__host=host)
        .select_related("owner")
        .prefetch_related("images", "host_assignments__host")
    )


def get_available_hosts_for_shortlet(*, shortlet):
    """Verified hosts linked to the owner but not already assigned to this shortlet."""
    assigned_host_ids = ShortletHostAssignment.objects.filter(
        shortlet=shortlet
    ).values_list("host_id", flat=True)

    memberships = (
        OwnerHostMembership.objects.filter(owner=shortlet.owner, is_active=True)
        .exclude(host_id__in=assigned_host_ids)
        .select_related("host")
    )

    return [m.host for m in memberships if m.host.is_verified]
