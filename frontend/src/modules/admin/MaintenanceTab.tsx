import { useState } from "react";
import { Download, Loader2, RotateCcw, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { downloadConfig, useResetDemo } from "@/lib/api";

export function MaintenanceTab() {
  const reset = useResetDemo();
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState(false);

  const doReset = async () => {
    try {
      const r = await reset.mutateAsync();
      toast.success("Demo data re-seeded", { description: r.detail });
      setConfirming(false);
    } catch (e) {
      toast.error("Reset failed", { description: String((e as Error).message) });
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      await downloadConfig();
      toast.success("Config exported", { description: "phantomx_config.json (secrets masked)." });
    } catch (e) {
      toast.error("Export failed", { description: String((e as Error).message) });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="h-4 w-4 text-accent" /> Re-seed Demo Data
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Reset the Recommended Rules back to their seed set and clear all
            pentest runs. Users, accounts, and saved settings are untouched.
          </p>
          {confirming ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={reset.isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doReset} disabled={reset.isPending}>
                {reset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Confirm reset
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="self-start" onClick={() => setConfirming(true)}>
              <RotateCcw className="h-4 w-4" /> Re-seed demo data
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-accent" /> Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Download the current data-source mode, integration endpoints, and the
            user roster as a JSON backup. Secret keys are masked in the export.
          </p>
          <Button variant="outline" className="self-start" onClick={doExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export config (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-muted-foreground" /> About maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          These tools operate on the in-memory mock state and the settings store.
          Re-seeding is safe and reversible — it only restores the demo content so
          you can present from a clean slate.
        </CardContent>
      </Card>
    </div>
  );
}
