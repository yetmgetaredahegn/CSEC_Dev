import chromadb
from django.conf import settings
from llama_index.core import StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore


def get_chroma_collection():
    client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    return client.get_or_create_collection("website_docs")


def get_vector_store():
    collection = get_chroma_collection()
    return ChromaVectorStore(chroma_collection=collection)


def get_storage_context():
    vector_store = get_vector_store()
    return StorageContext.from_defaults(vector_store=vector_store)
