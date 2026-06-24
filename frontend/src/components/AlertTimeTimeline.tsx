import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Brush, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar, ChevronDown, Pause, Play, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  bucketIndicesForWindow,
  formatDateTimeLocal,
  formatTimeRangeLabel,
  generateAlertBuckets,
  parseDateTimeLocal,
  TIME_PRESETS,
  type TimePresetId,
  windowFromBucketIndices,
} from "@/lib/time-range";
import { useUi } from "@/store/ui";

type BrushChange = { startIndex?: number; endIndex?: number };

export function AlertTimeTimeline({ className }: { className?: string }) {
  const {
    timeFrom,
    timeTo,
    chartFrom,
    chartTo,
    autoRefresh,
    setTimeWindow,
    setChartViewport,
    applyPreset,
    setAutoRefresh,
    slideWindowToNow,
  } = useUi();

  const buckets = useMemo(
    () => generateAlertBuckets(chartFrom, chartTo, 72),
    [chartFrom, chartTo]
  );

  const [brush, setBrush] = useState(() =>
    bucketIndicesForWindow(buckets, timeFrom, timeTo)
  );
  const [fromInput, setFromInput] = useState(() => formatDateTimeLocal(timeFrom));
  const [toInput, setToInput] = useState(() => formatDateTimeLocal(timeTo));
  const [showAbsolute, setShowAbsolute] = useState(false);

  useEffect(() => {
    setBrush(bucketIndicesForWindow(buckets, timeFrom, timeTo));
    setFromInput(formatDateTimeLocal(timeFrom));
    setToInput(formatDateTimeLocal(timeTo));
  }, [timeFrom, timeTo, buckets]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => slideWindowToNow(), 30000);
    return () => clearInterval(id);
  }, [autoRefresh, slideWindowToNow]);

  const applyBrush = useCallback(
    (start: number, end: number) => {
      const { from, to } = windowFromBucketIndices(buckets, start, end);
      setTimeWindow(from, to);
    },
    [buckets, setTimeWindow]
  );

  const onBrushChange = (range: BrushChange) => {
    if (range.startIndex == null || range.endIndex == null) return;
    const start = Math.min(range.startIndex, range.endIndex);
    const end = Math.max(range.startIndex, range.endIndex);
    setBrush({ start, end });
    applyBrush(start, end);
  };

  const onApplyAbsolute = () => {
    const from = parseDateTimeLocal(fromInput);
    const to = parseDateTimeLocal(toInput);
    if (from == null || to == null || from >= to) return;
    setChartViewport(Math.min(from, chartFrom), Math.max(to, chartTo));
    setTimeWindow(from, to);
  };

  const activePreset = useMemo(() => {
    const diff = timeTo - timeFrom;
    return TIME_PRESETS.find((p) => Math.abs(diff - p.ms) < p.ms * 0.08)?.id ?? null;
  }, [timeFrom, timeTo]);

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Time range
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatTimeRangeLabel(timeFrom, timeTo)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                activePreset === p.id
                  ? "bg-accent text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              {p.id.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
              autoRefresh
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            {autoRefresh ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button
            type="button"
            onClick={() => setShowAbsolute((s) => !s)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Absolute
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", showAbsolute && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* absolute from / to */}
      {showAbsolute && (
        <div className="flex flex-wrap items-end gap-3 border-b border-border bg-secondary/30 px-4 py-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            From
            <Input
              type="datetime-local"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="h-9 w-[200px] text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            To
            <Input
              type="datetime-local"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="h-9 w-[200px] text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onApplyAbsolute}
            className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Apply range
          </button>
          <button
            type="button"
            onClick={() => applyPreset("24h")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-muted-foreground hover:bg-secondary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      )}

      {/* histogram + brush (Wazuh-style) */}
      <div className="px-2 pb-2 pt-4">
        <p className="mb-2 px-2 text-[11px] text-muted-foreground">
          Drag on the histogram to narrow the alert window — click and drag the handles or
          select a region.
        </p>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "hsl(var(--popover-foreground))",
                  boxShadow: "0 4px 12px hsl(0 0% 0% / 0.15)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(value: number) => [value.toLocaleString(), "Alerts"]}
                labelFormatter={(_, payload) => {
                  const b = payload?.[0]?.payload as { t0: number; t1: number } | undefined;
                  if (!b) return "";
                  return formatTimeRangeLabel(b.t0, b.t1);
                }}
              />
              <Bar
                dataKey="alerts"
                fill="hsl(var(--accent))"
                fillOpacity={0.75}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
              <Brush
                dataKey="label"
                height={28}
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent) / 0.12)"
                travellerWidth={8}
                startIndex={brush.start}
                endIndex={brush.end}
                onChange={onBrushChange}
                tickFormatter={() => ""}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between px-3 pt-1 text-[10px] tabular-nums text-muted-foreground">
          <span>{new Date(chartFrom).toLocaleString()}</span>
          <span>{new Date(chartTo).toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
}
