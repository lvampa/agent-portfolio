import asyncio
import os
import sqlite3
import time
from pathlib import Path
from typing import Any

import httpx
import pytest
from fakes import FakeChat, RecordingSearch, fake_model
from google.genai.errors import ClientError
from langchain_core.messages import AIMessage, HumanMessage
from langchain_google_genai._common import GoogleGenerativeAIError
from langchain_google_genai.chat_models import GoogleRateLimitError
from langgraph.checkpoint.base import BaseCheckpointSaver

from agent_service import app as app_module
from agent_service.app import create_app
from agent_service.graph import build_graph
from agent_service.types import Graph

SESSION = "7d4c2f3e-1b1a-4c55-9a3e-0a6f6f1d2c11"


@pytest.fixture(autouse=True)
def app_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)  # so a stray .env in the working directory is never read
    monkeypatch.delenv("LANGSMITH_TRACING", raising=False)
    monkeypatch.setenv("GOOGLE_API_KEY", "g")
    monkeypatch.setenv("PINECONE_API_KEY", "p")
    monkeypatch.setenv("SYSTEM_PROMPT", "CTX: {context}")
    monkeypatch.setenv("CHECKPOINT_PATH", str(tmp_path / "data" / "checkpoints.sqlite"))


class Harness:
    """Runs the app against a fake model and search, and keeps the graph for inspection."""

    def __init__(self, model: FakeChat, search: RecordingSearch) -> None:
        self.model = model
        self.search = search
        self.graph: Graph | None = None

    def factory(self, saver: BaseCheckpointSaver[Any]) -> Graph:
        self.graph = build_graph(self.model, self.search, "CTX: {context}", saver)
        return self.graph


def replies(*texts: str) -> FakeChat:
    return fake_model(iter([AIMessage(text) for text in texts]))


async def post(harness: Harness, bodies: list[dict[str, Any]]) -> list[httpx.Response]:
    app = create_app(harness.factory)
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return list(await asyncio.gather(*(client.post("/chat", json=b) for b in bodies)))


def body(text: str = "hi", name: str | None = "Ada") -> dict[str, Any]:
    return {"chatInput": text, "sessionId": SESSION, "name": name}


async def test_chat_returns_reply() -> None:
    [response] = await post(Harness(replies("hello"), RecordingSearch(["a"])), [body()])
    assert response.status_code == 200
    assert response.json() == {"reply": "hello"}


async def test_chat_accepts_null_name() -> None:
    [response] = await post(Harness(replies("hello"), RecordingSearch([])), [body(name=None)])
    assert response.status_code == 200


async def test_health() -> None:
    app = create_app(Harness(replies(), RecordingSearch([])).factory)
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            assert (await client.get("/health")).status_code == 200


async def test_empty_chat_input_is_422() -> None:
    [response] = await post(Harness(replies("x"), RecordingSearch([])), [body("")])
    assert response.status_code == 422


async def test_gemini_429_is_429() -> None:
    model = replies()
    model.error = GoogleRateLimitError("quota")
    [response] = await post(Harness(model, RecordingSearch([])), [body()])
    assert response.status_code == 429


async def test_embedding_429_is_429() -> None:
    error = GoogleGenerativeAIError("embedding failed")
    error.__cause__ = ClientError(429, {"error": {"status": "RESOURCE_EXHAUSTED"}})
    [response] = await post(Harness(replies("x"), RecordingSearch([], error)), [body()])
    assert response.status_code == 429


async def test_other_upstream_error_is_502() -> None:
    [response] = await post(
        Harness(replies("x"), RecordingSearch([], RuntimeError("pinecone down"))), [body()]
    )
    assert response.status_code == 502


async def test_empty_model_reply_is_502() -> None:
    [response] = await post(Harness(replies(""), RecordingSearch([])), [body()])
    assert response.status_code == 502


async def test_concurrent_same_session() -> None:
    harness = Harness(replies("one", "two"), RecordingSearch(["a"]))
    first, second = await post(harness, [body("q1"), body("q2")])
    assert first.status_code == second.status_code == 200

    assert harness.graph is not None
    # The checkpointer is closed with the app, so read the thread from the recorded model calls.
    last_call = harness.model.calls[-1][1]
    human_texts = [m.text for m in last_call if isinstance(m, HumanMessage)]
    assert sorted(human_texts) == ["q1", "q2"]


async def test_startup_creates_the_checkpoint_schema(tmp_path: Path) -> None:
    app = create_app(Harness(replies(), RecordingSearch([])).factory)
    async with app.router.lifespan_context(app):
        pass

    with sqlite3.connect(tmp_path / "data" / "checkpoints.sqlite") as connection:
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master")}
    assert "checkpoints" in tables


@pytest.mark.skipif(os.geteuid() == 0, reason="root ignores directory permissions")
async def test_startup_fails_when_checkpoint_dir_is_not_writable(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    locked = tmp_path / "locked"
    locked.mkdir()
    monkeypatch.setenv("CHECKPOINT_PATH", str(locked / "checkpoints.sqlite"))
    locked.chmod(0o500)
    try:
        app = create_app(Harness(replies(), RecordingSearch([])).factory)
        with pytest.raises(RuntimeError):
            async with app.router.lifespan_context(app):
                pass
    finally:
        locked.chmod(0o700)


class SlowOnceSearch(RecordingSearch):
    """Blocks on the first call only, like an upstream that hangs once."""

    def __call__(self, query: str) -> list[str]:
        first_call = not self.queries
        self.queries.append(query)
        if first_call:
            time.sleep(0.5)
        return self.chunks


async def test_turn_over_budget_is_502_and_releases_the_session_lock(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(app_module, "TURN_BUDGET_S", 0.2)
    harness = Harness(replies("hello"), SlowOnceSearch(["a"]))
    app = create_app(harness.factory)
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            slow = await client.post("/chat", json=body("first"))
            retry = await client.post("/chat", json=body("second"))

    assert slow.status_code == 502
    assert retry.status_code == 200
