import uuid

from django.conf import settings
from django.db import models


class Organization(models.Model):
    """A business entity that operates one or more shortlets.

    Owners create an Organization to formalize their hosting business and
    invite hosts/co-hosts as members. Personal listings can remain
    organization-less; this is opt-in.
    """

    class BusinessType(models.TextChoices):
        SOLE = "SOLE", "Sole proprietor"
        LIMITED = "LIMITED", "Limited company"
        PARTNERSHIP = "PARTNERSHIP", "Partnership"
        OTHER = "OTHER", "Other"

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization",
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, unique=True)
    business_type = models.CharField(
        max_length=20, choices=BusinessType.choices, default=BusinessType.SOLE
    )
    registration_number = models.CharField(max_length=50, blank=True, default="")
    tax_id = models.CharField(max_length=50, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=20, blank=True, default="")
    website = models.URLField(blank=True, default="")
    logo = models.ImageField(upload_to="organizations/logos/", blank=True)
    address = models.TextField(blank=True, default="")
    country = models.CharField(max_length=100, default="Nigeria")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    """A user's role within an organization."""

    class Role(models.TextChoices):
        OWNER = "OWNER", "Owner"
        MANAGER = "MANAGER", "Manager"
        HOST = "HOST", "Host"
        COHOST = "COHOST", "Co-host"
        VIEWER = "VIEWER", "Viewer"

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_memberships",
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.HOST)
    title = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("organization", "user")]
        ordering = ["role", "joined_at"]

    def __str__(self):
        return f"{self.user.email} as {self.role} of {self.organization.name}"


class OrganizationInvitation(models.Model):
    """Invitation to join an organization."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"
        EXPIRED = "EXPIRED", "Expired"
        REVOKED = "REVOKED", "Revoked"

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="invitations"
    )
    email = models.EmailField()
    role = models.CharField(
        max_length=10,
        choices=OrganizationMember.Role.choices,
        default=OrganizationMember.Role.HOST,
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="organization_invitations_sent",
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["organization", "status"], name="org_inv_org_status_idx"
            ),
        ]

    def __str__(self):
        return f"Invite for {self.email} to {self.organization.name}"
