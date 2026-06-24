from fastapi import APIRouter, Depends

from ..auth import current_user
from ..models import DetectionIntel
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1", tags=["detection"])


@router.get("/detection", response_model=DetectionIntel)
async def get_detection(range: str = "24h", _: dict = Depends(current_user)):
    return await get_provider().detection(range)
