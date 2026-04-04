from properties.models import Property


def get_properties_for_owner(*, owner):
    return (
        Property.objects.filter(owner=owner)
        .select_related("owner")
        .prefetch_related("images")
    )
