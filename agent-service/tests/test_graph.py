from collections.abc import Iterator

import pytest
from fakes import RecordingSearch, fake_model, tool_call
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver

from agent_service.graph import build_graph, reply_from
from agent_service.types import Graph


def make_graph(
    model: BaseChatModel, search: RecordingSearch, prompt: str = "CTX: {context}"
) -> Graph:
    return build_graph(model, search, prompt, InMemorySaver())


async def ask(graph: Graph, text: str, thread: str = "t") -> str:
    state = await graph.ainvoke(
        {"messages": [HumanMessage(text)], "name": None},
        config={"configurable": {"thread_id": thread}},
    )
    return reply_from(state)


async def test_step_cap() -> None:
    def script() -> Iterator[AIMessage]:
        i = 0
        while True:
            i += 1
            yield AIMessage("answer", tool_calls=[tool_call(f"c{i}")])

    model = fake_model(script())
    search = RecordingSearch(["a"])
    reply = await ask(make_graph(model, search), "hi")
    assert [bound for bound, _ in model.calls] == [True, False]
    assert reply == "answer"
    assert len(search.queries) == 2


async def test_only_first_tool_call_runs() -> None:
    script = iter([AIMessage("", tool_calls=[tool_call("c1"), tool_call("c2")]), AIMessage("done")])
    search = RecordingSearch(["a"])
    graph = make_graph(fake_model(script), search)
    reply = await ask(graph, "hi")
    assert len(search.queries) == 2
    assert reply == "done"

    saved = (await graph.aget_state({"configurable": {"thread_id": "t"}})).values["messages"]
    requested = [m for m in saved if isinstance(m, AIMessage) and m.tool_calls]
    assert [len(m.tool_calls) for m in requested] == [1]


async def test_retrieve_puts_context_in_system_prompt() -> None:
    model = fake_model(iter([AIMessage("ok")]))
    await ask(make_graph(model, RecordingSearch(["a"])), "hi")
    system = model.calls[0][1][0]
    assert isinstance(system, SystemMessage)
    assert system.content == "CTX: a"


async def test_prompt_braces_other_than_context_are_kept() -> None:
    model = fake_model(iter([AIMessage("ok")]))
    await ask(make_graph(model, RecordingSearch(["a"]), '{"k": 1} {context}'), "hi")
    assert model.calls[0][1][0].content == '{"k": 1} a'


async def test_empty_search_still_answers() -> None:
    model = fake_model(iter([AIMessage("ok")]))
    reply = await ask(make_graph(model, RecordingSearch([])), "hi")
    assert reply == "ok"
    assert model.calls[0][1][0].content == "CTX: "


async def test_history_trimmed_to_user_and_final_replies() -> None:
    script = [AIMessage(f"r{n}") for n in range(1, 5)]
    script += [AIMessage("", tool_calls=[tool_call("c5")]), AIMessage("r5")]
    script += [AIMessage("r6"), AIMessage("r7")]
    model = fake_model(iter(script))
    graph = make_graph(model, RecordingSearch(["a"]))
    for n in range(1, 8):
        await ask(graph, f"q{n}")

    sent = model.calls[-1][1]
    assert [m.content for m in sent[1:]] == [
        "q2", "r2", "q3", "r3", "q4", "r4", "q5", "r5", "q6", "r6", "q7",
    ]  # fmt: skip
    assert not any(isinstance(m, ToolMessage) for m in sent)
    assert not any(isinstance(m, AIMessage) and m.tool_calls for m in sent)


async def test_second_turn_query_includes_previous_question() -> None:
    search = RecordingSearch(["a"])
    graph = make_graph(fake_model(iter([AIMessage("1"), AIMessage("2")])), search)
    await ask(graph, "first")
    await ask(graph, "second")
    assert search.queries == ["first", "first\nsecond"]


async def test_second_turn_can_search_after_first_used_tool() -> None:
    script = iter(
        [
            AIMessage("", tool_calls=[tool_call("c1")]),
            AIMessage("r1"),
            AIMessage("", tool_calls=[tool_call("c2")]),
            AIMessage("r2"),
        ]
    )
    model = fake_model(script)
    graph = make_graph(model, RecordingSearch(["a"]))
    await ask(graph, "first")
    await ask(graph, "second")
    assert [bound for bound, _ in model.calls] == [True, False, True, False]


def test_prompt_without_context_placeholder_is_rejected() -> None:
    with pytest.raises(ValueError):
        make_graph(fake_model(iter([])), RecordingSearch([]), "no placeholder")
