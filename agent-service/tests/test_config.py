import pytest

from agent_service.config import Settings


def test_prompt_prefers_env_text_over_file(tmp_path):
    prompt_file = tmp_path / "prompt.md"
    prompt_file.write_text("from file")
    settings = Settings(system_prompt="from env", system_prompt_file=str(prompt_file))
    assert settings.prompt() == "from env"


def test_prompt_falls_back_to_file(tmp_path):
    prompt_file = tmp_path / "prompt.md"
    prompt_file.write_text("from file")
    assert Settings(system_prompt_file=str(prompt_file)).prompt() == "from file"


def test_prompt_raises_when_unset():
    with pytest.raises(ValueError):
        Settings(_env_file=None).prompt()
