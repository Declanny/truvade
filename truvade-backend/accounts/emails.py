import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_html_email(*, subject, template, context, recipient_list, plain_text):
    """Send an email with an HTML template and plain text fallback."""
    html_content = render_to_string(template, context)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_list,
    )
    msg.attach_alternative(html_content, "text/html")
    try:
        msg.send()
        logger.info("Email sent to %s: %s", recipient_list, subject)
    except Exception:
        logger.exception("Failed to send email to %s: %s", recipient_list, subject)
        raise
