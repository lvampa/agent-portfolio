from agent_service.constants import CHAT_TIMEOUT_S


def test_chat_timeout_meets_gemini_minimum() -> None:
    # Gemini rejects per-request deadlines under 10 s with 400 INVALID_ARGUMENT,
    # so every chat call fails.
    assert CHAT_TIMEOUT_S >= 10
