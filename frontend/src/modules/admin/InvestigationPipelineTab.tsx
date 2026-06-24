import { useEffect, useState } from "react";
import {
  GitBranch,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/components/States";
import { toast } from "@/components/ui/sonner";
import {
  useAdminInvestigationPipeline,
  useResetInvestigationPipeline,
  useUpdateInvestigationPipeline,
} from "@/lib/api";
import {
  getDefaultPipelineUpdate,
  newEmptyLink,
  newEmptyNode,
  validatePipelineConfig,
} from "@/lib/investigation-pipeline";
import { SANKEY_COLUMNS } from "@/data/investigation-sankey";
import type {
  InvestigationPipelineUpdate,
  PipelineMetricSlice,
  SankeyLinkConfig,
  SankeyNodeConfig,
} from "@/lib/types";
import { AdminTabLoader } from "./AdminTabLoader";

type Section = "nodes" | "links" | "metrics";

export function InvestigationPipelineTab() {
  const { data, isLoading, isError, refetch } = useAdminInvestigationPipeline();
  const update = useUpdateInvestigationPipeline();
  const reset = useResetInvestigationPipeline();
  const [form, setForm] = useState<InvestigationPipelineUpdate | null>(null);
  const [section, setSection] = useState<Section>("nodes");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        nodes: data.nodes.map((n) => ({ ...n })),
        links: data.links.map((l) => ({ ...l })),
        metrics: data.metrics ? { ...data.metrics } : getDefaultPipelineUpdate().metrics,
      });
    }
  }, [data]);

  if (isError) {
    return <ErrorState message="Failed to load pipeline config." onRetry={() => refetch()} />;
  }

  const waiting = isLoading || !form;

  const save = async () => {
    if (!form) return;
    const errors = validatePipelineConfig(form);
    if (errors.length) {
      toast.error("Validation failed", { description: errors[0] });
      return;
    }
    try {
      await update.mutateAsync(form);
      toast.success("Pipeline saved", {
        description: `${form.nodes.length} nodes · ${form.links.length} links`,
      });
    } catch (e) {
      toast.error("Save failed", { description: String((e as Error).message) });
    }
  };

  const doReset = async () => {
    try {
      const defaults = await reset.mutateAsync();
      setForm({
        nodes: defaults.nodes.map((n) => ({ ...n })),
        links: defaults.links.map((l) => ({ ...l })),
        metrics: defaults.metrics ? { ...defaults.metrics } : getDefaultPipelineUpdate().metrics,
      });
      setConfirmReset(false);
      toast.success("Defaults restored", {
        description: "Custom pipeline cleared; overview uses seed data.",
      });
    } catch (e) {
      toast.error("Reset failed", { description: String((e as Error).message) });
    }
  };

  const loadDefaultsToForm = () => {
    const d = getDefaultPipelineUpdate();
    setForm(d);
    toast.message("Form loaded with defaults", { description: "Click Save to persist." });
  };

  const nodeIds = form?.nodes.map((n) => n.id) ?? [];

  const patchNode = (index: number, patch: Partial<SankeyNodeConfig>) => {
    if (!form) return;
    const nodes = [...form.nodes];
    nodes[index] = { ...nodes[index], ...patch };
    setForm({ ...form, nodes });
  };

  const patchLink = (index: number, patch: Partial<SankeyLinkConfig>) => {
    if (!form) return;
    const links = [...form.links];
    links[index] = { ...links[index], ...patch };
    setForm({ ...form, links });
  };

  const patchMetrics = (patch: Partial<NonNullable<InvestigationPipelineUpdate["metrics"]>>) => {
    if (!form) return;
    setForm({
      ...form,
      metrics: { ...(form.metrics ?? {}), ...patch },
    });
  };

  return (
    <AdminTabLoader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {data?.configured ? (
              <Badge variant="secondary">Custom config active</Badge>
            ) : (
              <Badge variant="outline">Using built-in defaults</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDefaultsToForm}
              disabled={waiting || update.isPending}
            >
              Load defaults
            </Button>
            {confirmReset ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={doReset}
                  disabled={reset.isPending}
                >
                  {reset.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Confirm reset
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReset(true)}
                disabled={waiting || reset.isPending}
              >
                <RotateCcw className="h-4 w-4" /> Reset to defaults
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={waiting || update.isPending}>
              {update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save pipeline
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["nodes", "Nodes"],
              ["links", "Links"],
              ["metrics", "Summary metrics"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                section === id
                  ? "border-accent/40 bg-accent/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {waiting ? (
          <Skeleton className="h-64 w-full" />
        ) : section === "nodes" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4" /> Sankey nodes
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    nodes: [...form.nodes, newEmptyNode(form.nodes.length % SANKEY_COLUMNS.length, 0)],
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add node
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Col</TableHead>
                    <TableHead>Row</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.nodes.map((node, i) => (
                    <TableRow key={`${node.id}-${i}`}>
                      <TableCell className="p-2">
                        <Input
                          value={node.id}
                          onChange={(e) => patchNode(i, { id: e.target.value })}
                          className="h-8 font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          value={node.label}
                          onChange={(e) => patchNode(i, { label: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={node.value}
                          onChange={(e) => patchNode(i, { value: Number(e.target.value) })}
                          className="h-8 w-16 text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          min={0}
                          max={SANKEY_COLUMNS.length - 1}
                          value={node.column}
                          onChange={(e) => patchNode(i, { column: Number(e.target.value) })}
                          className="h-8 w-14 text-xs"
                          title={SANKEY_COLUMNS[node.column] ?? ""}
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={node.row}
                          onChange={(e) => patchNode(i, { row: Number(e.target.value) })}
                          className="h-8 w-14 text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          value={node.color ?? ""}
                          onChange={(e) => patchNode(i, { color: e.target.value })}
                          className="h-8 w-24 font-mono text-xs"
                          placeholder="#6B5CE7"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() =>
                            setForm({
                              ...form,
                              nodes: form.nodes.filter((_, j) => j !== i),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">
                Columns: {SANKEY_COLUMNS.map((c, i) => `${i}=${c}`).join(" · ")}
              </p>
            </CardContent>
          </Card>
        ) : section === "links" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Sankey links</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    links: [...form.links, newEmptyLink(nodeIds[0] ?? "", nodeIds[1] ?? "")],
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add link
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.links.map((link, i) => (
                    <TableRow key={`${link.source}-${link.target}-${i}`}>
                      <TableCell className="p-2">
                        <select
                          value={link.source}
                          onChange={(e) => patchLink(i, { source: e.target.value })}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">—</option>
                          {nodeIds.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="p-2">
                        <select
                          value={link.target}
                          onChange={(e) => patchLink(i, { target: e.target.value })}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">—</option>
                          {nodeIds.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={link.value}
                          onChange={(e) => patchLink(i, { value: Number(e.target.value) })}
                          className="h-8 w-16 text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          value={link.color ?? ""}
                          onChange={(e) => patchLink(i, { color: e.target.value })}
                          className="h-8 w-24 font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() =>
                            setForm({
                              ...form,
                              links: form.links.filter((_, j) => j !== i),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pipeline stats</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <MetricField
                  label="Escalated"
                  type="number"
                  value={form.metrics?.escalated ?? ""}
                  onChange={(v) => patchMetrics({ escalated: v === "" ? undefined : Number(v) })}
                />
                <MetricField
                  label="Not escalated"
                  type="number"
                  value={form.metrics?.notEscalated ?? ""}
                  onChange={(v) =>
                    patchMetrics({ notEscalated: v === "" ? undefined : Number(v) })
                  }
                />
                <MetricField
                  label="Time saved"
                  value={form.metrics?.timeSaved ?? ""}
                  onChange={(v) => patchMetrics({ timeSaved: v || undefined })}
                />
                <MetricField
                  label="Total alerts (scale base)"
                  type="number"
                  value={form.metrics?.totalAlerts ?? ""}
                  onChange={(v) =>
                    patchMetrics({ totalAlerts: v === "" ? undefined : Number(v) })
                  }
                  hint="Sankey values scale by incidents ÷ this number"
                />
              </CardContent>
            </Card>

            <SliceEditor
              title="Log sources"
              slices={form.metrics?.sources ?? []}
              onChange={(slices) => patchMetrics({ sources: slices })}
            />
            <SliceEditor
              title="Determinations"
              slices={form.metrics?.determinations ?? []}
              onChange={(slices) => patchMetrics({ determinations: slices })}
              className="lg:col-span-2"
            />
          </div>
        )}
      </div>
    </AdminTabLoader>
  );
}

function MetricField({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number";
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SliceEditor({
  title,
  slices,
  onChange,
  className,
}: {
  title: string;
  slices: PipelineMetricSlice[];
  onChange: (slices: PipelineMetricSlice[]) => void;
  className?: string;
}) {
  const patch = (index: number, patch: Partial<PipelineMetricSlice>) => {
    const next = [...slices];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...slices, { name: "New", value: 0, pct: 0, color: "#6B5CE7" }])
          }
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Pct</TableHead>
              <TableHead>Color</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {slices.map((s, i) => (
              <TableRow key={`${s.name}-${i}`}>
                <TableCell className="p-2">
                  <Input
                    value={s.name}
                    onChange={(e) => patch(i, { name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    value={s.value}
                    onChange={(e) => patch(i, { value: Number(e.target.value) })}
                    className="h-8 w-16 text-xs"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    value={s.pct}
                    onChange={(e) => patch(i, { pct: Number(e.target.value) })}
                    className="h-8 w-14 text-xs"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    value={s.color}
                    onChange={(e) => patch(i, { color: e.target.value })}
                    className="h-8 w-24 font-mono text-xs"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onChange(slices.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
