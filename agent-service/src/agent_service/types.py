from typing import Annotated, TypedDict

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


class ChatState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    name: str | None
    context: str
    tool_rounds: int


class ChatInput(TypedDict):
    """What a caller passes in. The graph fills in the rest of ChatState."""

    messages: Annotated[list[AnyMessage], add_messages]
    name: str | None


class ChatRequest(BaseModel):
    chatInput: str = Field(min_length=1)
    sessionId: str = Field(min_length=1)
    name: str | None = None


class ChatResponse(BaseModel):
    reply: str
