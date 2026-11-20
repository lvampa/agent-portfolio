from agent_service.types import ChatRequest


def test_request_accepts_null_name() -> None:
    request = ChatRequest.model_validate({"chatInput": "hi", "sessionId": "s", "name": None})
    assert request.name is None


def test_request_name_is_optional() -> None:
    assert ChatRequest(chatInput="hi", sessionId="s").name is None
