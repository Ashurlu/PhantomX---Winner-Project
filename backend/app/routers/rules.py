from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import current_user, require_role
from ..models import (
    RejectRequest,
    RuleCreate,
    RuleDetail,
    RuleSummary,
    RuleUpdate,
)
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1/rules", tags=["rules"])


@router.get("", response_model=list[RuleSummary])
async def list_rules(_: dict = Depends(current_user)):
    return await get_provider().rules()


@router.post("", response_model=RuleDetail, status_code=201)
async def create_rule(body: RuleCreate, user: dict = Depends(require_role("admin"))):
    """Manually author a Sigma detection rule (admin only)."""
    if not body.sigma.strip():
        raise HTTPException(status_code=422, detail="Sigma rule body is required")
    rule = await get_provider().create_rule(body.model_dump())
    db.add_audit(user["username"], "rule.create", f"{rule['id']}: {rule['title']}")
    return rule


@router.get("/{rule_id}", response_model=RuleDetail)
async def get_rule(rule_id: str, _: dict = Depends(current_user)):
    rule = await get_provider().rule(rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.put("/{rule_id}", response_model=RuleDetail)
async def edit_rule(
    rule_id: str, body: RuleUpdate, _: dict = Depends(require_role("admin"))
):
    rule = await get_provider().update_rule(rule_id, body.model_dump())
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.post("/{rule_id}/approve", response_model=RuleDetail)
async def approve_rule(rule_id: str, user: dict = Depends(require_role("admin"))):
    rule = await get_provider().approve_rule(rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.add_audit(user["username"], "rule.approve", rule_id)
    return rule


@router.post("/{rule_id}/reject", response_model=RuleDetail)
async def reject_rule(
    rule_id: str, body: RejectRequest, user: dict = Depends(require_role("admin"))
):
    if not body.reason or not body.reason.strip():
        raise HTTPException(status_code=422, detail="Reject reason is required")
    rule = await get_provider().reject_rule(rule_id, body.reason.strip())
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.add_audit(user["username"], "rule.reject", f"{rule_id}: {body.reason.strip()[:60]}")
    return rule
