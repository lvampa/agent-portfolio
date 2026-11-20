from pathlib import Path

import pytest
from pydantic import ValidationError

from agent_service.config import Settings


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SYSTEM_PROMPT", raising=False)
    monkeypatch.delenv("SYSTEM_PROMPT_FILE", raising=False)
    monkeypatch.setenv("GOOGLE_API_KEY", "g-secret")
    monkeypatch.setenv("PINECONE_API_KEY", "p")


def test_prompt_prefers_env_text_over_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    prompt_file = tmp_path / "prompt.md"
    prompt_file.write_text("from file")
    monkeypatch.setenv("SYSTEM_PROMPT", "from env")
    monkeypatch.setenv("SYSTEM_PROMPT_FILE", str(prompt_file))
    assert Settings(_env_file=None).prompt() == "from env"


def test_prompt_falls_back_to_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    prompt_file = tmp_path / "prompt.md"
    prompt_file.write_text("from file")
    monkeypatch.setenv("SYSTEM_PROMPT_FILE", str(prompt_file))
    assert Settings(_env_file=None).prompt() == "from file"


def test_prompt_raises_when_unset() -> None:
    with pytest.raises(ValueError):
        Settings(_env_file=None).prompt()


def test_missing_api_keys_fail_at_construction(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY")
    monkeypatch.delenv("PINECONE_API_KEY")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_api_keys_are_hidden_from_repr() -> None:
    assert "g-secret" not in repr(Settings(_env_file=None))
