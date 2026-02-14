from celery import shared_task
from django.conf import settings
from pypdf import PdfReader

from documents.models import Document
from rag.indexing import ingest_text


@shared_task
def process_pdf(document_id):
    document = Document.objects.get(id=document_id)
    reader = PdfReader(document.file.path)

    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text_parts.append(page_text)

    text = "\n".join(text_parts).strip()
    if not text:
        document.processed = False
        document.save(update_fields=["processed"])
        return

    success = ingest_text(
        text,
        metadata={
            "document_id": str(document.id),
            "title": document.title,
        },
    )

    document.processed = success
    document.save(update_fields=["processed"])
