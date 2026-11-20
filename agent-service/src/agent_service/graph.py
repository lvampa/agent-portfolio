import asyncio
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import StructuredTool
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from agent_service.constants import (
    MAX_TOOL_ROUNDS,
    TOOL_DESCRIPTION,
    TOOL_NAME,
    TURN_WINDOW,
)
from agent_service.retrieval import SearchFn, build_search_query, format_context
from agent_service.types import ChatInput, ChatState


def reply_from(state: ChatState) -> str:
    last_ai = next(m for m in reversed(state["messages"]) if isinstance(m, AIMessage))
    return last_ai.text


def trim_history(messages: list[AnyMessage]) -> list[AnyMessage]:
    """Keeps the current turn whole, and earlier turns as the user message plus final reply."""
    current_start = max(i for i, m in enumerate(messages) if isinstance(m, HumanMessage))
    earlier, current = messages[:current_start], messages[current_start:]

    turns: list[list[AnyMessage]] = []
    for message in earlier:
        if isinstance(message, HumanMessage):
            turns.append([message])
        elif isinstance(message, AIMessage) and not message.tool_calls and turns:
            turns[-1].append(message)

    recent_turns = turns[-TURN_WINDOW:]
    return [message for turn in recent_turns for message in turn] + current


def build_graph(
    model: BaseChatModel,
    search: SearchFn,
    system_prompt: str,
    checkpointer: BaseCheckpointSaver[Any],
) -> CompiledStateGraph[ChatState, None, ChatInput, ChatState]:
    """Invoke with the new HumanMessage and name. Each turn resets its own tool budget."""
    if "{context}" not in system_prompt:
        raise ValueError("system_prompt must contain {context}")

    async def search_tool(query: str) -> str:
        return format_context(await asyncio.to_thread(search, query))

    knowledge_tool = StructuredTool.from_function(
        coroutine=search_tool, name=TOOL_NAME, description=TOOL_DESCRIPTION
    )
    model_with_tools = model.bind_tools([knowledge_tool])
    tool_node = ToolNode([knowledge_tool])

    async def retrieve(state: ChatState) -> dict[str, Any]:
        *history, new_message = state["messages"]
        query = build_search_query(history, new_message.text)
        chunks = await asyncio.to_thread(search, query)
        return {"context": format_context(chunks), "tool_rounds": 0}

    async def agent(state: ChatState, config: RunnableConfig) -> dict[str, Any]:
        can_search = state["tool_rounds"] < MAX_TOOL_ROUNDS
        prompt = SystemMessage(system_prompt.replace("{context}", state["context"]))
        messages = [prompt, *trim_history(state["messages"])]

        reply = await (model_with_tools if can_search else model).ainvoke(messages, config)
        if not can_search:
            # A dangling tool call would break the next turn, so the last round must be text.
            reply = reply.model_copy(update={"tool_calls": []})
        return {"messages": [reply]}

    async def tools(state: ChatState, config: RunnableConfig) -> dict[str, Any]:
        requested = state["messages"][-1]
        assert isinstance(requested, AIMessage)
        # Only the first call runs, to hold the cap on embedding calls.
        first_call_only = requested.model_copy(update={"tool_calls": requested.tool_calls[:1]})
        result = await tool_node.ainvoke({"messages": [first_call_only]}, config)
        return {
            "messages": [first_call_only, *result["messages"]],
            "tool_rounds": state["tool_rounds"] + 1,
        }

    graph = StateGraph(ChatState, input_schema=ChatInput)
    graph.add_node("retrieve", retrieve)
    graph.add_node("agent", agent)
    graph.add_node("tools", tools)
    graph.add_edge(START, "retrieve")
    graph.add_edge("retrieve", "agent")
    graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile(checkpointer=checkpointer)
