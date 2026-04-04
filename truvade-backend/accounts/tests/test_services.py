import pytest
from django.core import mail
from django.core.exceptions import ValidationError
from django.utils import timezone

from accounts.domain.services import (
    accept_invitation,
    create_invitation,
    decline_invitation,
    register_user,
    remove_host,
    resend_otp,
    review_verification,
    revoke_invitation,
    send_otp,
    submit_verification,
    verify_otp,
)
from accounts.models import (
    IdentityVerification,
    Invitation,
    OTP,
    OwnerHostMembership,
)


@pytest.mark.django_db
class TestRegisterUser:
    def test_creates_user(self):
        user = register_user(
            name="Ada Okafor",
            email="ada@example.com",
            phone="+2348000000000",
            role="GUEST",
        )
        assert user.pk is not None
        assert user.email == "ada@example.com"
        assert user.name == "Ada Okafor"
        assert user.phone == "+2348000000000"
        assert user.role == "GUEST"
        assert not user.has_usable_password()

    def test_creates_otp_on_register(self):
        user = register_user(
            name="Ada Okafor",
            email="ada@example.com",
            phone="+2348000000000",
            role="OWNER",
        )
        assert OTP.objects.filter(user=user).count() == 1

    def test_duplicate_email_raises(self):
        register_user(
            name="First",
            email="ada@example.com",
            phone="+2348000000000",
            role="GUEST",
        )
        with pytest.raises(ValidationError, match="already exists"):
            register_user(
                name="Second",
                email="ada@example.com",
                phone="+2348000000001",
                role="GUEST",
            )

    def test_invalid_role_raises(self):
        with pytest.raises(ValidationError, match="GUEST or OWNER"):
            register_user(
                name="Test",
                email="test@example.com",
                phone="+2348000000000",
                role="ADMIN",
            )


@pytest.mark.django_db
class TestSendOTP:
    def test_creates_otp_record(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        assert OTP.objects.filter(user=user).count() == 1

    def test_otp_is_6_digits(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        assert len(otp.code) == 6
        assert otp.code.isdigit()


@pytest.mark.django_db
class TestVerifyOTP:
    def test_success(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        result = verify_otp(email="test@example.com", code=otp.code)
        assert result == user
        otp.refresh_from_db()
        assert otp.is_used is True

    def test_wrong_code_raises(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        with pytest.raises(ValidationError, match="Invalid"):
            verify_otp(email="test@example.com", code="000000")

    def test_expired_otp_raises(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        otp.created_at = timezone.now() - timezone.timedelta(minutes=11)
        otp.save()
        with pytest.raises(ValidationError, match="expired"):
            verify_otp(email="test@example.com", code=otp.code)

    def test_already_used_raises(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        otp.is_used = True
        otp.save()
        with pytest.raises(ValidationError, match="Invalid"):
            verify_otp(email="test@example.com", code=otp.code)

    def test_unknown_email_raises(self):
        with pytest.raises(ValidationError, match="Invalid"):
            verify_otp(email="nobody@example.com", code="123456")


@pytest.mark.django_db
class TestResendOTP:
    def test_creates_new_otp(self, create_user):
        user = create_user(email="test@example.com")
        resend_otp(email="test@example.com")
        assert OTP.objects.filter(user=user).count() == 1

    def test_unknown_email_raises(self):
        with pytest.raises(ValidationError, match="No account"):
            resend_otp(email="nobody@example.com")


@pytest.mark.django_db
class TestCreateInvitation:
    def test_creates_invitation(self, owner):
        invitation = create_invitation(owner=owner, email="newhost@example.com")
        assert invitation.pk is not None
        assert invitation.owner == owner
        assert invitation.email == "newhost@example.com"
        assert invitation.status == "PENDING"
        assert invitation.token is not None
        assert invitation.expires_at > timezone.now()

    def test_sends_email(self, owner):
        create_invitation(owner=owner, email="newhost@example.com")
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ["newhost@example.com"]
        assert "invited" in mail.outbox[0].subject.lower()

    def test_non_owner_raises(self, guest):
        with pytest.raises(ValidationError, match="Only owners"):
            create_invitation(owner=guest, email="host@example.com")

    def test_cannot_invite_self(self, owner):
        with pytest.raises(ValidationError, match="cannot invite yourself"):
            create_invitation(owner=owner, email=owner.email)

    def test_duplicate_pending_invitation_raises(self, owner):
        create_invitation(owner=owner, email="host@example.com")
        with pytest.raises(ValidationError, match="pending invitation"):
            create_invitation(owner=owner, email="host@example.com")

    def test_existing_active_host_raises(self, owner, host):
        OwnerHostMembership.objects.create(owner=owner, host=host)
        with pytest.raises(ValidationError, match="already your host"):
            create_invitation(owner=owner, email=host.email)

    def test_expired_pending_gets_replaced(self, owner):
        # Create an invitation that's already expired
        Invitation.objects.create(
            owner=owner,
            email="host@example.com",
            expires_at=timezone.now() - timezone.timedelta(days=1),
        )
        # Should succeed since old one is expired
        invitation = create_invitation(owner=owner, email="host@example.com")
        assert invitation.status == "PENDING"

    def test_email_content_for_unregistered_user(self, owner):
        create_invitation(owner=owner, email="newperson@example.com")
        assert "signup" in mail.outbox[0].body.lower()

    def test_email_content_for_registered_user(self, owner, host):
        create_invitation(owner=owner, email=host.email)
        assert "accept" in mail.outbox[0].body.lower()


@pytest.mark.django_db
class TestAcceptInvitation:
    def test_accept_creates_membership(self, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        membership = accept_invitation(token=invitation.token, user=host)
        assert membership.owner == owner
        assert membership.host == host
        assert membership.is_active is True
        assert membership.invitation == invitation

    def test_accept_marks_invitation_accepted(self, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        accept_invitation(token=invitation.token, user=host)
        invitation.refresh_from_db()
        assert invitation.status == "ACCEPTED"

    def test_invalid_token_raises(self, host):
        import uuid

        with pytest.raises(ValidationError, match="Invalid invitation"):
            accept_invitation(token=uuid.uuid4(), user=host)

    def test_expired_invitation_raises(self, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() - timezone.timedelta(days=1),
        )
        with pytest.raises(ValidationError, match="expired"):
            accept_invitation(token=invitation.token, user=host)

    def test_wrong_email_raises(self, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email="someone-else@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        with pytest.raises(ValidationError, match="not sent to your email"):
            accept_invitation(token=invitation.token, user=host)

    def test_guest_upgraded_to_host(self, owner, guest):
        invitation = Invitation.objects.create(
            owner=owner,
            email=guest.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        accept_invitation(token=invitation.token, user=guest)
        guest.refresh_from_db()
        assert guest.role == "HOST"

    def test_already_active_member_raises(self, owner, host):
        OwnerHostMembership.objects.create(owner=owner, host=host)
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        with pytest.raises(ValidationError, match="already a host"):
            accept_invitation(token=invitation.token, user=host)

    def test_reactivates_inactive_membership(self, owner, host):
        OwnerHostMembership.objects.create(owner=owner, host=host, is_active=False)
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        membership = accept_invitation(token=invitation.token, user=host)
        assert membership.is_active is True


@pytest.mark.django_db
class TestDeclineInvitation:
    def test_decline_marks_declined(self, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        result = decline_invitation(token=invitation.token, user=host)
        assert result.status == "DECLINED"

    def test_invalid_token_raises(self, host):
        import uuid

        with pytest.raises(ValidationError, match="Invalid invitation"):
            decline_invitation(token=uuid.uuid4(), user=host)

    def test_wrong_email_raises(self, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email="other@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        with pytest.raises(ValidationError, match="not sent to your email"):
            decline_invitation(token=invitation.token, user=host)


@pytest.mark.django_db
class TestRevokeInvitation:
    def test_revoke_marks_expired(self, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="host@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        result = revoke_invitation(invitation_id=invitation.id, owner=owner)
        assert result.status == "EXPIRED"

    def test_wrong_owner_raises(self, owner, other_owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="host@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        with pytest.raises(ValidationError, match="not found"):
            revoke_invitation(invitation_id=invitation.id, owner=other_owner)

    def test_already_accepted_raises(self, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="host@example.com",
            status="ACCEPTED",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        with pytest.raises(ValidationError, match="not found"):
            revoke_invitation(invitation_id=invitation.id, owner=owner)


@pytest.mark.django_db
class TestRemoveHost:
    def test_remove_deactivates_membership(self, membership, owner):
        result = remove_host(membership_id=membership.id, owner=owner)
        assert result.is_active is False

    def test_not_found_raises(self, owner):
        with pytest.raises(ValidationError, match="not found"):
            remove_host(membership_id=999, owner=owner)


@pytest.mark.django_db
class TestRegisterUserWithInvitation:
    def test_host_registration_with_valid_invitation(self, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="newhost@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        user = register_user(
            name="New Host",
            email="newhost@example.com",
            phone="+2348000000000",
            role="HOST",
            invitation_token=invitation.token,
        )
        assert user.role == "HOST"

    def test_host_without_invitation_raises(self):
        with pytest.raises(ValidationError, match="requires an invitation"):
            register_user(
                name="Test",
                email="test@example.com",
                phone="+2348000000000",
                role="HOST",
            )

    def test_host_with_expired_invitation_raises(self, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="newhost@example.com",
            expires_at=timezone.now() - timezone.timedelta(days=1),
        )
        with pytest.raises(ValidationError, match="Invalid or expired"):
            register_user(
                name="New Host",
                email="newhost@example.com",
                phone="+2348000000000",
                role="HOST",
                invitation_token=invitation.token,
            )

    def test_host_with_wrong_email_raises(self, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="other@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        with pytest.raises(ValidationError, match="Invalid or expired"):
            register_user(
                name="New Host",
                email="wrong@example.com",
                phone="+2348000000000",
                role="HOST",
                invitation_token=invitation.token,
            )


@pytest.mark.django_db
class TestSubmitVerification:
    def test_submit_bvn_verification(self, owner):
        from django.core.files.uploadedfile import SimpleUploadedFile

        doc = SimpleUploadedFile("id.jpg", b"fake-image", content_type="image/jpeg")
        selfie = SimpleUploadedFile(
            "selfie.jpg", b"fake-image", content_type="image/jpeg"
        )
        v = submit_verification(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document=doc,
            selfie=selfie,
        )
        assert v.status == "PENDING"
        assert v.verification_type == "BVN"
        assert v.user == owner

    def test_submit_nin_verification(self, owner):
        from django.core.files.uploadedfile import SimpleUploadedFile

        doc = SimpleUploadedFile("id.jpg", b"fake-image", content_type="image/jpeg")
        selfie = SimpleUploadedFile(
            "selfie.jpg", b"fake-image", content_type="image/jpeg"
        )
        v = submit_verification(
            user=owner,
            verification_type="NIN",
            id_number="98765432101",
            id_document=doc,
            selfie=selfie,
        )
        assert v.verification_type == "NIN"

    def test_guest_cannot_submit(self, guest):
        from django.core.files.uploadedfile import SimpleUploadedFile

        doc = SimpleUploadedFile("id.jpg", b"fake-image", content_type="image/jpeg")
        selfie = SimpleUploadedFile(
            "selfie.jpg", b"fake-image", content_type="image/jpeg"
        )
        with pytest.raises(ValidationError, match="Only HOST and OWNER"):
            submit_verification(
                user=guest,
                verification_type="BVN",
                id_number="12345678901",
                id_document=doc,
                selfie=selfie,
            )

    def test_invalid_bvn_format_raises(self, owner):
        from django.core.files.uploadedfile import SimpleUploadedFile

        doc = SimpleUploadedFile("id.jpg", b"fake-image", content_type="image/jpeg")
        selfie = SimpleUploadedFile(
            "selfie.jpg", b"fake-image", content_type="image/jpeg"
        )
        with pytest.raises(ValidationError, match="11 digits"):
            submit_verification(
                user=owner,
                verification_type="BVN",
                id_number="123",
                id_document=doc,
                selfie=selfie,
            )

    def test_duplicate_pending_raises(self, owner):
        from django.core.files.uploadedfile import SimpleUploadedFile

        doc1 = SimpleUploadedFile("id.jpg", b"fake-image", content_type="image/jpeg")
        selfie1 = SimpleUploadedFile(
            "selfie.jpg", b"fake-image", content_type="image/jpeg"
        )
        submit_verification(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document=doc1,
            selfie=selfie1,
        )
        doc2 = SimpleUploadedFile("id2.jpg", b"fake-image", content_type="image/jpeg")
        selfie2 = SimpleUploadedFile(
            "selfie2.jpg", b"fake-image", content_type="image/jpeg"
        )
        with pytest.raises(ValidationError, match="pending"):
            submit_verification(
                user=owner,
                verification_type="BVN",
                id_number="12345678901",
                id_document=doc2,
                selfie=selfie2,
            )


@pytest.mark.django_db
class TestReviewVerification:
    def test_approve_verification(self, owner, admin_user):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        result = review_verification(
            verification_id=v.id, admin=admin_user, status="APPROVED"
        )
        assert result.status == "APPROVED"
        assert result.reviewed_by == admin_user
        assert result.reviewed_at is not None

    def test_reject_verification(self, owner, admin_user):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        result = review_verification(
            verification_id=v.id,
            admin=admin_user,
            status="REJECTED",
            admin_notes="Blurry document",
        )
        assert result.status == "REJECTED"
        assert result.admin_notes == "Blurry document"

    def test_non_admin_raises(self, owner):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        with pytest.raises(ValidationError, match="Only admins"):
            review_verification(verification_id=v.id, admin=owner, status="APPROVED")

    def test_already_reviewed_raises(self, owner, admin_user):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
            status="APPROVED",
        )
        with pytest.raises(ValidationError, match="not found or already reviewed"):
            review_verification(
                verification_id=v.id, admin=admin_user, status="REJECTED"
            )
