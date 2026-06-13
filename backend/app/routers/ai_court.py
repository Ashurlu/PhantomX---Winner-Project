from fastapi import APIRouter, Depends, HTTPException

from ..auth import current_user
from ..models import AiCourtStats, CaseDetail, CaseSummary
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1/ai-court", tags=["ai-court"])


@router.get("/stats", response_model=AiCourtStats)
async def stats(range: str = "24h", _: dict = Depends(current_user)):
    return await get_provider().ai_court_stats(range)


@router.get("/cases", response_model=list[CaseSummary])
async def cases(_: dict = Depends(current_user)):
    return await get_provider().ai_court_cases()


@router.get("/cases/{alert_id}", response_model=CaseDetail)
async def case_detail(alert_id: str, _: dict = Depends(current_user)):
    case = await get_provider().ai_court_case(alert_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
