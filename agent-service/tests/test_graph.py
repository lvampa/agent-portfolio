from collections.abc import Iterator

from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver

from agent_service.constants import TOOL_NAME
from agent_service.graph import build_graph, reply_from


class FakeChat(GenericFakeChatModel):
    """Records every model call as (tools_bound, messages)."""

    calls: list = []
    tools_bound: bool = False

    def bind_tools(self, tools, **kwargs):
        return self.model_copy(update={"tools_bound": True})

    def _generate(self, messages, *args, **kwargs):
        self.calls.append((self.tools_bound, list(messages)))
        return super()._generate(messages, *args, **kwargs)


def tool_call(call_id: str) -> dict:
    return {"name": TOOL_NAME, "args": {"query": "more"}, "id": call_id}


def fake_model(script: Iterator[AIMessage]) -> FakeChat:
    return FakeChat(messages=script, calls=[])


class RecordingSearch:
    def __init__(self, chunks: list[str]):
        self.chunks = chunks
        self.queries: list[str] = []

    def __call__(self, query: str) -> list[str]:
        self.queries.append(query)
        return self.chunks


def make_graph(model, search, prompt="CTX: {context}"):
    return build_graph(model, search, prompt, InMemorySaver())


async def ask(graph, text: str, thread: str = "t"):
    state = await graph.ainvoke(
        {"messages": [HumanMessage(text)], "name": None, "tool_rounds": 0},
        config={"configurable": {"thread_id": thread}},
    )
    return reply_from(state)


async def test_step_cap():
    def script():
        i = 0
        while True:
            i += 1
            yield AIMessage("answer", tool_calls=[tool_call(f"c{i}")])

    model = fake_model(script())
    reply = await ask(make_graph(model, RecordingSearch(["a"])), "hi")
    assert [bound for bound, _ in model.calls] == [True, False]
    assert reply == "answer"


async def test_only_first_tool_call_runs():
    script = iter([AIMessage("", tool_calls=[tool_call("c1"), tool_call("c2")]), AIMessage("done")])
    search = RecordingSearch(["a"])
    graph = make_graph(fake_model(script), search)
    reply = await ask(graph, "hi")
    assert len(search.queries) == 2
    assert reply == "done"

    saved = (await graph.aget_state({"configurable": {"thread_id": "t"}})).values["messages"]
    requested = [m for m in saved if isinstance(m, AIMessage) and m.tool_calls]
    assert [len(m.tool_calls) for m in requested] == [1]


async def test_retrieve_puts_context_in_system_prompt():
    model = fake_model(iter([AIMessage("ok")]))
    await ask(make_graph(model, RecordingSearch(["a"])), "hi")
    system = model.calls[0][1][0]
    assert isinstance(system, SystemMessage)
    assert system.content == "CTX: a"


async def test_prompt_braces_other_than_context_are_kept():
    model = fake_model(iter([AIMessage("ok")]))
    await ask(make_graph(model, RecordingSearch(["a"]), '{"k": 1} {context}'), "hi")
    assert model.calls[0][1][0].content == '{"k": 1} a'


async def test_empty_search_still_answers():
    model = fake_model(iter([AIMessage("ok")]))
    reply = await ask(make_graph(model, RecordingSearch([])), "hi")
    assert reply == "ok"
    assert model.calls[0][1][0].content == "CTX: "


async def test_history_trimmed_to_user_and_final_replies():
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


async def test_second_turn_query_includes_previous_question():
    search = RecordingSearch(["a"])
    graph = make_graph(fake_model(iter([AIMessage("1"), AIMessage("2")])), search)
    await ask(graph, "first")
    await ask(graph, "second")
    assert search.queries == ["first", "first\nsecond"]
