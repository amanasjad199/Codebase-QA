import pytest

from app.parsers.pdf_parser import parse_pdf


def test_pdf_parser_empty_raises():
    with pytest.raises(ValueError, match="Empty PDF file"):
        parse_pdf(b"")


def test_pdf_parser_invalid_raises():
    with pytest.raises(Exception):
        parse_pdf(b"not a pdf file content here")
