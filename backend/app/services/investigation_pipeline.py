"""Investigation pipeline config — defaults, validation, SQLite persistence."""
from __future__ import annotations

from fastapi import HTTPException

from .. import db
from ..data.investigation_pipeline_defaults import (
    DEFAULT_LINKS,
    DEFAULT_METRICS,
    DEFAULT_NODES,
)
from ..models import (
    InvestigationPipelineConfig,
    InvestigationPipelineUpdate,
)


def _defaults_response() -> InvestigationPipelineConfig:
    return InvestigationPipelineConfig(
        configured=False,
        nodes=DEFAULT_NODES,
        links=DEFAULT_LINKS,
        metrics=DEFAULT_METRICS,
    )


def validate_pipeline(body: InvestigationPipelineUpdate) -> list[str]:
    errors: list[str] = []
    if not body.nodes:
        errors.append("At least one node is required")
    ids = [n.id.strip() for n in body.nodes]
    if any(not i for i in ids):
        errors.append("Node id cannot be empty")
    if len(ids) != len(set(ids)):
        errors.append("Node ids must be unique")
    id_set = set(ids)
    if not body.links:
        errors.append("At least one link is required")
    for i, link in enumerate(body.links):
        if link.source not in id_set:
            errors.append(f"Link #{i + 1}: source '{link.source}' not found in nodes")
        if link.target not in id_set:
            errors.append(f"Link #{i + 1}: target '{link.target}' not found in nodes")
        if link.value < 0:
            errors.append(f"Link #{i + 1}: value must be >= 0")
    for i, node in enumerate(body.nodes):
        if node.value < 0:
            errors.append(f"Node #{i + 1}: value must be >= 0")
        if node.column < 0:
            errors.append(f"Node #{i + 1}: column must be >= 0")
        if node.row < 0:
            errors.append(f"Node #{i + 1}: row must be >= 0")
    return errors


def get_pipeline_config() -> InvestigationPipelineConfig:
    raw = db.get_investigation_pipeline()
    if not raw:
        return _defaults_response()
    return InvestigationPipelineConfig(
        configured=True,
        nodes=raw.get("nodes", DEFAULT_NODES),
        links=raw.get("links", DEFAULT_LINKS),
        metrics=raw.get("metrics"),
    )


def save_pipeline_config(
    body: InvestigationPipelineUpdate,
) -> InvestigationPipelineConfig:
    errors = validate_pipeline(body)
    if errors:
        raise HTTPException(status_code=422, detail="; ".join(errors))
    payload = {
        "nodes": [n.model_dump() for n in body.nodes],
        "links": [l.model_dump() for l in body.links],
        "metrics": body.metrics.model_dump() if body.metrics else None,
    }
    db.set_investigation_pipeline(payload)
    return InvestigationPipelineConfig(configured=True, **payload)


def reset_pipeline_config() -> InvestigationPipelineConfig:
    db.clear_investigation_pipeline()
    return _defaults_response()
