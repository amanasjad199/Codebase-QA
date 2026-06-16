from app.utils.chunker import chunk_text


def test_chunker_returns_list():
    chunks = chunk_text("word " * 500, chunk_size=100, overlap=20)
    assert isinstance(chunks, list)
    assert len(chunks) > 1


def test_chunker_respects_size():
    chunks = chunk_text("word " * 500, chunk_size=100, overlap=0)
    for chunk in chunks:
        assert len(chunk["text"]) <= 120


def test_chunk_index_sequential():
    chunks = chunk_text("word " * 500, chunk_size=100, overlap=0)
    indices = [c["chunk_index"] for c in chunks]
    assert indices == list(range(len(chunks)))


def test_chunker_empty_text():
    assert chunk_text("") == []


def test_chunker_short_text():
    chunks = chunk_text("Hello world", chunk_size=100, overlap=0)
    assert len(chunks) == 1
    assert chunks[0]["text"] == "Hello world"
