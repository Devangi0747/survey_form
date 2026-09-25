from pathlib import Path


def extract_text(path: str) -> str:
    extension = Path(path).suffix.lower()
    if extension == ".txt":
        return Path(path).read_text(encoding="utf-8", errors="ignore")
    if extension == ".pdf":
        from pypdf import PdfReader
        return "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    if extension == ".docx":
        from docx import Document
        return "\n".join(paragraph.text for paragraph in Document(path).paragraphs)
    raise ValueError("Only PDF, DOCX, and TXT files are supported by the parser")
