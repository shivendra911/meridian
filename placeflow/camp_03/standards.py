"""Regulatory Reference Registry & Standards Adapter for Indian Higher Education.

Provides canonical references for UGC CCFUG, NCrF, AICTE, and UGC 2025 Regulations,
allowing institutional qualifications and programs to be validated against national
standards without hardcoding framework circulars into application code.
"""

from typing import Dict, Any, Optional

REGULATORY_FRAMEWORKS: Dict[str, Dict[str, Any]] = {
    "UGC_CCFUG_2022": {
        "framework_name": "UGC CCFUG",
        "official_title": "Curriculum and Credit Framework for Undergraduate Programmes",
        "issuing_authority": "University Grants Commission",
        "version": "2022.1",
        "description": "Four-year undergraduate programme framework with multiple entry and exit options.",
        "levels": {
            4.5: {
                "credential": "Undergraduate Certificate",
                "minimum_credits": 40.0,
                "nominal_semesters": 2,
                "exit_internship_credits": 4.0,
            },
            5.0: {
                "credential": "Undergraduate Diploma",
                "minimum_credits": 80.0,
                "nominal_semesters": 4,
                "exit_internship_credits": 4.0,
            },
            5.5: {
                "credential": "Bachelor Degree (3-Year)",
                "minimum_credits": 120.0,
                "nominal_semesters": 6,
            },
            6.0: {
                "credential": "Bachelor Degree with Honours / Research (4-Year)",
                "minimum_credits": 160.0,
                "nominal_semesters": 8,
            },
        },
    },
    "NCRF_2023": {
        "framework_name": "NCrF",
        "official_title": "National Credit Framework",
        "issuing_authority": "Ministry of Education & NCVET",
        "version": "2023.1",
        "description": "Comprehensive integration of general higher education, vocational education, and experiential training.",
        "levels": {
            4.5: {"description": "1st Year Undergraduate / Advanced Certificate"},
            5.0: {"description": "2nd Year Undergraduate / Vocational Diploma"},
            5.5: {"description": "3-Year Undergraduate Degree"},
            6.0: {"description": "4-Year Bachelor Degree / Post-Diploma Engineering"},
            6.5: {"description": "1-Year Post Graduate Diploma"},
            7.0: {"description": "2-Year Master's Degree (M.Tech, MBA, M.Sc)"},
            8.0: {"description": "Doctoral Degree (Ph.D.)"},
        },
    },
    "AICTE_APH_2024": {
        "framework_name": "AICTE APH",
        "official_title": "AICTE Approval Process Handbook",
        "issuing_authority": "All India Council for Technical Education",
        "version": "2024-2027",
        "description": "Statutory norms for engineering, management, pharmacy, architecture, and polytechnic diplomas.",
        "norms": {
            "ENGINEERING_UG": {
                "nominal_duration_semesters": 8,
                "maximum_duration_semesters": 12,
                "minimum_credits": 160.0,
            },
            "MANAGEMENT_PG": {
                "nominal_duration_semesters": 4,
                "maximum_duration_semesters": 8,
                "minimum_credits": 100.0,
            },
            "DIPLOMA_ENG": {
                "nominal_duration_semesters": 6,
                "maximum_duration_semesters": 10,
                "minimum_credits": 120.0,
            },
        },
    },
    "UGC_MIN_STANDARDS_2025": {
        "framework_name": "UGC 2025 Regulations",
        "official_title": "UGC Minimum Standards and Procedure for Award of UG and PG Degrees Regulations, 2025",
        "issuing_authority": "University Grants Commission",
        "version": "2025.Draft/Final",
        "description": "Updated norms for credit recognition, accelerated degree completion, and academic bank linkage.",
    },
}


def get_framework_metadata(framework_name: str) -> Optional[Dict[str, Any]]:
    """Retrieve canonical regulatory framework metadata."""
    return REGULATORY_FRAMEWORKS.get(framework_name)


def validate_qualification_level(level: float, category: str) -> bool:
    """Validate that the NHEQF/NCrF level aligns with statutory category boundaries."""
    category_ranges = {
        "CERTIFICATE": (4.0, 5.0),
        "DIPLOMA": (4.5, 5.5),
        "UNDERGRADUATE": (5.0, 6.0),
        "POST_GRADUATE_DIPLOMA": (6.0, 6.5),
        "POSTGRADUATE": (6.5, 7.5),
        "DOCTORAL": (8.0, 8.5),
        "VOCATIONAL": (4.0, 7.0),
    }
    bounds = category_ranges.get(category)
    if not bounds:
        return True
    return bounds[0] <= level <= bounds[1]


def recommend_qualification_level(category: str, nominal_semesters: int) -> float:
    """Suggest standard NCrF level given category and nominal duration."""
    if category == "UNDERGRADUATE":
        if nominal_semesters >= 8:
            return 6.0
        return 5.5
    if category == "POSTGRADUATE":
        return 7.0
    if category == "DIPLOMA":
        return 5.0
    if category == "DOCTORAL":
        return 8.0
    if category == "CERTIFICATE":
        return 4.5
    if category == "POST_GRADUATE_DIPLOMA":
        return 6.5
    return 5.0

