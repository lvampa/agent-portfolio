"""Search query building, context formatting, and the Pinecone search adapter."""

import threading
from collections.abc import Callable
from typing import Any

from google.genai.types import EmbedContentConfig, HttpOptions
from langchain_core.messages import AnyMessage, HumanMessage
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore

from agent_service.config import Settings
from agent_service.constants import (
    CONTEXT_SEPARATOR,
    EMBED_TIMEOUT_S,
    EMBEDDING_MODEL,
    PINECONE_INDEX,
    PINECONE_NAMESPACE,
    TOP_K,
)

SearchFn = Callable[[str], list[str]]


class TimedGoogleEmbeddings(GoogleGenerativeAIEmbeddings):
    """Adds a request timeout, which this library version does not expose.

    `request_options` is declared but never read, and a `timeout` in `client_args` is overridden by
    the SDK, so the timeout goes on each request's config instead.
    """

    def _build_config(self, *args: Any, **kwargs: Any) -> EmbedContentConfig:
        config = super()._build_config(*args, **kwargs)
        config.http_options = HttpOptions(timeout=int(EMBED_TIMEOUT_S * 1000))
        return config


def build_search_query(history: list[AnyMessage], new_message: str) -> str:
    """Follow-ups like "tell me more" only retrieve well with the earlier question attached."""
    previous_questions = [m for m in history if isinstance(m, HumanMessage)]
    if not previous_questions:
        return new_message
    return f"{previous_questions[-1].text}\n{new_message}"


def format_context(chunks: list[str]) -> str:
    return CONTEXT_SEPARATOR.join(chunks)


def make_pinecone_search(settings: Settings) -> SearchFn:
    """Returns a blocking search, so the graph runs it in a thread. Gives chunk texts only."""
    embeddings = TimedGoogleEmbeddings(
        model=EMBEDDING_MODEL, google_api_key=settings.google_api_key.get_secret_value()
    )
    store: PineconeVectorStore | None = None
    store_lock = threading.Lock()

    def get_store() -> PineconeVectorStore:
        # Building the store looks up the index host over the network, so it waits for the first
        # search and startup never depends on Pinecone being reachable.
        nonlocal store
        with store_lock:
            if store is None:
                store = PineconeVectorStore(
                    index_name=PINECONE_INDEX,
                    embedding=embeddings,
                    namespace=PINECONE_NAMESPACE,
                    pinecone_api_key=settings.pinecone_api_key.get_secret_value(),
                )
            return store

    def search(query: str) -> list[str]:
        return [doc.page_content for doc in get_store().similarity_search(query, k=TOP_K)]

    return search
