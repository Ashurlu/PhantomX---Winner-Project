from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import current_user
from ..models import (
    CaseAssignee,
    InboxCaseCreate,
    InboxCaseDetail,
    InboxCasePatch,
    InboxCaseSummary,
    InboxStats,
)
from ..services import cases_store
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1/cases", tags=["cases"])


def _initials(username: str) -> str:
    parts = [p for p in username.replace(".", " ").replace("_", " ").replace("-", " ").split() if p]
    if not parts:
        return username[:2].upper()
    return "".join(p[0].upper() for p in parts[:2])


@router.get("/assignees", response_model=list[CaseAssignee])
async def case_assignees(user: dict = Depends(current_user)):
    """Active platform users available for case assignment (any authenticated role)."""
    me = user["username"]
    out: list[CaseAssignee] = []
    seen: set[str] = set()

    def add(username: str, label: str | None = None) -> None:
        key = username.lower()
        if key in seen:
            return
        seen.add(key)
        out.append(CaseAssignee(initials=_initials(username), name=label or username))

    add(me, f"{me} (you)")
    for row in db.list_users():
        if not row.get("active", True):
            continue
        add(row["username"])
    return out


@router.get("/stats", response_model=InboxStats)
async def inbox_stats(_: dict = Depends(current_user)):
    return await get_provider().cases_inbox_stats()


@router.get("/inbox", response_model=list[InboxCaseSummary])
async def inbox_cases(_: dict = Depends(current_user)):
    return await get_provider().cases_inbox()


@router.post("/inbox", response_model=InboxCaseDetail, status_code=201)
async def create_inbox_case(body: InboxCaseCreate, user: dict = Depends(current_user)):
    payload = body.model_dump(exclude={"historyEvent"})
    if cases_store.get_case(body.id):
        raise HTTPException(status_code=409, detail="Case id already exists")
    event = body.historyEvent.model_dump() if body.historyEvent else {
        "id": f"h-{body.id}-created",
        "type": "created",
        "actor": user["username"],
        "detail": "Case created manually",
        "timestamp": body.createdAt,
    }
    case = cases_store.create_case(payload, event)
    db.add_audit(user["username"], "cases.create", f"{body.id}: {body.title[:120]}")
    return case


@router.get("/inbox/{case_id}", response_model=InboxCaseDetail)
async def inbox_case(case_id: str, _: dict = Depends(current_user)):
    case = await get_provider().cases_inbox_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/inbox/{case_id}", response_model=InboxCaseDetail)
async def patch_inbox_case(
    case_id: str,
    body: InboxCasePatch,
    user: dict = Depends(current_user),
):
    patch = body.model_dump(exclude_unset=True, exclude={"historyEvent", "note", "unassign"})
    if body.unassign:
        patch["assignee"] = None
    elif body.assignee is not None:
        patch["assignee"] = body.assignee.model_dump()
    try:
        case = cases_store.patch_case(
            case_id,
            patch,
            history_event=body.historyEvent.model_dump() if body.historyEvent else None,
            note=body.note,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Case not found") from None
    db.add_audit(user["username"], "cases.update", f"{case_id}: {list(patch.keys())}")
    return case


@router.delete("/inbox/{case_id}", status_code=204)
async def delete_inbox_case(case_id: str, user: dict = Depends(current_user)):
    if cases_store.get_case(case_id) is None:
        raise HTTPException(status_code=404, detail="Case not found")
    cases_store.delete_case(case_id)
    db.add_audit(user["username"], "cases.delete", case_id)
