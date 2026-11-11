"""
Meridian (PlaceFlow) — Master Technical Report Content Assembler (High-Occupancy Academic Edition)
Integrates all chapters, styles, vector diagrams, and prototype screenshots into a unified,
publication-grade HTML specification.
"""
import sys
from pathlib import Path

# Add current scripts directory to path for clean module imports
SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from report_modules.styles import get_css
from report_modules.front_matter import get_front_matter
from report_modules.ch1_problem_objectives import get_chapter_1
from report_modules.ch2_literature_survey import get_chapter_2
from report_modules.ch3_methodology import get_chapter_3
from report_modules.ch4_architecture_schemas import get_chapter_4
from report_modules.ch5_stack_prototype import get_chapter_5
from report_modules.ch6_algorithms_pipelines import get_chapter_6
from report_modules.ch7_testing_validation import get_chapter_7
from report_modules.ch8_results_performance import get_chapter_8
from report_modules.ch9_conclusion_future import get_chapter_9
from report_modules.appendices import get_appendices

def get_html_document(svgs: dict, images: dict = None) -> str:
    css = get_css()
    body = (
        get_front_matter() +
        get_chapter_1() +
        get_chapter_2() +
        get_chapter_3() +
        get_chapter_4() +
        get_chapter_5() +
        get_chapter_6() +
        get_chapter_7() +
        get_chapter_8() +
        get_chapter_9() +
        get_appendices()
    )

    full_html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Meridian (PlaceFlow) — Enterprise MongoDB 7.0+ Architecture &amp; Systems Whitepaper</title>
<style>__CSS__</style>
</head>
<body>
__BODY__
</body>
</html>"""

    full_html = full_html.replace("__CSS__", css)
    full_html = full_html.replace("__BODY__", body)

    for placeholder, svg_content in svgs.items():
        full_html = full_html.replace(placeholder, svg_content)

    if images:
        for placeholder, img_src in images.items():
            full_html = full_html.replace(placeholder, img_src)

    return full_html
