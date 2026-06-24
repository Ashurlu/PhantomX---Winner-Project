import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Save, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/States";
import { toast } from "@/components/ui/sonner";
import { useAdminSettings, useUpdateSettings } from "@/lib/api";
import { AdminTabLoader } from "./AdminTabLoader";
import type { AdminSettings } from "@/lib/types";

type KeyForm = Omit<AdminSettings, "dataSource">;

const FIELDS: {
  key: keyof KeyForm;
  label: string;
  placeholder: string;
  secret: boolean;
}[] = [
  { key: "n8nBaseUrl", label: "n8n Base URL", placeholder: "https://n8n.yourorg.com", secret: false },
  { key: "n8nApiKey", label: "n8n API Key", placeholder: "n8n_api_…", secret: true },
  { key: "pentestBaseUrl", label: "Pentest Tool Base URL", placeholder: "https://pentest.yourorg.com", secret: false },
  { key: "pentestApiKey", label: "Pentest Tool API Key", placeholder: "pt_…", secret: true },
  { key: "aiProviderKey", label: "AI Provider Key", placeholder: "sk-or-v1-… (OpenRouter)", secret: true },
  { key: "aiModel", label: "AI Analysis Model", placeholder: "openai/gpt-4o-mini or anthropic/claude-sonnet-4", secret: false },
  { key: "winrmUsername", label: "WinRM Username (remote targets)", placeholder: "Administrator", secret: false },
  { key: "winrmPassword", label: "WinRM Password (remote targets)", placeholder: "••••••••", secret: true },
];

export function ApiKeysTab() {
  const { data, isLoading, isError, refetch } = useAdminSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<KeyForm | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data) {
      const { dataSource, ...keys } = data;
      void dataSource;
      setForm(keys);
    }
  }, [data]);

  if (isError) return <ErrorState message="Failed to load settings." onRetry={() => refetch()} />;

  const waiting = isLoading || !form;

  const save = async () => {
    if (!form) return;
    try {
      await update.mutateAsync(form);
      toast.success("Settings saved", { description: "Integration keys updated." });
    } catch (e) {
      toast.error("Save failed", { description: String((e as Error).message) });
    }
  };

  return (
    <AdminTabLoader>
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Integration Keys & Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {waiting ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : (
            <>
              {FIELDS.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    {f.label}
                  </label>
                  <div className="relative">
                    <Input
                      type={f.secret && !reveal[f.key] ? "password" : "text"}
                      value={form[f.key]}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className={f.secret ? "pr-10 font-mono" : "font-mono"}
                    />
                    {f.secret && (
                      <button
                        type="button"
                        onClick={() => setReveal((r) => ({ ...r, [f.key]: !r[f.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {reveal[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button onClick={save} disabled={update.isPending}>
                  {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save settings
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-accent" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Keys are stored <span className="text-foreground">server-side only</span> and
            returned exclusively to authenticated admins. They never reach the
            frontend bundle or analyst accounts.
          </p>
          <p>
            These power the live integrations: <span className="text-foreground">n8n</span> for
            AI Court &amp; Recommended Rules, the <span className="text-foreground">pentest tool</span> REST
            API, and the <span className="text-foreground">SOC Assistant</span> chatbot.
          </p>
          <p>
            For <span className="text-foreground">OpenRouter</span>, paste your{" "}
            <span className="text-foreground">sk-or-v1-…</span> key and a model id like{" "}
            <span className="text-foreground">openai/gpt-4o-mini</span> or{" "}
            <span className="text-foreground">anthropic/claude-sonnet-4</span> (see{" "}
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              openrouter.ai/models
            </a>
            ).
          </p>
        </CardContent>
      </Card>
    </div>
    </AdminTabLoader>
  );
}
