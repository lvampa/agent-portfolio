from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, ToolMessage

from agent_service.retrieval import build_search_query, format_context


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
