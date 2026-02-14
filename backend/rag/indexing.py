from django.conf import settings
from llama_index.core import Settings, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding

from rag.store import get_storage_context


def ingest_text(text, metadata=None, chunk_size=900, chunk_overlap=120):
    if not settings.OPENAI_API_KEY:
        return False

    Settings.embed_model = OpenAIEmbedding(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_EMBED_MODEL,
    )

    splitter = SentenceSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    nodes = splitter.get_nodes_from_documents([
        {
            "text": text,
            "metadata": metadata or {},
        }
    ])

    storage_context = get_storage_context()
    VectorStoreIndex.from_nodes(nodes, storage_context=storage_context)
    return True
