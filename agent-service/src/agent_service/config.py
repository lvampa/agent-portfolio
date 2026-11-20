"""Environment-driven settings."""

from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Reads GOOGLE_API_KEY, PINECONE_API_KEY, SYSTEM_PROMPT, SYSTEM_PROMPT_FILE, CHECKPOINT_PATH.

    Also reads `.env` from the working directory.
    Both API keys are required, so a missing one fails at startup.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    google_api_key: SecretStr = Field(min_length=1)
    pinecone_api_key: SecretStr = Field(min_length=1)
    system_prompt: SecretStr = SecretStr("")
    system_prompt_file: str = ""
    checkpoint_path: str = "/data/checkpoints.sqlite"

    def prompt(self) -> str:
        """Returns SYSTEM_PROMPT, or the contents of SYSTEM_PROMPT_FILE when it is empty."""
        if self.system_prompt.get_secret_value():
            return self.system_prompt.get_secret_value()
        if self.system_prompt_file:
            return Path(self.system_prompt_file).read_text()
        raise ValueError("Set SYSTEM_PROMPT or SYSTEM_PROMPT_FILE")
