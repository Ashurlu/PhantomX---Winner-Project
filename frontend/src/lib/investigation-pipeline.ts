import type {
  InvestigationPipelineUpdate,
  SankeyLinkConfig,
  SankeyNodeConfig,
} from "@/lib/types";
import {
  INVESTIGATION_METRICS,
  INVESTIGATION_SANKEY_LINKS,
  INVESTIGATION_SANKEY_NODES,
} from "@/data/investigation-sankey";

export function getDefaultPipelineUpdate(): InvestigationPipelineUpdate {
  return {
    nodes: INVESTIGATION_SANKEY_NODES.map((n) => ({ ...n })),
    links: INVESTIGATION_SANKEY_LINKS.map((l) => ({ ...l })),
    metrics: { ...INVESTIGATION_METRICS },
  };
}

export function validatePipelineConfig(body: InvestigationPipelineUpdate): string[] {
  const errors: string[] = [];
  if (!body.nodes.length) errors.push("At least one node is required");
  const ids = body.nodes.map((n) => n.id.trim());
  if (ids.some((id) => !id)) errors.push("Node id cannot be empty");
  if (new Set(ids).size !== ids.length) errors.push("Node ids must be unique");
  const idSet = new Set(ids);
  if (!body.links.length) errors.push("At least one link is required");
  body.links.forEach((link, i) => {
    if (!idSet.has(link.source)) {
      errors.push(`Link #${i + 1}: source "${link.source}" not found in nodes`);
    }
    if (!idSet.has(link.target)) {
      errors.push(`Link #${i + 1}: target "${link.target}" not found in nodes`);
    }
    if (link.value < 0) errors.push(`Link #${i + 1}: value must be >= 0`);
  });
  body.nodes.forEach((node, i) => {
    if (node.value < 0) errors.push(`Node #${i + 1}: value must be >= 0`);
    if (node.column < 0) errors.push(`Node #${i + 1}: column must be >= 0`);
    if (node.row < 0) errors.push(`Node #${i + 1}: row must be >= 0`);
  });
  return errors;
}

export function newEmptyNode(column = 0, row = 0): SankeyNodeConfig {
  const id = `node-${Date.now()}`;
  return { id, label: "New node", value: 10, column, row, color: "#6B5CE7" };
}

export function newEmptyLink(source = "", target = ""): SankeyLinkConfig {
  return { source, target, value: 5, color: "#6B5CE7" };
}
