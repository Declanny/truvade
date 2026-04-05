from shortlet.models import Shortlet


def get_shortlets_for_owner(*, owner):
    return (
        Shortlet.objects.filter(owner=owner)
        .select_related("owner")
        .prefetch_related("images")
    )
