from django.conf import settings
from llama_index.core import Settings, VectorStoreIndex
from llama_index.embeddings.openai import OpenAIEmbedding

from rag.store import get_vector_store


def retrieve_context(query, top_k=5):
    if not settings.OPENAI_API_KEY:
        return []

    Settings.embed_model = OpenAIEmbedding(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_EMBED_MODEL,
    )
    vector_store = get_vector_store()
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    retriever = index.as_retriever(similarity_top_k=top_k)
    results = retriever.retrieve(query)
    return [node.get_content() for node in results]
