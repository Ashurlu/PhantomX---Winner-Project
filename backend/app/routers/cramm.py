from fastapi import APIRouter, Depends, HTTPException

from ..auth import current_user
from ..models import CrammAudit, CrammDetail, CrammExportReport, CrammMatrix
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1/cramm", tags=["cramm"])


@router.get("/matrix", response_model=CrammMatrix)
async def cramm_matrix(_: dict = Depends(current_user)):
    return await get_provider().cramm_matrix()


@router.get("/audit", response_model=CrammAudit)
async def cramm_audit(_: dict = Depends(current_user)):
    return await get_provider().cramm_audit()


@router.get("/export", response_model=CrammExportReport)
async def cramm_export(_: dict = Depends(current_user)):
    return await get_provider().cramm_export()


@router.get("/risks/{technique_id}", response_model=CrammDetail)
async def cramm_risk(technique_id: str, _: dict = Depends(current_user)):
    detail = await get_provider().cramm_detail(technique_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="CRAMM risk not found")
    return detail
