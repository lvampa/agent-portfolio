from collections.abc import Iterator, Sequence
from typing import Any

from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatResult
from langchain_core.runnables import Runnable

from agent_service.constants import TOOL_NAME


class FakeChat(GenericFakeChatModel):
    """Records every model call as (tools_bound, messages)."""

    calls: list[tuple[bool, list[BaseMessage]]] = []
    tools_bound: bool = False
    error: Exception | None = None

    def bind_tools(self, tools: Sequence[Any], **kwargs: Any) -> Runnable[Any, Any]:
        return self.model_copy(update={"tools_bound": True})

    def _generate(self, messages: list[BaseMessage], *args: Any, **kwargs: Any) -> ChatResult:
        self.calls.append((self.tools_bound, list(messages)))
        if self.error:
            raise self.error
        return super()._generate(messages, *args, **kwargs)


def tool_call(call_id: str) -> dict[str, Any]:
    return {"name": TOOL_NAME, "args": {"query": "more"}, "id": call_id}


def fake_model(script: Iterator[AIMessage]) -> FakeChat:
    return FakeChat(messages=script, calls=[])


class RecordingSearch:
    def __init__(self, chunks: list[str], error: Exception | None = None) -> None:
        self.chunks = chunks
        self.error = error
        self.queries: list[str] = []

    def __call__(self, query: str) -> list[str]:
        self.queries.append(query)
        if self.error:
            raise self.error
        return self.chunks
