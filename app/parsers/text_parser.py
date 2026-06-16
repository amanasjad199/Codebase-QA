def parse_text(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")


def parse_markdown(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")
