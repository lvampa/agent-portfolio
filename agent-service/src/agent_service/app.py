"""The FastAPI app: HTTP routes, startup, and mapping upstream errors to status codes."""

import asyncio
import logging
import os
import time
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any
from weakref import WeakValueDictionary

from fastapi import FastAPI, HTTPException
from google.genai.errors import ClientError
from langchain_core.exceptions import ModelRateLimitError
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from agent_service.config import Settings
from agent_service.constants import (
    CHAT_MAX_OUTPUT_TOKENS,
    CHAT_MAX_RETRIES,
    CHAT_MODEL,
    CHAT_TEMPERATURE,
)
from agent_service.graph import build_graph, reply_from
from agent_service.retrieval import make_pinecone_search
from agent_service.types import ChatRequest, ChatResponse, Graph

logger = logging.getLogger("agent_service")

GraphFactory = Callable[[BaseCheckpointSaver[Any]], Graph]


def is_rate_limited(error: BaseException | None) -> bool:
    """Walks the cause chain for a Gemini 429.

    Chat calls raise langchain's ModelRateLimitError (langchain_google_genai maps status 429 to
    GoogleRateLimitError). Embedding calls wrap the SDK's ClientError in a plain
    GoogleGenerativeAIError, so the 429 is only on the cause.
    """
    while error is not None:
        if isinstance(error, ModelRateLimitError):
            return True
        if isinstance(error, ClientError) and error.code == 429:
            return True
        error = error.__cause__
    return False


def status_for(error: BaseException) -> int:
    """Gemini rate limits become 429 so n8n can pass them on; everything else is a 502."""
    return 429 if is_rate_limited(error) else 502


def make_default_graph_factory(settings: Settings) -> GraphFactory:
    """The real Gemini and Pinecone wiring, which tests replace with fakes."""
    model = ChatGoogleGenerativeAI(
        model=CHAT_MODEL,
        api_key=settings.google_api_key,
        temperature=CHAT_TEMPERATURE,
        max_output_tokens=CHAT_MAX_OUTPUT_TOKENS,
        max_retries=CHAT_MAX_RETRIES,
    )
    search = make_pinecone_search(settings)
    prompt = settings.prompt()
    return lambda saver: build_graph(model, search, prompt, saver)


def ensure_writable_dir(path: Path) -> None:
    """A bad data volume should fail startup, not the first chat."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not os.access(path.parent, os.W_OK):
        raise RuntimeError(f"Checkpoint directory is not writable: {path.parent}")


def create_app(graph_factory: GraphFactory | None = None) -> FastAPI:
    """Settings are read at startup, so importing this module needs no environment."""
    session_locks: WeakValueDictionary[str, asyncio.Lock] = WeakValueDictionary()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        logging.basicConfig(level=logging.INFO)
        settings = Settings()
        checkpoint_path = Path(settings.checkpoint_path)
        ensure_writable_dir(checkpoint_path)
        factory = graph_factory or make_default_graph_factory(settings)
        async with AsyncSqliteSaver.from_conn_string(str(checkpoint_path)) as saver:
            await saver.setup()
            app.state.graph = factory(saver)
            yield

    app = FastAPI(lifespan=lifespan)

    def lock_for(session_id: str) -> asyncio.Lock:
        lock = session_locks.get(session_id)
        if lock is None:
            lock = asyncio.Lock()
            session_locks[session_id] = lock
        return lock

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/chat")
    async def chat(request: ChatRequest) -> ChatResponse:
        started = time.monotonic()
        status = 500
        try:
            # Concurrent posts on one session would race on the checkpoint.
            async with lock_for(request.sessionId):
                state = await app.state.graph.ainvoke(
                    {"messages": [HumanMessage(request.chatInput)], "name": request.name},
                    config={
                        "configurable": {"thread_id": request.sessionId},
                        "metadata": {"sessionId": request.sessionId, "name": request.name},
                    },
                )
            reply = reply_from(state)
            if not reply:
                raise ValueError("Model returned an empty reply")
            status = 200
        except Exception as error:
            status = status_for(error)
            if status == 429:
                logger.warning("chat rate limited type=%s", type(error).__name__)
            else:
                logger.warning("chat upstream error", exc_info=True)
            raise HTTPException(status_code=status, detail="Upstream error") from error
        finally:
            duration_ms = round((time.monotonic() - started) * 1000)
            logger.info(
                "chat sessionId=%s status=%s duration_ms=%s",
                request.sessionId,
                status,
                duration_ms,
            )
        return ChatResponse(reply=reply)

    return app


app = create_app()
