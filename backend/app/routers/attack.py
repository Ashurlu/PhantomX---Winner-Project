"""ATT&CK Navigator coverage — a single coverage layer over executed TTPs."""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from ..auth import current_user
from ..models import CoverageEntry
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1/attack", tags=["attack"])


@router.get("/coverage", response_model=list[CoverageEntry])
async def coverage(_: dict = Depends(current_user)):
    return await get_provider().coverage()


@router.get("/navigator-layer")
async def navigator_layer(_: dict = Depends(current_user)):
    """Export an official MITRE ATT&CK Navigator layer (v4.5) JSON file."""
    entries = await get_provider().coverage()
    techniques = [
        {
            "techniqueID": e["techniqueID"],
            "tactic": e["tactic"],
            "score": e["score"],
            "color": "",
            "comment": e["comment"],
            "enabled": True,
            "metadata": [
                {"name": "tested", "value": str(e["tested"]).lower()},
                {"name": "detected", "value": str(e["detected"]).lower()},
                {"name": "sigmaRule", "value": e.get("sigmaRule") or "none"},
            ],
        }
        for e in entries
    ]
    layer = {
        "name": "PhantomX — Atomic Red Team Coverage",
        "versions": {"attack": "14", "navigator": "4.9.1", "layer": "4.5"},
        "domain": "enterprise-attack",
        "description": "Single coverage layer: Atomic Red Team executions detected via Wazuh + Sigma.",
        "sorting": 3,
        "techniques": techniques,
        "gradient": {
            "colors": ["#ff6666ff", "#ffe766ff", "#8ec843ff"],
            "minValue": 0,
            "maxValue": 100,
        },
        "legendItems": [
            {"label": "Tested + detected", "color": "#8ec843"},
            {"label": "Tested, not detected (gap)", "color": "#ffe766"},
            {"label": "Not tested", "color": "#ff6666"},
        ],
        "showTacticRowBackground": True,
        "tacticRowBackground": "#205b8f",
    }
    return JSONResponse(
        content=layer,
        headers={
            "Content-Disposition": 'attachment; filename="phantomx_attack_layer.json"'
        },
    )
