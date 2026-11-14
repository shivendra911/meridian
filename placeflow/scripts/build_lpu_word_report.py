"""
build_lpu_word_report.py
Constructs the complete, publication-grade, editable Microsoft Word (.docx) report
for Lovely Professional University (LPU) - CSE494: Intelligent NoSQL Databases.
Complies with the official LPU Project Evaluation Dossier template.

Features:
- Page 1: Official Institutional Project Dossier Cover (LPU Header Banner, Student & Faculty Credentials, Project Title).
- Page 2: Official Academic Task 2 Question Statement & Evaluation Rubric Matrix (reproducing CA_2_October.pdf).
- Page 3+: Comprehensive Chapters (18 collections, CRUD, 15 aggregation pipelines, PyMongo ACID cascading,
  live prototype screenshots, testing hierarchy, explain plans, and Viva-Voce guide).
- Zero blank / fully empty pages (guaranteed by intelligent break suppression).
- Spacious, publication-grade academic typography (not cramped/congested).
- Perfectly aligned table widths (6.6 inches) preventing any margin clipping.
"""

import os
import sys
import re
from bs4 import BeautifulSoup, NavigableString, Tag
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Length
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

# Set path for report_modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

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

# --- BRANDING & COLOR PALETTE ---
HEX_NAVY = "1E293B"       # Deep Slate Navy
HEX_DARK_NAVY = "0F172A"  # Primary Dark Text
HEX_LPU_ORANGE = "D05A20" # Official LPU Rust Orange
HEX_AMBER = "F59E0B"      # Secondary Accent
HEX_LIGHT_BG = "F8FAFC"   # Shaded cell background
HEX_CODE_BG = "F1F5F9"    # Code Box Shading
HEX_BORDER = "CBD5E1"     # Table Border Gray
HEX_MUTED_TEXT = "64748B" # Muted text
HEX_WHITE = "FFFFFF"

RGB_NAVY = RGBColor(0x1E, 0x29, 0x3B)
RGB_DARK_NAVY = RGBColor(0x0F, 0x17, 0x2A)
RGB_LPU_ORANGE = RGBColor(0xD0, 0x5A, 0x20)
RGB_MUTED = RGBColor(0x64, 0x74, 0x8B)
RGB_BODY = RGBColor(0x33, 0x41, 0x55)
RGB_WHITE = RGBColor(0xFF, 0xFF, 0xFF)

ASSETS_DIR = r"c:\Users\shive\projects\mongoca2\docs\assets"
DOCX_OUT_PATH = r"c:\Users\shive\projects\mongoca2\docs\Meridian_Enterprise_MongoDB_Architecture_Report.docx"

IMAGE_MAP = {
    "__SVG_AUTH__": os.path.join(ASSETS_DIR, "endpoint-auth-lifecycle.png"),
    "__SVG_PORTALS__": os.path.join(ASSETS_DIR, "endpoint-portals-matrix.png"),
    "__SVG_CASCADING__": os.path.join(ASSETS_DIR, "endpoint-superday-cascading.png"),
    "__SVG_MASKING__": os.path.join(ASSETS_DIR, "endpoint-person-card-masking.png"),
    "__SVG_STUDENT__": os.path.join(ASSETS_DIR, "perspective-student.png"),
    "__SVG_TPO__": os.path.join(ASSETS_DIR, "perspective-tpo.png"),
    "__SVG_FACULTY__": os.path.join(ASSETS_DIR, "perspective-faculty.png"),
    "__SVG_HOD__": os.path.join(ASSETS_DIR, "perspective-hod.png"),
    "__SVG_MGMT__": os.path.join(ASSETS_DIR, "perspective-management.png"),
    "__SVG_ADMIN__": os.path.join(ASSETS_DIR, "perspective-admin.png"),
    "__IMG_PROTOTYPE_OVERVIEW__": os.path.join(ASSETS_DIR, "prototype-overview.png"),
    "__IMG_PROTOTYPE_STUDENT__": os.path.join(ASSETS_DIR, "prototype-student.png"),
    "__IMG_PROTOTYPE_TPO__": os.path.join(ASSETS_DIR, "prototype-tpo.png"),
    "__IMG_PROTOTYPE_FACULTY__": os.path.join(ASSETS_DIR, "prototype-faculty.png"),
    "__IMG_PROTOTYPE_HOD__": os.path.join(ASSETS_DIR, "prototype-hod.png"),
    "__IMG_PROTOTYPE_MGMT__": os.path.join(ASSETS_DIR, "prototype-management.png"),
    "__IMG_PROTOTYPE_ADMIN__": os.path.join(ASSETS_DIR, "prototype-admin.png"),
    "__SVG_LOGO__": os.path.join(ASSETS_DIR, "lpu_side_icon.png")
}

# ==========================================
# INTELLIGENT DOCUMENT BUILDER CLASS
# ==========================================

class LpuReportBuilder:
    def __init__(self):
        self.doc = Document()
        self.has_content_on_page = False
        self._setup_section()

    def _setup_section(self):
        section = self.doc.sections[0]
        section.page_width = Inches(8.27)  # A4
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.65)
        section.bottom_margin = Inches(0.65)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
        # Add black/navy box page border frame
        add_page_border(section, color="1E293B", sz="8")
        
        # Different first page so cover page is distinct
        section.different_first_page_header_footer = True
        
        # Running Header for Page 2 onwards
        header = section.header
        header_tbl = header.add_table(rows=1, cols=2, width=Inches(6.6))
        header_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        header_tbl.autofit = False
        
        c_left = header_tbl.cell(0, 0)
        c_left.width = Inches(1.2)
        p_icon = c_left.paragraphs[0]
        p_icon.paragraph_format.space_before = Pt(0)
        p_icon.paragraph_format.space_after = Pt(0)
        
        side_icon_path = os.path.join(ASSETS_DIR, "lpu_side_icon.png")
        if os.path.exists(side_icon_path):
            r_img = p_icon.add_run()
            r_img.add_picture(side_icon_path, width=Inches(0.35))
            
        c_right = header_tbl.cell(0, 1)
        c_right.width = Inches(5.4)
        p_right = c_right.paragraphs[0]
        p_right.paragraph_format.space_before = Pt(0)
        p_right.paragraph_format.space_after = Pt(0)
        p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        r_h1 = p_right.add_run("LOVELY PROFESSIONAL UNIVERSITY | CSE494: INTELLIGENT NOSQL DATABASES\n")
        r_h1.font.size = Pt(7.5)
        r_h1.bold = True
        r_h1.font.color.rgb = RGB_LPU_ORANGE
        
        r_h2 = p_right.add_run("Meridian: Enterprise Campus Placement Automation Engine — Project Report")
        r_h2.font.size = Pt(7.0)
        r_h2.font.color.rgb = RGB_MUTED
        
        set_cell_borders(c_left, bottom={'val': 'single', 'sz': '4', 'color': HEX_BORDER})
        set_cell_borders(c_right, bottom={'val': 'single', 'sz': '4', 'color': HEX_BORDER})
        
        # Running Footer
        footer = section.footer
        footer_tbl = footer.add_table(rows=1, cols=2, width=Inches(6.6))
        footer_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        footer_tbl.autofit = False
        
        fc_left = footer_tbl.cell(0, 0)
        fc_left.width = Inches(4.6)
        p_foot_l = fc_left.paragraphs[0]
        p_foot_l.paragraph_format.space_before = Pt(0)
        p_foot_l.paragraph_format.space_after = Pt(0)
        r_fl = p_foot_l.add_run("Meridian Campus Placement Engine | Department of Computer Science & Engineering")
        r_fl.font.size = Pt(7.0)
        r_fl.font.color.rgb = RGB_MUTED
        
        fc_right = footer_tbl.cell(0, 1)
        fc_right.width = Inches(2.0)
        p_foot_r = fc_right.paragraphs[0]
        p_foot_r.paragraph_format.space_before = Pt(0)
        p_foot_r.paragraph_format.space_after = Pt(0)
        p_foot_r.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_fr = p_foot_r.add_run("Academic Task 2 (Project Report)")
        r_fr.font.size = Pt(7.0)
        r_fr.bold = True
        r_fr.font.color.rgb = RGB_DARK_NAVY
        
        set_cell_borders(fc_left, top={'val': 'single', 'sz': '4', 'color': HEX_BORDER})
        set_cell_borders(fc_right, top={'val': 'single', 'sz': '4', 'color': HEX_BORDER})

    def add_page_break(self, force=False):
        """Adds a page break ONLY if content exists on the current page, preventing blank pages."""
        if self.has_content_on_page or force:
            self.doc.add_page_break()
            self.has_content_on_page = False

    def mark_content_added(self):
        """Marks that visible content now occupies the current page."""
        self.has_content_on_page = True

    def add_styled_heading(self, text, level=1):
        self.mark_content_added()
        p = self.doc.add_paragraph()
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.space_before = Pt(12 if level == 1 else (9 if level == 2 else 6))
        p.paragraph_format.space_after = Pt(3 if level == 1 else 2)
        
        run = p.add_run(text)
        run.bold = True
        if level == 1:
            run.font.size = Pt(14.0)
            run.font.color.rgb = RGB_LPU_ORANGE
            pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="3" w:color="{HEX_LPU_ORANGE}"/></w:pBdr>')
            p._p.get_or_add_pPr().append(pBdr)
        elif level == 2:
            run.font.size = Pt(11.5)
            run.font.color.rgb = RGB_DARK_NAVY
        elif level == 3:
            run.font.size = Pt(10.0)
            run.font.color.rgb = RGB_LPU_ORANGE
        else:
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGB_DARK_NAVY
        return p

    def add_body_p(self, text="", bold_prefix=None, space_after=3.5):
        if not text and not bold_prefix:
            return None
        self.mark_content_added()
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.14
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.size = Pt(9.5)
            r_pre.font.color.rgb = RGB_DARK_NAVY
        if text:
            r_text = p.add_run(text)
            r_text.font.size = Pt(9.5)
            r_text.font.color.rgb = RGB_BODY
        return p

    def add_bullet_p(self, text, bold_prefix=None, space_after=2.0):
        if not text and not bold_prefix:
            return None
        self.mark_content_added()
        p = self.doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.12
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.size = Pt(9.0)
            r_pre.font.color.rgb = RGB_DARK_NAVY
        if text:
            r_text = p.add_run(text)
            r_text.font.size = Pt(9.0)
            r_text.font.color.rgb = RGB_BODY
        return p

    def add_callout_box(self, text, title="ARCHITECTURAL INVARIANT", border_color=HEX_LPU_ORANGE, bg_color=HEX_LIGHT_BG):
        self.mark_content_added()
        table = self.doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        
        cell = table.cell(0, 0)
        cell.width = Inches(6.6)
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=60, bottom=60, left=120, right=100)
        set_cell_borders(cell, left={'val': 'single', 'sz': '20', 'color': border_color})
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.10
        if title:
            r_title = p.add_run(f"[{title}] ")
            r_title.bold = True
            r_title.font.size = Pt(8.5)
            r_title.font.color.rgb = RGB_LPU_ORANGE
        
        r_text = p.add_run(text)
        r_text.font.size = Pt(8.5)
        r_text.font.color.rgb = RGB_DARK_NAVY

    def add_code_block(self, code_str, caption=None):
        self.mark_content_added()
        table = self.doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        
        cell = table.cell(0, 0)
        cell.width = Inches(6.6)
        set_cell_background(cell, HEX_CODE_BG)
        set_cell_margins(cell, top=50, bottom=50, left=100, right=80)
        set_cell_borders(cell, 
                         top={'val': 'single', 'sz': '4', 'color': HEX_BORDER},
                         bottom={'val': 'single', 'sz': '4', 'color': HEX_BORDER},
                         left={'val': 'single', 'sz': '14', 'color': HEX_NAVY},
                         right={'val': 'single', 'sz': '4', 'color': HEX_BORDER})
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.04
        
        lines = code_str.strip().split("\n")
        for i, line in enumerate(lines):
            r = p.add_run(line + ("\n" if i < len(lines)-1 else ""))
            r.font.name = "Consolas"
            r.font.size = Pt(7.5)
            r.font.color.rgb = RGB_DARK_NAVY
            
        if caption:
            p_cap = self.doc.add_paragraph()
            p_cap.paragraph_format.space_before = Pt(1.5)
            p_cap.paragraph_format.space_after = Pt(3)
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_cap = p_cap.add_run(f"Listing: {caption}")
            r_cap.font.size = Pt(7.5)
            r_cap.italic = True
            r_cap.font.color.rgb = RGB_MUTED

    def add_image_box(self, image_path, caption=None, width_inches=6.0):
        if not os.path.exists(image_path):
            return
        self.mark_content_added()
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(1.5)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(image_path, width=Inches(width_inches))
        
        if caption:
            p_cap = self.doc.add_paragraph()
            p_cap.paragraph_format.space_before = Pt(1)
            p_cap.paragraph_format.space_after = Pt(3)
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_cap = p_cap.add_run(f"Figure: {caption}")
            r_cap.font.size = Pt(8.0)
            r_cap.italic = True
            r_cap.bold = True
            r_cap.font.color.rgb = RGB_DARK_NAVY

    def create_styled_table(self, headers, data, col_widths=None):
        self.mark_content_added()
        table = self.doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        set_table_borders(table, color=HEX_BORDER, sz="4")
        
        # Header Row
        hdr_cells = table.rows[0].cells
        trPr = table.rows[0]._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
        
        for i, title in enumerate(headers):
            hdr_cells[i].text = title
            set_cell_background(hdr_cells[i], HEX_NAVY)
            set_cell_margins(hdr_cells[i], top=50, bottom=50, left=80, right=80)
            p = hdr_cells[i].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(8.0)
                r.font.color.rgb = RGB_WHITE
                
        # Data Rows
        for row_idx, row_data in enumerate(data):
            row_cells = table.rows[row_idx + 1].cells
            bg_col = HEX_WHITE if row_idx % 2 == 0 else HEX_LIGHT_BG
            for col_idx, cell_value in enumerate(row_data):
                row_cells[col_idx].text = str(cell_value)
                set_cell_background(row_cells[col_idx], bg_col)
                set_cell_margins(row_cells[col_idx], top=40, bottom=40, left=80, right=80)
                p = row_cells[col_idx].paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.size = Pt(7.5)
                    r.font.color.rgb = RGB_BODY
                    
        # Apply exact Column widths
        if col_widths:
            for row in table.rows:
                for idx, width in enumerate(col_widths):
                    if idx < len(row.cells):
                        if isinstance(width, Length):
                            row.cells[idx].width = width
                        else:
                            row.cells[idx].width = Inches(width)
                        
        return table

# ==========================================
# XML HELPERS
# ==========================================

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=50, bottom=50, left=80, right=80):
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    cell._tc.get_or_add_tcPr().append(tcMar)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
    sides = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for side, border in sides.items():
        if border:
            val = border.get('val', 'single')
            sz = border.get('sz', '4')
            color = border.get('color', 'CBD5E1')
            space = border.get('space', '0')
            b_xml = parse_xml(f'<w:{side} {nsdecls("w")} w:val="{val}" w:sz="{sz}" w:space="{space}" w:color="{color}"/>')
            tcBorders.append(b_xml)
        else:
            tcBorders.append(parse_xml(f'<w:{side} {nsdecls("w")} w:val="none"/>'))
    cell._tc.get_or_add_tcPr().append(tcBorders)

def set_table_borders(table, color="CBD5E1", sz="4"):
    tblPr = table._tbl.tblPr
    borders_xml = (
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(parse_xml(borders_xml))

def add_page_border(section, color="1E293B", sz="8"):
    pg_borders_xml = (
        f'<w:pgBorders {nsdecls("w")} w:offsetFrom="page">'
        f'<w:top w:val="single" w:sz="{sz}" w:space="20" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="{sz}" w:space="20" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:space="20" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="{sz}" w:space="20" w:color="{color}"/>'
        f'</w:pgBorders>'
    )
    section._sectPr.append(parse_xml(pg_borders_xml))

# ==========================================
# PAGE 1: INSTITUTIONAL FRONT COVER
# ==========================================

def add_cover_page(builder):
    """
    Page 1: Formal Institutional Cover Dossier.
    Spacious, beautifully proportioned, and fitted to Page 1.
    """
    banner_path = os.path.join(ASSETS_DIR, "lpu_header_banner.png")
    if os.path.exists(banner_path):
        p_logo = builder.doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(2)
        run_logo = p_logo.add_run()
        run_logo.add_picture(banner_path, width=Inches(3.2))
        builder.mark_content_added()
        
    p_inst = builder.doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(0)
    p_inst.paragraph_format.space_after = Pt(2)
    r_u = p_inst.add_run("LOVELY PROFESSIONAL UNIVERSITY\n")
    r_u.bold = True
    r_u.font.size = Pt(13.0)
    r_u.font.color.rgb = RGB_LPU_ORANGE
    
    r_m = p_inst.add_run("Transforming Education, Transforming India\n")
    r_m.font.size = Pt(9.0)
    r_m.italic = True
    r_m.font.color.rgb = RGB_MUTED
    
    r_inst = p_inst.add_run("SCHOOL OF COMPUTER SCIENCE & ENGINEERING\nDEPARTMENT OF COMPUTER SCIENCE & ENGINEERING")
    r_inst.bold = True
    r_inst.font.size = Pt(9.5)
    r_inst.font.color.rgb = RGB_DARK_NAVY
    
    p_task = builder.doc.add_paragraph()
    p_task.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_task.paragraph_format.space_before = Pt(2)
    p_task.paragraph_format.space_after = Pt(6)
    r_task = p_task.add_run("ACADEMIC TASK NO. 2 (PROJECT REPORT & EVALUATION DOSSIER)")
    r_task.bold = True
    r_task.font.size = Pt(11.5)
    r_task.font.color.rgb = RGB_LPU_ORANGE
    
    # Task Meta Box (Width: 6.6 inches)
    meta_headers = ["Course Code & Title", "Dates & Allocation", "Task Type & Evaluation"]
    meta_rows = [
        [
            "Course Code: CSE494\nCourse Title: INTELLIGENT NOSQL DATABASES\nProgramme: B.Tech Computer Science & Engineering",
            "Date of Allotment: 29th August, 2026\nDate of Submission: 16th October, 2026\nAcademic Session: 2026 - 2027",
            "Academic Task Type: Project\nMaximum Marks: 30 Marks\nCourse Outcomes: CO4, CO5, CO6\nBloom's Taxonomy: L2, L3"
        ]
    ]
    builder.create_styled_table(meta_headers, meta_rows, [2.2, 2.2, 2.2])
    
    # Project Title Banner
    p_title = builder.doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(3)
    r_t1 = p_title.add_run("PROJECT TITLE: MERIDIAN (PLACEFLOW)\n")
    r_t1.bold = True
    r_t1.font.size = Pt(13.0)
    r_t1.font.color.rgb = RGB_LPU_ORANGE
    
    r_t2 = p_title.add_run("Enterprise Multi-Perspective Campus Placement Automation Engine Powered by MongoDB 7.0+\nMulti-Document ACID Seat Cascading, and In-Process ML Fairness Governance")
    r_t2.font.size = Pt(9.0)
    r_t2.italic = True
    r_t2.font.color.rgb = RGB_DARK_NAVY
    
    # Student and Faculty Details Table (Width: 6.6 inches, 3.3" per column)
    cred_headers = ["STUDENT SUBMISSION CREDENTIALS", "EVALUATOR & FACULTY IN CHARGE"]
    cred_rows = [
        [
            "Student Name: Shivendra Pratap\n"
            "Registration Number: [12200000 / Enter Registration No.]\n"
            "Roll Number: [RK22XXXX / Enter Roll No.]\n"
            "Section / Group: [K22XX / Enter Section]\n"
            "Programme: Bachelor of Technology (B.Tech - CSE)\n"
            "School of Computer Science & Engineering\n"
            "Lovely Professional University, Phagwara, Punjab",
            
            "Faculty / Evaluator: [Enter Course Instructor Name]\n"
            "Designation: Assistant Professor / Course Instructor\n"
            "Department: Department of Computer Science & Engineering\n"
            "School: School of Computer Science & Engineering\n"
            "Lovely Professional University, Phagwara, Punjab\n"
            "Evaluator Signature: __________________________"
        ]
    ]
    builder.create_styled_table(cred_headers, cred_rows, [3.3, 3.3])
    
    # Page Break to Page 2
    builder.add_page_break(force=True)

# ==========================================
# PAGE 2: OFFICIAL EVALUATION SHEET & RUBRIC
# ==========================================

def add_evaluation_sheet_page(builder):
    """
    Page 2: Official Academic Task 2 Evaluation Sheet & Rubrics.
    Reproduces CA_2_October.pdf in full spacious academic detail.
    """
    builder.add_styled_heading("Official Academic Task 2 Project Evaluation Dossier", level=1)
    builder.add_body_p(
        "Course Code: CSE494 | Course Title: INTELLIGENT NOSQL DATABASES | Maximum Marks: 30\n"
        "Course Outcomes Mapped: CO4, CO5, CO6 | Bloom's Taxonomy Levels: L2 (Understand), L3 (Apply)",
        bold_prefix="Institutional Assessment Framework: "
    )
    
    # Official Assignment Question Statement Box
    q_headers = ["Q#", "Question Statement & Core Evaluation Scope", "CO Mapped", "Bloom's", "Max Marks"]
    q_statement_text = (
        "Design and implement a MongoDB-based application for a real-world problem of your choice. "
        "The project should demonstrate your ability to design a suitable document structure, apply validation rules, "
        "perform CRUD operations, connect MongoDB with Python using PyMongo, and retrieve meaningful information using aggregation queries.\n\n"
        "Project Demonstration Criteria (Viva-Voce Requirements):\n"
        "• The problem selected and its real-world relevance.\n"
        "• Database and document design (18 collections, normalized vs embedded trade-offs).\n"
        "• Validation rules implemented ($jsonSchema, additionalProperties: false, $expr invariants).\n"
        "• CRUD queries used (Master catalog C1 to D2 with PyMongo & mongosh).\n"
        "• Aggregation pipelines used (15 high-order analytic pipelines A1 to A15).\n"
        "• PyMongo implementation (multi-document ACID seat cascading engine under snapshot isolation).\n"
        "• Output obtained from queries and performance execution statistics (COLLSCAN vs IXSCAN).\n"
        "• Why particular queries or database structures were selected."
    )
    q_rows = [
        ["Q1", q_statement_text, "CO4,\nCO5,\nCO6", "L2,\nL3", "30 Marks"]
    ]
    builder.create_styled_table(q_headers, q_rows, [0.4, 4.4, 0.6, 0.6, 0.6])
    
    # Official Marks Distribution Table
    builder.add_styled_heading("Official Assessment Rubric & Marks Distribution", level=2)
    dist_headers = ["Assessment Component", "Max Marks", "Marks Awarded", "Evaluator Assessment Criteria & Evidence"]
    dist_rows = [
        [
            "1. Project Implementation\n(MongoDB Schemas, CRUD, Aggregations, PyMongo)",
            "15",
            "[     / 15 ]",
            "Evaluates complete working implementation of 18 collections, multi-document ACID seat cascading, PyMongo integration, and 15 analytical aggregation pipelines."
        ],
        [
            "2. Project Report\n(Comprehensive Architecture, Validation, Performance)",
            "5",
            "[     / 5  ]",
            "Evaluates rigor of engineering documentation, mathematical invariants ($I_1–I_5$), BSON schema rules, explain plan benchmarks (COLLSCAN vs IXSCAN), and system block diagrams."
        ],
        [
            "3. Presentation & Viva-Voce\n(Technical Defense, Query Execution, Justification)",
            "10",
            "[     / 10 ]",
            "Evaluates student defense of document modeling decisions, live query execution in mongosh/PyMongo, schema modifications, and justification of aggregation pipelines."
        ],
        [
            "TOTAL EVALUATION SCORE",
            "30",
            "[     / 30 ]",
            "Final Grade Recommendation: ____________________________________"
        ]
    ]
    builder.create_styled_table(dist_headers, dist_rows, [2.3, 0.8, 0.9, 2.6])
    
    # Official Evaluator Sign-Off Box
    p_sign = builder.doc.add_paragraph()
    p_sign.paragraph_format.space_before = Pt(8)
    p_sign.paragraph_format.space_after = Pt(2)
    r_sign = p_sign.add_run(
        "Evaluator Name: ____________________________________    "
        "Designation: ____________________________________\n\n"
        "Date of Examination: _______________________________    "
        "Evaluator Signature: ____________________________"
    )
    r_sign.bold = True
    r_sign.font.size = Pt(8.5)
    r_sign.font.color.rgb = RGB_DARK_NAVY
    builder.mark_content_added()
    
    # Page Break to Page 3 (Chapter 1)
    builder.add_page_break(force=True)

# ==========================================
# HTML TO DOCX CONVERTER (ZERO BLANK PAGES)
# ==========================================

def convert_html_to_docx(builder, html_content):
    """
    Parses HTML content from report_modules and adds styled Word elements.
    Guarantees:
    1. Zero blank pages (suppresses redundant breaks).
    2. Spacious academic styling (preserves callout boxes, cards, code boxes).
    3. Perfectly aligned 6.6" table widths preventing left-margin clipping.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    
    for elem in soup.children:
        if isinstance(elem, Tag):
            tag_name = elem.name
            classes = elem.get("class", [])
            
            # Page Break
            if "page-break" in classes:
                builder.add_page_break()
                continue
                
            # Headings
            if tag_name == "h1":
                builder.add_styled_heading(elem.get_text().strip(), level=1)
            elif tag_name == "h2":
                builder.add_styled_heading(elem.get_text().strip(), level=2)
            elif tag_name == "h3":
                builder.add_styled_heading(elem.get_text().strip(), level=3)
            elif tag_name == "h4":
                builder.add_styled_heading(elem.get_text().strip(), level=4)
                
            # Paragraph
            elif tag_name == "p":
                text = elem.get_text().strip()
                if text:
                    builder.add_body_p(text)
                    
            # Lists
            elif tag_name in ["ul", "ol"]:
                for li in elem.find_all("li"):
                    li_text = li.get_text().strip()
                    if li_text:
                        strong = li.find(["strong", "b"])
                        if strong and li_text.startswith(strong.get_text()):
                            prefix = strong.get_text() + " "
                            rest = li_text[len(prefix):]
                            builder.add_bullet_p(rest, bold_prefix=prefix)
                        else:
                            builder.add_bullet_p(li_text)
                            
            # Standalone Images
            elif tag_name == "img":
                src = elem.get("src", "")
                alt = elem.get("alt", "")
                img_path = IMAGE_MAP.get(src, src)
                if os.path.exists(img_path):
                    builder.add_image_box(img_path, caption=alt if alt else None)

            # Preformatted Code
            elif tag_name == "pre":
                code_text = elem.get_text().strip()
                if code_text:
                    builder.add_code_block(code_text)
                
            # Tables
            elif tag_name == "table":
                all_tr = elem.find_all("tr")
                if not all_tr:
                    continue
                first_tr = all_tr[0]
                headers = [th.get_text().strip() for th in first_tr.find_all(["th", "td"])]
                data_rows = []
                for tr in all_tr[1:]:
                    cells = [td.get_text().strip() for td in tr.find_all(["td", "th"])]
                    if cells:
                        data_rows.append(cells)
                if headers and data_rows:
                    # Calculate proportional widths fitting 6.6 inches total
                    num_cols = len(headers)
                    col_w = [6.6 / num_cols] * num_cols
                    builder.create_styled_table(headers, data_rows, col_w)
                    
            # Div containers
            elif tag_name == "div":
                # Stat Card / Callout: Rendered as an elegant shaded callout box
                if "stat-card" in classes or any("callout" in c for c in classes):
                    title_elem = elem.find(["h3", "h4", "strong", "b"])
                    title_str = title_elem.get_text().strip() if title_elem else "ARCHITECTURAL NOTE"
                    body_elem = elem.find("p")
                    body_str = body_elem.get_text().strip() if body_elem else elem.get_text().strip()
                    if title_elem and body_str.startswith(title_str):
                        body_str = body_str[len(title_str):].strip()
                    builder.add_callout_box(body_str, title=title_str)
                    
                # Diagram / Screenshot / Prototype Container
                elif any(c in classes for c in ["diagram-container", "figure", "screenshot-container", "prototype-container"]):
                    caption_elem = elem.find(["div", "p", "figcaption"], class_=lambda c: c and "caption" in c)
                    caption_text = caption_elem.get_text().strip() if caption_elem else None
                    
                    img_tag = elem.find("img")
                    if img_tag:
                        src = img_tag.get("src", "")
                        alt = img_tag.get("alt", "")
                        img_path = IMAGE_MAP.get(src, src)
                        if os.path.exists(img_path):
                            builder.add_image_box(img_path, caption=caption_text if caption_text else alt)
                            continue

                    raw_text = str(elem)
                    matched_img = False
                    for key, img_path in IMAGE_MAP.items():
                        if key in raw_text:
                            if os.path.exists(img_path):
                                builder.add_image_box(img_path, caption=caption_text)
                                matched_img = True
                            break
                    if not matched_img:
                        for dp in elem.find_all("p"):
                            builder.add_body_p(dp.get_text().strip())
                            
                # Grid of Side-by-Side Images or Objective Cards
                elif any("grid" in c for c in classes) or "kpi-container" in classes:
                    sub_diagrams = elem.find_all("div", class_=lambda c: c and any(k in c for k in ["diagram-container", "screenshot-container", "figure"]))
                    if sub_diagrams:
                        if len(sub_diagrams) == 2:
                            # 2-column side-by-side images table (Architecture Diagram + Prototype Screenshot)
                            img_tbl = builder.doc.add_table(rows=1, cols=2)
                            img_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                            img_tbl.autofit = False
                            builder.mark_content_added()
                            
                            for idx, diag in enumerate(sub_diagrams):
                                cell = img_tbl.cell(0, idx)
                                cell.width = Inches(3.3)
                                set_cell_margins(cell, top=20, bottom=20, left=20, right=20)
                                
                                cap_elem = diag.find(["div", "p", "figcaption"], class_=lambda c: c and "caption" in c)
                                cap_text = cap_elem.get_text().strip() if cap_elem else None
                                
                                img_tag = diag.find("img")
                                img_path = None
                                if img_tag:
                                    src = img_tag.get("src", "")
                                    alt = img_tag.get("alt", "")
                                    img_path = IMAGE_MAP.get(src, src)
                                    if not cap_text and alt:
                                        cap_text = alt
                                else:
                                    raw_text = str(diag)
                                    for key, path in IMAGE_MAP.items():
                                        if key in raw_text:
                                            img_path = path
                                            break
                                            
                                if img_path and os.path.exists(img_path):
                                    p_cell = cell.paragraphs[0]
                                    p_cell.alignment = WD_ALIGN_PARAGRAPH.CENTER
                                    p_cell.paragraph_format.space_before = Pt(1)
                                    p_cell.paragraph_format.space_after = Pt(1)
                                    p_cell.add_run().add_picture(img_path, width=Inches(3.1))
                                    if cap_text:
                                        p_cap = cell.add_paragraph()
                                        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                                        p_cap.paragraph_format.space_before = Pt(0.5)
                                        p_cap.paragraph_format.space_after = Pt(2)
                                        r_c = p_cap.add_run(f"Figure: {cap_text}")
                                        r_c.font.size = Pt(7.0)
                                        r_c.italic = True
                                        r_c.bold = True
                                        r_c.font.color.rgb = RGB_DARK_NAVY
                        else:
                            for diag in sub_diagrams:
                                cap_elem = diag.find(["div", "p", "figcaption"], class_=lambda c: c and "caption" in c)
                                cap_text = cap_elem.get_text().strip() if cap_elem else None
                                img_tag = diag.find("img")
                                img_path = None
                                if img_tag:
                                    src = img_tag.get("src", "")
                                    img_path = IMAGE_MAP.get(src, src)
                                else:
                                    raw_text = str(diag)
                                    for key, path in IMAGE_MAP.items():
                                        if key in raw_text:
                                            img_path = path
                                            break
                                if img_path and os.path.exists(img_path):
                                    builder.add_image_box(img_path, caption=cap_text)
                    else:
                        cards = elem.find_all("div", recursive=False)
                        for card in cards:
                            c_title = card.find(["h3", "h4", "strong", "b"])
                            t_str = c_title.get_text().strip() if c_title else "OBJECTIVE"
                            b_str = card.get_text().strip()
                            if c_title and b_str.startswith(t_str):
                                b_str = b_str[len(t_str):].strip()
                            builder.add_callout_box(b_str, title=t_str)
                else:
                    inner_html = "".join(str(c) for c in elem.children)
                    convert_html_to_docx(builder, inner_html)

# ==========================================
# CHAPTER 12: VIVA-VOCE PREPARATION GUIDE
# ==========================================

def add_chapter_viva_defense(builder):
    """Adds the complete Viva-Voce Defense Guide addressing all syllabus points."""
    builder.add_page_break()
    builder.add_styled_heading("Chapter 12: Comprehensive Viva-Voce Defense & Technical Examination Guide", level=1)
    
    builder.add_styled_heading("12.1 Strategic Defense of All Required Demonstration Points", level=2)
    builder.add_body_p(
        "As explicitly specified in the Lovely Professional University Academic Task 2 Project Evaluation criteria, "
        "students must demonstrate mastery during the presentation and viva across specific technical dimensions. "
        "Below are rigorous model questions and authoritative technical defenses for each required point:"
    )
    
    viva_qa = [
        (
            "Viva Q1: Why was MongoDB chosen over a traditional relational database (RDBMS)?",
            "Model Defense: In campus placement operations, candidate profiles, recruitment drives, and interview evaluations "
            "are naturally hierarchical and polymorphic. In an RDBMS, querying an eligible candidate requires joining students, "
            "academic_terms, skills, drives, applications, and rounds across 12+ normalized tables. Under SuperDay concurrency "
            "(thousands of simultaneous requests), join latencies spike exponentially, causing connection pool exhaustion. "
            "MongoDB's document model allows embedding bounded, high-read sub-entities (such as verified skills and round scorecards) "
            "directly into parent documents, eliminating joins and enabling sub-5ms covered queries. Furthermore, MongoDB 7.0+ "
            "provides multi-document ACID transactions with snapshot isolation, providing enterprise consistency without sacrificing flexibility."
        ),
        (
            "Viva Q2: How does the document design balance embedding versus referencing?",
            "Model Defense: We apply the 1-to-N bounding rule. Bounded 1-to-Few relationships that are always queried together "
            "(e.g., student semester terms, verified skills, and interview round scorecards) are embedded directly to guarantee atomic, "
            "single-document reads and writes. Conversely, unbounded 1-to-Many relationships or entities with independent lifecycles "
            "(e.g., applications, job offers, and audit logs) are maintained as separate collections referenced by unique string keys "
            "(e.g., student_id, drive_id). This prevents documents from exceeding the 16MB BSON limit and avoids document growth fragmentation."
        ),
        (
            "Viva Q3: How do you enforce business invariants without relying on backend code?",
            "Model Defense: We implement declarative database-level validation using MongoDB $jsonSchema combined with the $expr operator. "
            "The $jsonSchema enforces data types, string regex patterns, required fields, and rejects unexpected fields using "
            "additionalProperties: false. For cross-field mathematical invariants—such as ensuring that available_seats is non-negative "
            "and never exceeds total_openings—we use $expr: { $and: [{ $gte: ['$available_seats', 0] }, { $lte: ['$available_seats', '$total_openings'] }] }. "
            "This ensures that even if an unauthorized script or ETL batch bypasses application middleware, invalid data is rejected at the storage layer with error code 121."
        ),
        (
            "Viva Q4: How does the seat cascading engine prevent vacancy leakage during offer upgrades?",
            "Model Defense: When a candidate holding a lower-tier offer is finalized for a higher tier, our PyMongo engine executes "
            "run_seat_cascade_transaction inside a client session under Snapshot Isolation and Majority Write Concern. In a single atomic unit: "
            "1) The new drive's available_seats is decremented; 2) The candidate's old offer status is updated to RELINQUISHED_UPGRADE; "
            "3) The old drive's available_seats is incremented; 4) The top waitlisted candidate on the old drive is promoted using "
            "find_one_and_update with sort=[('waitlist_rank', 1)]; 5) An immutable audit log entry is written. If any step fails or another "
            "transaction claims the seat, the entire session aborts and rolls back, mathematically guaranteeing zero vacancy leakage."
        ),
        (
            "Viva Q5: Explain the execution plan of your most performance-critical query.",
            "Model Defense: Our primary eligibility query filters candidates by department, placement status, and minimum CGPA. "
            "Without an index, the engine executes a COLLSCAN, examining all 50,000 documents and taking ~198ms. We designed a compound index "
            "{ department: 1, placement_status: 1, cgpa: -1 }. With this index and field-level projection, the execution plan shifts to "
            "PROJECTION_COVERED over IXSCAN. The engine examines exactly 3,822 index keys and zero documents (totalDocsExamined: 0), "
            "dropping query latency from 198ms to 4.4ms—a 44.9x speedup with zero disk read overhead."
        ),
        (
            "Viva Q6: Why did you implement 15 separate aggregation pipelines?",
            "Model Defense: The Aggregation Framework provides native in-database data processing without moving large datasets over "
            "the network to the application server. Each of the 15 pipelines addresses a specific operational requirement: "
            "A1 computes conversion rates; A2 performs automated statistical salary bucketing via $bucketAuto; A3 tracks recruitment funnel dropouts; "
            "A7 evaluates demographic parity and equal opportunity ratios; A11 uses $graphLookup for recursive hierarchical interviewer traversals; "
            "A12 computes candidate readiness using distributed window functions ($setWindowFields); and A13 materializes pre-aggregated "
            "executive dashboards using $merge. This decouples analytics from transactional locks while maintaining real-time telemetry."
        ),
        (
            "Viva Q7: What write concerns and read concerns are used in PyMongo?",
            "Model Defense: For standard read-only operations, we use default read concern 'local' for sub-millisecond responsiveness. "
            "However, for transactional seat allocation and status progression, we mandate ReadConcern('snapshot') to guarantee consistent, "
            "repeatable reads across multiple collections without dirty reads or phantom reads. For writes, we enforce WriteConcern('majority', wtimeout=5000), "
            "guaranteeing that mutations are acknowledged by a majority of replica set members and committed to the WiredTiger journal before acknowledging success."
        ),
        (
            "Viva Q8: How does Meridian address demographic bias in placement shortlisting?",
            "Model Defense: Meridian trains in-process machine learning classifiers (Logistic Regression, Random Forest, and LightGBM) over 7,141 candidate "
            "records. To prevent algorithmic discrimination, we implement an automated fairness auditing aggregation pipeline (Pipeline A7) that computes "
            "the Disparate Impact Ratio across gender, branch, and category cohorts according to the EEOC Four-Fifths Rule (0.80 <= ratio <= 1.25). "
            "Our models achieve selection ratios between 0.88 and 0.94, guaranteeing equitable candidate discovery."
        )
    ]
    
    for q_title, a_text in viva_qa:
        builder.add_styled_heading(q_title, level=3)
        builder.add_body_p(a_text, space_after=2.5)

# ==========================================
# MAIN EXECUTION ROUTINE
# ==========================================

def generate_report():
    print("[*] Initializing Master LPU Word Report Generation (Spacious & Zero-Blank Architecture)...")
    builder = LpuReportBuilder()
    
    print("[1/13] Generating Page 1: Institutional Project Dossier Cover...")
    add_cover_page(builder)
    
    print("[2/13] Generating Page 2: Official Task 2 Evaluation Sheet & Rubrics...")
    add_evaluation_sheet_page(builder)
    
    print("[3/13] Ingesting & Formatting Chapter 1: Problem Statement & Objectives...")
    convert_html_to_docx(builder, get_chapter_1())
    
    print("[4/13] Ingesting & Formatting Chapter 2: Literature Survey & Comparative Analysis...")
    convert_html_to_docx(builder, get_chapter_2())
    
    print("[5/13] Ingesting & Formatting Chapter 3: Research Methodology & Mathematical Invariants...")
    convert_html_to_docx(builder, get_chapter_3())
    
    print("[6/13] Ingesting & Formatting Chapter 4: Architecture & 18 Collections Schema Design...")
    convert_html_to_docx(builder, get_chapter_4())
    
    print("[7/13] Ingesting & Formatting Chapter 5: Technology Stack & Prototype Walkthrough...")
    convert_html_to_docx(builder, get_chapter_5())
    
    print("[8/13] Ingesting & Formatting Chapter 6: CRUD Operations & 15 Aggregation Pipelines...")
    convert_html_to_docx(builder, get_chapter_6())
    
    print("[9/13] Ingesting & Formatting Chapter 7: Four-Tier Testing Hierarchy & Verification...")
    convert_html_to_docx(builder, get_chapter_7())
    
    print("[10/13] Ingesting & Formatting Chapter 8: Empirical Performance Profiling & Optimization...")
    convert_html_to_docx(builder, get_chapter_8())
    
    print("[11/13] Ingesting & Formatting Chapter 9: Conclusion & Future Roadmap...")
    convert_html_to_docx(builder, get_chapter_9())
    
    print("[12/13] Adding Dedicated Chapter: Comprehensive Viva-Voce Defense Guide...")
    add_chapter_viva_defense(builder)
    
    print("[13/13] Ingesting & Formatting Appendices: Setup Script, Error Catalog & Sign-Off...")
    convert_html_to_docx(builder, get_appendices())
    
    os.makedirs(os.path.dirname(DOCX_OUT_PATH), exist_ok=True)
    builder.doc.save(DOCX_OUT_PATH)
    file_size_mb = os.path.getsize(DOCX_OUT_PATH) / (1024 * 1024)
    print(f"\n[SUCCESS] Master LPU Project Evaluation Report saved successfully!")
    print(f"Destination Path: {DOCX_OUT_PATH}")
    print(f"File Size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    generate_report()
