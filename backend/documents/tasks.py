from celery import shared_task
from django.conf import settings
from llama_index.core import Document as LlamaDocument, Settings, VectorStoreIndex
from llama_index.embeddings.openai import OpenAIEmbedding
from pypdf import PdfReader

from documents.models import Document
from rag.store import get_storage_context


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

    if not settings.OPENAI_API_KEY:
        document.processed = False
        document.save(update_fields=["processed"])
        return

    Settings.embed_model = OpenAIEmbedding(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_EMBED_MODEL,
    )

    llama_doc = LlamaDocument(
        text=text,
        metadata={
            "document_id": str(document.id),
            "title": document.title,
        },
    )

    storage_context = get_storage_context()
    VectorStoreIndex.from_documents([llama_doc], storage_context=storage_context)

    document.processed = True
    document.save(update_fields=["processed"])
