# from io import BytesIO

# from pypdf import PdfReader


# def extract_pdf_text(pdf_bytes: bytes) -> list[tuple[int, str]]:
#     reader = PdfReader(BytesIO(pdf_bytes))
#     pages: list[tuple[int, str]] = []
#     for idx, page in enumerate(reader.pages, start=1):
#         text = page.extract_text() or ""
#         if text.strip():
#             pages.append((idx, text))
#     return pages

from io import BytesIO
from pathlib import Path
from typing import List, Tuple

import fitz  # PyMuPDF
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image


def extract_text_from_file(
    file_bytes: bytes,
    filename: str,
    content_type: str | None,
) -> List[Tuple[int | None, str]]:
    """
    Universal extractor:
    - Text PDF
    - Scanned PDF
    - Image files
    """

    name = filename.lower()
    ctype = (content_type or "").lower()

    # ---------- IMAGE FILE ----------
    if name.endswith((".png", ".jpg", ".jpeg", ".webp")):
        img = Image.open(BytesIO(file_bytes))
        text = pytesseract.image_to_string(img, lang="eng+hin")
        return [(None, text)]

    # ---------- PDF ----------
    if name.endswith(".pdf") or ctype == "application/pdf":
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages: List[Tuple[int, str]] = []

        for i, page in enumerate(doc):
            text = page.get_text().strip()
            # print(f"[DEBUG] Page {i+1} text length (direct):", len(text))

            # TEXT PDF
            if text:
                pages.append((i + 1, text))
                continue

            # SCANNED PDF - OCR
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text = pytesseract.image_to_string(img, lang="eng+hin")
            # print(f"[DEBUG] Page {i+1} OCR text length:", len(ocr_text))
            pages.append((i + 1, ocr_text))

        return pages

    return []


def extract_text_from_path(
    file_path: str,
    content_type: str | None = None,
) -> List[Tuple[int | None, str]]:
    """
    Extract text from a file path without loading everything into memory.
    Supports PDF and common image formats.
    """
    path = Path(file_path)
    name = path.name.lower()
    ctype = (content_type or "").lower()

    # ---------- IMAGE FILE ----------
    if name.endswith((".png", ".jpg", ".jpeg", ".webp")):
        img = Image.open(path)
        text = pytesseract.image_to_string(img, lang="eng+hin")
        return [(None, text)]

    # ---------- PDF ----------
    if name.endswith(".pdf") or ctype == "application/pdf":
        doc = fitz.open(file_path)
        pages: List[Tuple[int, str]] = []

        for i, page in enumerate(doc):
            text = page.get_text().strip()
            if text:
                pages.append((i + 1, text))
                continue

            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text = pytesseract.image_to_string(img, lang="eng+hin")
            pages.append((i + 1, ocr_text))

        return pages

    return []
