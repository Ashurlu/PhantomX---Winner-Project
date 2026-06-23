from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import current_user
from ..models import CaseAssignee, InboxCaseDetail, InboxCaseSummary, InboxStats
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


@router.get("/inbox/{case_id}", response_model=InboxCaseDetail)
async def inbox_case(case_id: str, _: dict = Depends(current_user)):
    case = await get_provider().cases_inbox_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
