"""체크포인트 thread_id 규칙 회귀."""

from app.api.routes import chat


def test_thread_id_uses_room_prefix_when_room_id_set():
    req = chat.InvokeRequest(
        manual_id="m1",
        question="hello",
        room_id="42",
    )
    assert chat._thread_id_for(req) == "room-42"


def test_thread_id_oneshot_unique_per_call_for_chat_request():
    req = chat.ChatRequest(manual_id="m1", question="q")
    a = chat._thread_id_for(req)
    b = chat._thread_id_for(req)
    assert a.startswith("oneshot-")
    assert b.startswith("oneshot-")
    assert a != b
