from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from chatbot import get_chat_response
from database import create_chat, save_message

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    chat_id: int


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    chat_id = request.chat_id
    if chat_id is None:
        chat_id = create_chat()

    save_message(chat_id, "user", request.message)
    reply = get_chat_response(request.message)
    save_message(chat_id, "assistant", reply)

    return {
        "reply": reply,
        "chat_id": chat_id
    }