"""Seed Baseline Platform Tenants, Institutions, Campuses, and Hierarchies for CAMP-01."""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from camp_01.directory import seed_public_directory
from camp_01.onboarding import execute_full_onboarding_pipeline
from camp_01.tenants import get_tenant_by_slug
from database.connection import get_db


def seed_baseline_institutions():
    db = get_db()
    # 1. Ensure public directory is seeded
    seed_public_directory(db)

    # Clean up any broken half-provisioned tenants if needed
    for s in ["iit-bombay", "delhi-university"]:
        t = get_tenant_by_slug(s, db)
        if t and db.institutions.count_documents({"tenant_id": t["id"]}) == 0:
            db.platform_tenants.delete_one({"id": t["id"]})

    # 2. Seed IIT Bombay System if missing
    t1 = get_tenant_by_slug("iit-bombay", db)
    if not t1:
        print("Seeding IIT Bombay tenant & institution...")
        execute_full_onboarding_pipeline(
            tenant_name="IIT Bombay University System",
            tenant_slug="iit-bombay",
            customer_type="ENTERPRISE",
            admin_email="director@iitb.ac.in",
            institution_code="IITB_MAIN",
            legal_name="Indian Institute of Technology Bombay",
            display_name="IIT Bombay",
            institution_type="INSTITUTE_OF_NATIONAL_IMPORTANCE",
            classifications={
                "institution_kind": "INSTITUTE",
                "ownership": "CENTRAL_GOVERNMENT",
                "governance": "PUBLIC",
                "recognition_status": "RECOGNIZED",
                "institutional_role": "DEGREE_AWARDING",
                "delivery_model": "PHYSICAL",
            },
            campus_code="POWAI_MAIN",
            campus_name="Powai Main Campus",
            primary_location_data={
                "address_line1": "Main Gate Rd, IIT Area, Powai",
                "city": "Mumbai",
                "district": "Mumbai Suburban",
                "state": "Maharashtra",
                "postal_code": "400076",
                "latitude": 19.1334,
                "longitude": 72.9133,
            },
            regulatory_identifiers=[
                {
                    "scheme": "AISHE",
                    "value": "U-0053",
                    "issuer": "Ministry of Education",
                },
                {
                    "scheme": "UGC",
                    "value": "UGC-INI-001",
                    "issuer": "University Grants Commission",
                },
            ],
            root_org_unit_name="Office of the Director & Senate",
            branding_settings={
                "primary_color": "#8C1515",
                "accent_color": "#0B1B3D",
                "motto": "Knowledge is Supreme",
            },
            db=db,
        )
    else:
        print("IIT Bombay tenant already exists.")

    # 3. Seed Delhi University if missing
    t2 = get_tenant_by_slug("delhi-university", db)
    if not t2:
        print("Seeding Delhi University tenant & institution...")
        execute_full_onboarding_pipeline(
            tenant_name="University of Delhi Consortium",
            tenant_slug="delhi-university",
            customer_type="STATE_UNIVERSITY",
            admin_email="vc@du.ac.in",
            institution_code="DU_MAIN",
            legal_name="University of Delhi",
            display_name="Delhi University",
            institution_type="CENTRAL_UNIVERSITY",
            classifications={
                "institution_kind": "UNIVERSITY",
                "ownership": "CENTRAL_GOVERNMENT",
                "governance": "PUBLIC",
                "recognition_status": "RECOGNIZED",
                "institutional_role": "DEGREE_AWARDING",
                "delivery_model": "PHYSICAL",
            },
            campus_code="NORTH_ENCLAVE",
            campus_name="North Campus Enclave",
            primary_location_data={
                "address_line1": "University Enclave",
                "city": "New Delhi",
                "district": "North Delhi",
                "state": "Delhi",
                "postal_code": "110007",
                "latitude": 28.6892,
                "longitude": 77.2104,
            },
            regulatory_identifiers=[
                {
                    "scheme": "AISHE",
                    "value": "U-0120",
                    "issuer": "Ministry of Education",
                }
            ],
            root_org_unit_name="Office of the Vice Chancellor",
            branding_settings={
                "primary_color": "#1A365D",
                "accent_color": "#D69E2E",
                "motto": "Dedicated to Truth",
            },
            db=db,
        )
    else:
        print("Delhi University tenant already exists.")

    print("Baseline institutional seeding completed successfully.")


if __name__ == "__main__":
    seed_baseline_institutions()
