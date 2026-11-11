"""Transactional and lifecycle email dispatcher for Meridian.

When settings.DEBUG is True, prints formatted email to console for developer convenience.
When settings.DEBUG is False, dispatches through Django core email backend.
"""

import logging
from typing import Optional
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("meridian.mailer")


def send_lifecycle_email(
    to_email: str,
    subject: str,
    body: str,
    link: Optional[str] = None,
) -> bool:
    """Dispatches a lifecycle notification or verification email."""
    full_body = body.strip()
    if link:
        full_body += f"\n\nLink: {link}"

    is_debug = getattr(settings, "DEBUG", True)
    if is_debug:
        msg = (
            f"\n"
            f"==================================================\n"
            f"[MERIDIAN DEV EMAIL]\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"Body:\n{full_body}\n"
            f"==================================================\n"
        )
        print(msg)
        logger.info("Dev email delivered to %s: %s", to_email, subject)
        return True

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@meridian.edu")
    try:
        send_mail(
            subject=subject,
            message=full_body,
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False
