from typing import Any

import pytest
from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, ToolMessage

from agent_service import retrieval
from agent_service.config import Settings
from agent_service.retrieval import (
    TimedGoogleEmbeddings,
    build_search_query,
    format_context,
    make_pinecone_search,
)


def test_first_turn_uses_message_alone() -> None:
    assert build_search_query([], "hi") == "hi"


def test_later_turn_prepends_previous_user_message() -> None:
    history: list[AnyMessage] = [
        HumanMessage("what at Acme?"),
        AIMessage("..."),
        ToolMessage("chunk", tool_call_id="1"),
    ]
    assert build_search_query(history, "tell me more") == "what at Acme?\ntell me more"


def test_later_turn_uses_the_latest_previous_user_message() -> None:
    history: list[AnyMessage] = [
        HumanMessage("first"),
        AIMessage("a"),
        HumanMessage("second"),
        AIMessage("b"),
    ]
    assert build_search_query(history, "and?") == "second\nand?"


def test_format_context_joins_with_separator() -> None:
    assert format_context(["a", "b"]) == "a\n\n---\n\nb"


def test_format_context_empty() -> None:
    assert format_context([]) == ""


class FakeStore:
    constructed = 0

    def __init__(self, **kwargs: Any) -> None:
        FakeStore.constructed += 1

    def similarity_search(self, query: str, k: int) -> list[Any]:
        return []


def test_pinecone_store_is_built_on_first_search_not_at_startup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "g")
    monkeypatch.setenv("PINECONE_API_KEY", "p")
    monkeypatch.setattr(retrieval, "PineconeVectorStore", FakeStore)
    FakeStore.constructed = 0

    search = make_pinecone_search(Settings(_env_file=None))
    assert FakeStore.constructed == 0

    search("one")
    search("two")
    assert FakeStore.constructed == 1


def test_embedding_requests_carry_a_timeout() -> None:
    embeddings = TimedGoogleEmbeddings(model="models/gemini-embedding-2", google_api_key="g")
    config = embeddings._build_config()
    assert config.http_options is not None
    assert config.http_options.timeout == 5000
