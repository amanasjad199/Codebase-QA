import pytest

from app.parsers.text_parser import parse_markdown, parse_text


def test_text_parser_extracts_text():
    text = parse_text(b"Hello world")
    assert text == "Hello world"


def test_text_parser_handles_unicode():
    text = parse_text("héllo wörld".encode("utf-8"))
    assert "héllo" in text


def test_markdown_parser_extracts_text():
    text = parse_markdown(b"# Title\n\nContent")
    assert "# Title" in text
    assert "Content" in text
