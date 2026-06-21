from fastapi import APIRouter
from database import create_chat, get_all_chats, get_chat_messages, update_chat_title, delete_chat
from pydantic import BaseModel

router = APIRouter(
    prefix="/history",
    tags=["History"]
)


class RenameRequest(BaseModel):
    new_title: str


@router.post("/new")
def new_chat():

    chat_id = create_chat()

    return {
        "chat_id": chat_id
    }


@router.get("/list")
def list_chats():

    chats = get_all_chats()

    return {
        "chats": chats
    }


@router.get("/{chat_id}")
def get_chat(chat_id: int):

    messages = get_chat_messages(chat_id)

    return {
        "chat_id": chat_id,
        "messages": messages
    }


@router.put("/{chat_id}/rename")
def rename_chat(chat_id: int, request: RenameRequest):
    update_chat_title(chat_id, request.new_title)
    return {"success": True, "chat_id": chat_id, "new_title": request.new_title}


@router.delete("/{chat_id}")
def delete_chat_endpoint(chat_id: int):
    delete_chat(chat_id)
    return {"success": True, "deleted_id": chat_id}