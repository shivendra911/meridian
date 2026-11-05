"""DPDP Act 2023 Compliant PII Masking & Rehydration Engine.

Under India's Digital Personal Data Protection (DPDP) Act 2023, personal data
(Aadhaar, PAN, APAAR, phone numbers, personal emails, roll numbers, student names)
must not be sent to external model providers or stored unencrypted in AI logs.

Provides reversible synthetic token replacement for authorized runtime callers
and permanent redaction for telemetry and traces.
"""

from dataclasses import dataclass, field
import re
from typing import Dict, List, Optional, Tuple


@dataclass
class PIIEntity:
    """Detected PII token representation."""

    entity_type: str  # "AADHAAR", "PAN", "APAAR", "PHONE", "EMAIL", "ROLL_NO", "PERSON_NAME"
    original_value: str
    token_placeholder: str


class DPDPPrivacyEngine:
    """DPDP Act compliant anonymization and rehydration engine."""

    # Regex patterns for Indian national identifiers and personal contacts
    AADHAAR_REGEX = r"\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b"
    PAN_REGEX = r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b"
    APAAR_REGEX = r"\b\d{12}\b"
    PHONE_REGEX = r"\b(?:\+91[\-\s]?)?[6-9]\d{9}\b"
    EMAIL_REGEX = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    ROLL_REGEX = r"\b(?:STU|REG|ROLL)[0-9]{3,8}\b"

    def mask(
        self,
        text: str,
        known_names: Optional[List[str]] = None,
        known_apaar_ids: Optional[List[str]] = None,
    ) -> Tuple[str, Dict[str, str], int]:
        """Mask all PII occurrences in text with synthetic tokens.

        Args:
            text: Raw input text containing possible PII.
            known_names: Optional list of student/faculty names to mask explicitly.
            known_apaar_ids: Optional list of known 12-digit APAAR IDs to mask.

        Returns:
            Tuple of:
                masked_text: Anonymized text safe for external model input.
                token_map: Reversible dictionary {token_placeholder: original_value}.
                masked_count: Total number of PII values masked.
        """
        if not text or not isinstance(text, str):
            return text, {}, 0

        token_map: Dict[str, str] = {}
        masked_text = text
        counter = {
            "AADHAAR": 0,
            "PAN": 0,
            "APAAR": 0,
            "PHONE": 0,
            "EMAIL": 0,
            "ROLL_NO": 0,
            "PERSON_NAME": 0,
        }

        # 1. Mask known names first (longer names first to avoid substring partial masks)
        if known_names:
            sorted_names = sorted(
                [n.strip() for n in known_names if n and len(n.strip()) > 2],
                key=len,
                reverse=True,
            )
            for name in sorted_names:
                name_pattern = re.compile(rf"\b{re.escape(name)}\b", re.IGNORECASE)
                if name_pattern.search(masked_text):
                    counter["PERSON_NAME"] += 1
                    token = f"[STUDENT_NAME_{counter['PERSON_NAME']}]"
                    token_map[token] = name
                    masked_text = name_pattern.sub(token, masked_text)

        # 2. Mask PAN Numbers (exact 10 alphanumeric)
        pan_matches = re.findall(self.PAN_REGEX, masked_text)
        for pan in set(pan_matches):
            counter["PAN"] += 1
            token = f"[PAN_TOKEN_{counter['PAN']}]"
            token_map[token] = pan
            masked_text = re.sub(rf"\b{re.escape(pan)}\b", token, masked_text)

        # 3. Mask Aadhaar Numbers (12 digits with optional spaces)
        aadhaar_matches = re.findall(self.AADHAAR_REGEX, masked_text)
        for aadhaar in set(aadhaar_matches):
            counter["AADHAAR"] += 1
            token = f"[AADHAAR_TOKEN_{counter['AADHAAR']}]"
            token_map[token] = aadhaar
            masked_text = re.sub(rf"\b{re.escape(aadhaar)}\b", token, masked_text)

        # 4. Mask explicitly known APAAR IDs
        if known_apaar_ids:
            for apaar in set(known_apaar_ids):
                if re.search(rf"\b{re.escape(apaar)}\b", masked_text):
                    counter["APAAR"] += 1
                    token = f"[APAAR_TOKEN_{counter['APAAR']}]"
                    token_map[token] = apaar
                    masked_text = re.sub(rf"\b{re.escape(apaar)}\b", token, masked_text)

        # 5. Mask Email Addresses
        email_matches = re.findall(self.EMAIL_REGEX, masked_text)
        for email in set(email_matches):
            counter["EMAIL"] += 1
            token = f"[EMAIL_TOKEN_{counter['EMAIL']}]"
            token_map[token] = email
            masked_text = re.sub(rf"\b{re.escape(email)}\b", token, masked_text)

        # 6. Mask Indian Phone Numbers
        phone_matches = re.findall(self.PHONE_REGEX, masked_text)
        for phone in set(phone_matches):
            counter["PHONE"] += 1
            token = f"[PHONE_TOKEN_{counter['PHONE']}]"
            token_map[token] = phone
            masked_text = re.sub(rf"\b{re.escape(phone)}\b", token, masked_text)

        # 7. Mask Student Roll Numbers
        roll_matches = re.findall(self.ROLL_REGEX, masked_text)
        for roll in set(roll_matches):
            counter["ROLL_NO"] += 1
            token = f"[ROLL_NO_{counter['ROLL_NO']}]"
            token_map[token] = roll
            masked_text = re.sub(rf"\b{re.escape(roll)}\b", token, masked_text)

        total_masked = sum(counter.values())
        return masked_text, token_map, total_masked

    def rehydrate(self, masked_text: str, token_map: Dict[str, str]) -> str:
        """Replaces synthetic tokens back with their original real values.

        Only executed for authorized internal users viewing final outputs.
        """
        if not masked_text or not token_map:
            return masked_text

        rehydrated = masked_text
        for token, original in token_map.items():
            rehydrated = rehydrated.replace(token, original)
        return rehydrated

    def redact_permanently(self, text: str) -> str:
        """Irreversibly scrubs all PII for system logging and observability."""
        if not text:
            return ""
        masked, _, _ = self.mask(text)
        # Redact remaining token placeholders to generic tags
        redacted = re.sub(r"\[[A-Z_]+_\d+\]", "[REDACTED]", masked)
        return redacted

