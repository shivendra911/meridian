"""
Meridian (PlaceFlow) — Definitive Enterprise MongoDB 7.0+ Architecture & System Report
Generates an exhaustive 45-60+ page technical whitepaper and academic engineering specification in PDF.
Uses standard templating with placeholder replacement to avoid f-string curly-brace conflicts.
"""

import os
import re
import sys
import json
import base64
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
PLACEFLOW_DIR = ROOT_DIR / "placeflow"
ASSETS_DIR = ROOT_DIR / "docs" / "assets"
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_HTML = DOCS_DIR / "Meridian_Enterprise_MongoDB_Architecture_Report.html"
OUTPUT_PDF = DOCS_DIR / "Meridian_Enterprise_MongoDB_Architecture_Report.pdf"

def load_svg(filename: str) -> str:
    path = ASSETS_DIR / filename
    if not path.exists():
        path = PLACEFLOW_DIR / "docs" / "assets" / filename
    if not path.exists():
        return f'<div style="padding:20px;background:#f1f5f9;color:#64748b;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;">[Vector Asset: {filename}]</div>'
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'<\?xml[^>]*\?>', '', text)
    return text

def load_png_base64(filename: str) -> str:
    path = ASSETS_DIR / filename
    if not path.exists():
        path = PLACEFLOW_DIR / "docs" / "assets" / filename
    if not path.exists():
        return ""
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{data}"

def build_report():
    print("=" * 80)
    print("BUILDING MERIDIAN ENTERPRISE MONGODB ARCHITECTURE REPORT (PDF)")
    print("=" * 80)

    print("Loading vector SVG assets...")
    svgs = {
        "__SVG_LOGO__": load_svg("meridian.svg"),
        "__SVG_PORTALS__": load_svg("endpoint-portals-matrix.svg"),
        "__SVG_AUTH__": load_svg("endpoint-auth-lifecycle.svg"),
        "__SVG_MASKING__": load_svg("endpoint-person-card-masking.svg"),
        "__SVG_CASCADING__": load_svg("endpoint-superday-cascading.svg"),
        "__SVG_STUDENT__": load_svg("perspective-student.svg"),
        "__SVG_TPO__": load_svg("perspective-tpo.svg"),
        "__SVG_FACULTY__": load_svg("perspective-faculty.svg"),
        "__SVG_HOD__": load_svg("perspective-hod.svg"),
        "__SVG_MGMT__": load_svg("perspective-management.svg"),
        "__SVG_ADMIN__": load_svg("perspective-admin.svg"),
    }
    print(f"Loaded {len(svgs)} vector diagrams.")

    print("Loading prototype PNG screenshots...")
    images = {
        "__IMG_PROTOTYPE_OVERVIEW__": load_png_base64("prototype-overview.png"),
        "__IMG_PROTOTYPE_STUDENT__": load_png_base64("prototype-student.png"),
        "__IMG_PROTOTYPE_TPO__": load_png_base64("prototype-tpo.png"),
        "__IMG_PROTOTYPE_FACULTY__": load_png_base64("prototype-faculty.png"),
        "__IMG_PROTOTYPE_HOD__": load_png_base64("prototype-hod.png"),
        "__IMG_PROTOTYPE_MGMT__": load_png_base64("prototype-management.png"),
        "__IMG_PROTOTYPE_ADMIN__": load_png_base64("prototype-admin.png"),
    }
    print(f"Loaded {len(images)} prototype screenshots.")

    # Assemble HTML document from report modules
    from generate_report_sections import get_html_document
    
    html = get_html_document(svgs, images)
    
    print(f"Writing complete HTML specification to {OUTPUT_HTML}...")
    OUTPUT_HTML.write_text(html, encoding="utf-8")
    print(f"HTML size: {len(html):,} bytes.")

    print("Compiling PDF via Google Chrome Headless...")
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    file_uri = OUTPUT_HTML.as_uri()

    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        f"--print-to-pdf={OUTPUT_PDF}",
        file_uri
    ]

    print(f"Running Chrome headless print-to-pdf...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("ERROR:", res.stderr)
        sys.exit(1)

    if not OUTPUT_PDF.exists():
        print("ERROR: Output PDF was not created!")
        sys.exit(1)

    pdf_bytes = OUTPUT_PDF.read_bytes()
    pdf_size_kb = len(pdf_bytes) / 1024
    page_count = len(re.findall(rb'/Type\s*/Page\b', pdf_bytes))

    print("=" * 80)
    print("PDF GENERATION SUCCESSFUL!")
    print(f"File Path:   {OUTPUT_PDF}")
    print(f"File Size:   {pdf_size_kb:.1f} KB ({len(pdf_bytes):,} bytes)")
    print(f"Page Count:  {page_count} Pages")
    print("=" * 80)

if __name__ == "__main__":
    build_report()
