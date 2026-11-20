"""Search query building, context formatting, and the Pinecone search adapter."""

from collections.abc import Callable

from langchain_core.messages import AnyMessage, HumanMessage
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore

from agent_service.config import Settings
from agent_service.constants import (
    CONTEXT_SEPARATOR,
    EMBEDDING_MODEL,
    PINECONE_INDEX,
    PINECONE_NAMESPACE,
    TOP_K,
)

SearchFn = Callable[[str], list[str]]


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
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL, google_api_key=settings.google_api_key.get_secret_value()
    )
    store = PineconeVectorStore(
        index_name=PINECONE_INDEX,
        embedding=embeddings,
        namespace=PINECONE_NAMESPACE,
        pinecone_api_key=settings.pinecone_api_key.get_secret_value(),
    )

    def search(query: str) -> list[str]:
        return [doc.page_content for doc in store.similarity_search(query, k=TOP_K)]

    return search
