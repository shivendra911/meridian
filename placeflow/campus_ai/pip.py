"""Prompt Injection Prevention (PIP) Engine for Campus AI Layer.

Provides rigorous regex and heuristic detection of prompt injection attacks,
jailbreaks, instruction overrides, system role spoofing, and delimiter escaping.
Strictly guards against adversarial student/user inputs before reaching any LLM.
"""

from dataclasses import dataclass, field
import re
from typing import List, Optional


class PromptInjectionDetectedError(Exception):
    """Raised when an adversarial prompt injection attack is detected."""

    def __init__(self, threats: List[str], snippet: str):
        self.threats = threats
        self.snippet = snippet
        super().__init__(
            f"Adversarial prompt injection detected: {', '.join(threats)} in '{snippet}'"
        )


@dataclass
class PIPScanResult:
    """Outcome of a prompt injection scan."""

    is_safe: bool
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    threats_detected: List[str] = field(default_factory=list)
    sanitized_prompt: str = ""
    action_taken: str = "ALLOW"  # "ALLOW", "FLAG", "BLOCK"


# Common high-risk adversarial patterns targeting institutional LLMs
INJECTION_PATTERNS = [
    # Direct instruction overrides
    (
        r"(?i)\b(?:ignore|disregard|forget|override|bypass)\b[\s\S]{0,40}\b(?:previous|all|prior|above|system)\b[\s\S]{0,30}\b(?:instructions|prompts|directions|rules|guidelines)\b",
        "INSTRUCTION_OVERRIDE",
        "CRITICAL",
    ),
    (
        r"(?i)\byou are now\b[\s\S]{0,30}\b(?:DAN|unrestricted|jailbroken|god mode|developer mode|root|sysadmin|unfiltered)\b",
        "ROLE_HIJACKING",
        "CRITICAL",
    ),
    (
        r"(?i)\b(?:reveal|print|output|display|show|leak)\b[\s\S]{0,30}\b(?:system prompt|initial instructions|hidden prompt|secret instructions|core instructions)\b",
        "SYSTEM_PROMPT_EXTRACTION",
        "HIGH",
    ),
    # Delimiter and system role spoofing
    (
        r"(?i)<\|im_start\|>|<\|im_end\|>|\[SYSTEM\]|\[INST\]|\[\/INST\]|```system",
        "SYSTEM_TAG_INJECTION",
        "CRITICAL",
    ),
    (
        r"(?i)<\s*(?:system|admin|eval|context)\s*>[\s\S]*?<\s*/\s*(?:system|admin|eval|context)\s*>",
        "DELIMITER_TAG_SPOOFING",
        "HIGH",
    ),
    # Sensitive credential / environment exfiltration
    (
        r"(?i)\b(?:process\.env|os\.environ|env\[|AWS_SECRET|MONGODB_URI|SECRET_KEY|DATABASE_URL)\b",
        "CREDENTIAL_EXFILTRATION_PROBE",
        "CRITICAL",
    ),
    # Base64 or obfuscated bypass indicators
    (
        r"(?i)\b(?:eval|exec)\s*\(\s*(?:base64|b64decode|atob)\b",
        "CODE_EXECUTION_PAYLOAD",
        "CRITICAL",
    ),
    # Role reversal attempts
    (
        r"(?i)\bstop being a(?:n)?\s+(?:advisor|assistant|bot|counselor)\b",
        "PERSONA_TERMINATION",
        "MEDIUM",
    ),
]


class PromptInjectionFilter:
    """Stateless scanner and sanitization engine for LLM inputs."""

    def __init__(self, strict_mode: bool = True):
        self.strict_mode = strict_mode

    def scan(self, prompt: str) -> PIPScanResult:
        """Scan a prompt string for known adversarial injection patterns.

        Args:
            prompt: Raw user or student text.

        Returns:
            PIPScanResult detailing threats, risk level, and sanitized text.

        Raises:
            PromptInjectionDetectedError if risk is CRITICAL and strict_mode is True.
        """
        if not prompt or not isinstance(prompt, str):
            return PIPScanResult(
                is_safe=True,
                risk_level="LOW",
                threats_detected=[],
                sanitized_prompt=str(prompt or ""),
                action_taken="ALLOW",
            )

        detected_threats: List[str] = []
        highest_risk = "LOW"
        risk_priority = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

        for pattern, threat_name, severity in INJECTION_PATTERNS:
            if re.search(pattern, prompt):
                detected_threats.append(threat_name)
                if risk_priority[severity] > risk_priority[highest_risk]:
                    highest_risk = severity

        # Check for excessive delimiter sequences or control characters
        if prompt.count("```") > 4 or prompt.count("---") > 6:
            detected_threats.append("EXCESSIVE_DELIMITERS")
            if risk_priority["MEDIUM"] > risk_priority[highest_risk]:
                highest_risk = "MEDIUM"

        is_safe = len(detected_threats) == 0
        action = "ALLOW"
        if not is_safe:
            if highest_risk in ("CRITICAL", "HIGH"):
                action = "BLOCK"
            else:
                action = "FLAG"

        # Sanitize prompt by stripping dangerous tags and control sequences
        sanitized = self._sanitize(prompt)

        result = PIPScanResult(
            is_safe=is_safe,
            risk_level=highest_risk,
            threats_detected=detected_threats,
            sanitized_prompt=sanitized,
            action_taken=action,
        )

        if self.strict_mode and action == "BLOCK":
            snippet = (prompt[:80] + "...") if len(prompt) > 80 else prompt
            raise PromptInjectionDetectedError(detected_threats, snippet)

        return result

    def _sanitize(self, text: str) -> str:
        """Strips tags and control tokens that could confuse LLM parsing."""
        cleaned = re.sub(r"<\|im_start\|>|<\|im_end\|>|\[SYSTEM\]|\[INST\]|\[\/INST\]", "", text)
        cleaned = re.sub(r"<\s*/?\s*(?:system|admin|eval|context)\s*>", "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

