from fastapi import APIRouter, Depends

from ..auth import current_user
from ..models import HuntRequest, HuntResponse
from ..services import hunt_service

router = APIRouter(prefix="/api/v1/hunt", tags=["hunt"])


@router.post("", response_model=HuntResponse)
async def threat_hunt(body: HuntRequest, _: dict = Depends(current_user)):
    history = [{"role": m.role, "content": m.content} for m in body.history]
    result = await hunt_service.run_hunt(
        body.message.strip(),
        history,
        time_range=body.time_range,
        context_path=body.context_path,
    )
    return HuntResponse(**result)
