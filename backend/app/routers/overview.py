from fastapi import APIRouter, Depends

from ..auth import current_user
from ..models import Overview
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1", tags=["overview"])


@router.get("/overview", response_model=Overview)
async def get_overview(range: str = "24h", _: dict = Depends(current_user)):
    return await get_provider().overview(range)
