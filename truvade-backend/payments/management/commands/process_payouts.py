from django.core.management.base import BaseCommand

from payments.domain.selectors import get_pending_payouts_eligible_for_disbursement
from payments.domain.services import initiate_payout


class Command(BaseCommand):
    help = "Process pending payouts (24hrs after check-in) via Paystack Transfers."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List eligible payouts without initiating transfers.",
        )

    def handle(self, *args, **options):
        payouts = get_pending_payouts_eligible_for_disbursement()
        count = payouts.count()

        if count == 0:
            self.stdout.write("No eligible payouts found.")
            return

        self.stdout.write(f"Found {count} eligible payout(s).")

        if options["dry_run"]:
            for payout in payouts:
                self.stdout.write(
                    f"  [{payout.recipient_type}] {payout.transfer_reference} "
                    f"- NGN {payout.amount} -> {payout.bank_account.account_name}"
                )
            self.stdout.write("Dry run complete. No transfers initiated.")
            return

        success = 0
        failed = 0
        for payout in payouts:
            try:
                initiate_payout(payout=payout)
                success += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  Initiated: {payout.transfer_reference}")
                )
            except Exception as e:
                failed += 1
                self.stderr.write(
                    self.style.ERROR(f"  Failed: {payout.transfer_reference} - {e}")
                )

        self.stdout.write(f"Done. {success} initiated, {failed} failed.")
