from accounts.models import OwnerHostMembership
from shortlet.models import Shortlet, ShortletHostAssignment


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
