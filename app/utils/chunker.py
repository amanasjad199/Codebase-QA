import logging

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[dict]:
    if not text:
        return []
    separators = ["\n\n", "\n", ". ", " ", ""]
    chunks = []
    start = 0
    index = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        if end < len(text):
            best = -1
            for sep in separators:
                pos = text.rfind(sep, start + max(chunk_size - overlap, 0), end)
                if pos > best:
                    best = pos
            if best > 0:
                end = best + (1 if separators.index(sep) <= 2 else 0)
        chunk_text_content = text[start:end].strip()
        if chunk_text_content:
            chunks.append({"text": chunk_text_content, "chunk_index": index})
            index += 1
        start = end - overlap if end < len(text) else len(text)
        if start < 0:
            start = 0
    return chunks
