import logging

import fitz

logger = logging.getLogger(__name__)


def parse_pdf(file_bytes: bytes) -> str:
    if not file_bytes:
        raise ValueError("Empty PDF file")
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text())
    doc.close()
    return "\n\n".join(pages)
