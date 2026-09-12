import os
import logging
from pypdf import PdfReader
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger("pdf-service")

class PDFService:
    def __init__(self, pdf_dir):
        self.pdf_dir = pdf_dir
        os.makedirs(self.pdf_dir, exist_ok=True)
        self.text_cache = {}

    def extract_text(self, pdf_filename):
        """
        Extracts text from PDF page by page.
        Returns a dictionary: {"full_text": str, "pages": [{"page_num": int, "text": str}]}
        """
        if pdf_filename in self.text_cache:
            return self.text_cache[pdf_filename]

        file_path = os.path.join(self.pdf_dir, pdf_filename)
        if not os.path.exists(file_path):
            return {"full_text": "", "pages": []}

        try:
            reader = PdfReader(file_path)
            pages = []
            full_text_list = []
            for idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                pages.append({"page_num": idx + 1, "text": txt.strip()})
                full_text_list.append(f"--- Page {idx + 1} ---\n{txt.strip()}")

            result = {
                "full_text": "\n\n".join(full_text_list),
                "pages": pages,
                "page_count": len(reader.pages)
            }
            self.text_cache[pdf_filename] = result
            return result
        except Exception as e:
            logger.error(f"Error extracting PDF text from {pdf_filename}: {e}")
            return {"full_text": "", "pages": [], "page_count": 0}

    def generate_sample_pdf(self, filename, title, subject, content_sections):
        """
        Generates a clean, academic, multi-page PDF textbook chapter using ReportLab.
        """
        filepath = os.path.join(self.pdf_dir, filename)
        if os.path.exists(filepath):
            return filepath

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ChapterTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E293B'),
            spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            'ChapterSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#475569'),
            spaceAfter=14
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=12,
            spaceAfter=6
        )
        h3_style = ParagraphStyle(
            'SectionH3',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#2563EB'),
            spaceBefore=8,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155'),
            spaceAfter=6
        )
        callout_style = ParagraphStyle(
            'Callout',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#1E3A8A'),
            spaceBefore=4,
            spaceAfter=4
        )

        elements = []

        # Header bar
        elements.append(Paragraph(f"<b>{subject.upper()}</b> • COMPREHENSIVE TEXTBOOK SERIES", subtitle_style))
        elements.append(Paragraph(title, title_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=14))

        for sec in content_sections:
            if "heading" in sec:
                elements.append(Paragraph(sec["heading"], h2_style))
            if "subheading" in sec:
                elements.append(Paragraph(sec["subheading"], h3_style))
            if "text" in sec:
                for paragraph in sec["text"].split("\n\n"):
                    if paragraph.strip():
                        elements.append(Paragraph(paragraph.strip(), body_style))
            if "formula_box" in sec:
                data = [[Paragraph(f"<b>Key Formula / Law:</b> {sec['formula_box']}", callout_style)]]
                t = Table(data, colWidths=[500])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#93C5FD')),
                    ('PADDING', (0,0), (-1,-1), 8),
                ]))
                elements.append(Spacer(1, 4))
                elements.append(t)
                elements.append(Spacer(1, 6))
            if "key_takeaways" in sec:
                elements.append(Paragraph("<b>Key Takeaways:</b>", h3_style))
                for pt in sec["key_takeaways"]:
                    elements.append(Paragraph(f"• {pt}", body_style))
                elements.append(Spacer(1, 4))

        doc.build(elements)
        logger.info(f"Generated sample chapter PDF: {filepath}")
        return filepath
