import pytest

from agent_service.config import Settings

KEYS = {"google_api_key": "g", "pinecone_api_key": "p"}


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    monkeypatch.delenv("SYSTEM_PROMPT", raising=False)
    monkeypatch.delenv("SYSTEM_PROMPT_FILE", raising=False)


def test_prompt_prefers_env_text_over_file(tmp_path):
    prompt_file = tmp_path / "prompt.md"
    prompt_file.write_text("from file")
    settings = Settings(
        _env_file=None, system_prompt="from env", system_prompt_file=str(prompt_file), **KEYS
    )
    assert settings.prompt() == "from env"


def test_prompt_falls_back_to_file(tmp_path):
    prompt_file = tmp_path / "prompt.md"
    prompt_file.write_text("from file")
    settings = Settings(_env_file=None, system_prompt_file=str(prompt_file), **KEYS)
    assert settings.prompt() == "from file"


def test_prompt_raises_when_unset():
    with pytest.raises(ValueError):
        Settings(_env_file=None, **KEYS).prompt()


def test_missing_api_keys_fail_at_construction(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("PINECONE_API_KEY", raising=False)
    with pytest.raises(ValueError):
        Settings(_env_file=None)


def test_api_keys_are_hidden_from_repr():
    assert "g-secret" not in repr(
        Settings(_env_file=None, google_api_key="g-secret", pinecone_api_key="p")
    )
