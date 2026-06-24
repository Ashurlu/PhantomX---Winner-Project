from fastapi import APIRouter, Depends

from ..auth import current_user
from ..models import InvestigationPipelineConfig, Overview
from ..services.investigation_pipeline import get_pipeline_config
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1", tags=["overview"])


@router.get("/investigation-pipeline", response_model=InvestigationPipelineConfig)
async def get_investigation_pipeline(_: dict = Depends(current_user)):
    """Read-only pipeline config for overview charts (any authenticated user)."""
    return get_pipeline_config()


@router.get("/overview", response_model=Overview)
async def get_overview(range: str = "24h", _: dict = Depends(current_user)):
    return await get_provider().overview(range)
