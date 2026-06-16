from app.utils.hashing import content_hash


def test_same_content_same_hash():
    assert content_hash(b"hello") == content_hash(b"hello")


def test_different_content_different_hash():
    assert content_hash(b"hello") != content_hash(b"world")


def test_hash_is_16_chars():
    assert len(content_hash(b"test")) == 16
