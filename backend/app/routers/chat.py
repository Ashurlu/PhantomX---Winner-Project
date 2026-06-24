from fastapi import APIRouter, Depends

from ..auth import current_user
from ..models import ChatRequest, ChatResponse
from ..services import chat_service

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def soc_chat(body: ChatRequest, _: dict = Depends(current_user)):
    history = [{"role": m.role, "content": m.content} for m in body.history]
    result = await chat_service.chat(
        body.message.strip(),
        history,
        mode=body.mode,
        scope=body.scope,
        context_path=body.context_path,
        time_range=body.time_range,
    )
    return ChatResponse(**result)
