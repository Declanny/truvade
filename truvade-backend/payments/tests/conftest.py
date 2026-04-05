import datetime
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import IdentityVerification, OwnerHostMembership
from bookings.models import Booking
from payments.models import BankAccount, Payment
from shortlet.models import Shortlet, ShortletHostAssignment, ShortletImage

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def guest(db):
    return User.objects.create_user(
        email="guest@example.com",
        password="testpass123",
        role="GUEST",
        name="Test Guest",
    )


@pytest.fixture
def other_guest(db):
    return User.objects.create_user(
        email="other-guest@example.com", password="testpass123", role="GUEST"
    )


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@example.com",
        password="testpass123",
        role="OWNER",
        name="Test Owner",
    )


@pytest.fixture
def verified_owner(owner):
    IdentityVerification.objects.create(
        user=owner,
        verification_type="NIN",
        id_number="12345678901",
        id_document="verifications/documents/test.jpg",
        selfie="verifications/selfies/test.jpg",
        status="APPROVED",
    )
    return owner


@pytest.fixture
def host(db, owner):
    user = User.objects.create_user(
        email="host@example.com",
        password="testpass123",
        role="HOST",
        name="Test Host",
    )
    IdentityVerification.objects.create(
        user=user,
        verification_type="NIN",
        id_number="99988877766",
        id_document="verifications/documents/test.jpg",
        selfie="verifications/selfies/test.jpg",
        status="APPROVED",
    )
    OwnerHostMembership.objects.create(owner=owner, host=user)
    return user


@pytest.fixture
def active_shortlet(verified_owner, host):
    shortlet = Shortlet.objects.create(
        owner=verified_owner,
        title="Beach House Lagos",
        description="Beautiful beach house",
        shortlet_type="house",
        city="Lekki",
        state="Lagos",
        address="1 Beach Road",
        bedrooms=3,
        bathrooms=2,
        max_guests=6,
        min_nights=2,
        base_price=Decimal("50000.00"),
        cleaning_fee=Decimal("5000.00"),
        currency="NGN",
        amenities=["WiFi", "Pool"],
        status=Shortlet.Status.ACTIVE,
    )
    for i in range(5):
        ShortletImage.objects.create(
            shortlet=shortlet, image=f"shortlets/img{i}.jpg", order=i
        )
    ShortletHostAssignment.objects.create(
        shortlet=shortlet,
        host=host,
        role="HOST",
        assigned_by=verified_owner,
        commission_percentage=Decimal("10.00"),
    )
    return shortlet


@pytest.fixture
def pending_booking(guest, active_shortlet):
    check_in = datetime.date.today() + datetime.timedelta(days=30)
    check_out = check_in + datetime.timedelta(days=3)
    nights = (check_out - check_in).days
    subtotal = active_shortlet.base_price * nights + active_shortlet.cleaning_fee
    platform_fee = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
    host_payout = (subtotal * Decimal("10") / Decimal("100")).quantize(Decimal("0.01"))
    return Booking.objects.create(
        guest=guest,
        shortlet=active_shortlet,
        check_in=check_in,
        check_out=check_out,
        number_of_guests=2,
        number_of_nights=nights,
        base_price_per_night=active_shortlet.base_price,
        cleaning_fee=active_shortlet.cleaning_fee,
        subtotal=subtotal,
        platform_fee=platform_fee,
        total_price=subtotal + platform_fee,
        currency="NGN",
        status=Booking.Status.PENDING,
        host_commission_percentage=Decimal("10.00"),
        host_payout_amount=host_payout,
        owner_payout_amount=subtotal - host_payout,
    )


@pytest.fixture
def confirmed_booking(guest, active_shortlet):
    check_in = datetime.date.today() + datetime.timedelta(days=60)
    check_out = check_in + datetime.timedelta(days=5)
    nights = (check_out - check_in).days
    subtotal = active_shortlet.base_price * nights + active_shortlet.cleaning_fee
    platform_fee = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
    host_payout = (subtotal * Decimal("10") / Decimal("100")).quantize(Decimal("0.01"))
    return Booking.objects.create(
        guest=guest,
        shortlet=active_shortlet,
        check_in=check_in,
        check_out=check_out,
        number_of_guests=3,
        number_of_nights=nights,
        base_price_per_night=active_shortlet.base_price,
        cleaning_fee=active_shortlet.cleaning_fee,
        subtotal=subtotal,
        platform_fee=platform_fee,
        total_price=subtotal + platform_fee,
        currency="NGN",
        status=Booking.Status.CONFIRMED,
        host_commission_percentage=Decimal("10.00"),
        host_payout_amount=host_payout,
        owner_payout_amount=subtotal - host_payout,
    )


@pytest.fixture
def owner_bank_account(verified_owner):
    return BankAccount.objects.create(
        user=verified_owner,
        bank_name="Access Bank",
        bank_code="044",
        account_number="0123456789",
        account_name="Test Owner",
        paystack_recipient_code="RCP_owner123",
        paystack_subaccount_code="ACCT_owner123",
        is_default=True,
    )


@pytest.fixture
def host_bank_account(host):
    return BankAccount.objects.create(
        user=host,
        bank_name="GTBank",
        bank_code="058",
        account_number="9876543210",
        account_name="Test Host",
        paystack_recipient_code="RCP_host456",
        paystack_subaccount_code="ACCT_host456",
        is_default=True,
    )


@pytest.fixture
def successful_payment(pending_booking):
    return Payment.objects.create(
        booking=pending_booking,
        reference="TRV-1-abc12345",
        amount=pending_booking.total_price,
        amount_kobo=int(pending_booking.total_price * 100),
        currency="NGN",
        status=Payment.Status.SUCCESS,
    )


@pytest.fixture
def pending_payment(pending_booking):
    return Payment.objects.create(
        booking=pending_booking,
        reference="TRV-1-pending1",
        amount=pending_booking.total_price,
        amount_kobo=int(pending_booking.total_price * 100),
        currency="NGN",
        status=Payment.Status.PENDING,
        paystack_authorization_url="https://checkout.paystack.com/test123",
        paystack_access_code="test123",
    )
