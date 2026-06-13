import { useState } from "react";
import { Code2, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useCreateRule } from "@/lib/api";
import type { RuleCategory, Severity } from "@/lib/types";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const CATEGORIES: { value: RuleCategory; label: string }[] = [
  { value: "incident-response", label: "Incident Response" },
  { value: "ad", label: "Active Directory" },
];

const TEMPLATE = `title:
id:
status: experimental
description:
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\example.exe'
  condition: selection
level: medium
tags:
  - attack.execution
  - attack.t1059`;

export function NewRuleDialog({
  defaultCategory = "incident-response",
}: {
  defaultCategory?: RuleCategory;
}) {
  const create = useCreateRule();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [category, setCategory] = useState<RuleCategory>(defaultCategory);
  const [sigma, setSigma] = useState(TEMPLATE);

  const reset = () => {
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setCategory(defaultCategory);
    setSigma(TEMPLATE);
  };

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    if (!sigma.trim()) {
      toast.error("Sigma rule body required");
      return;
    }
    try {
      const rule = await create.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        severity,
        category,
        sigma,
      });
      toast.success(`Sigma rule ${rule.id} created`, {
        description: "Stored as pending — review and approve it.",
      });
      reset();
      setOpen(false);
    } catch (e) {
      toast.error("Could not create rule", { description: String((e as Error).message) });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setCategory(defaultCategory);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New Sigma Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" /> Author a Sigma Rule
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Suspicious WMI process creation" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this rule detect?" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Severity</label>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`rounded-md border px-3 py-1 text-xs capitalize transition-colors ${
                    severity === s
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Category (AI node)</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                    category === c.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <Code2 className="h-3.5 w-3.5" /> Sigma Rule (YAML)
            </label>
            <Textarea
              value={sigma}
              onChange={(e) => setSigma(e.target.value)}
              className="min-h-[280px] font-mono text-xs"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create rule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
