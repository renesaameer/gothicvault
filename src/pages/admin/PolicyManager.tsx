import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Section, FormRow, StickyActionBar, EmptyState } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

const PolicyManager = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const current = policies.find((p) => p.id === active);
  const { dirty, rebase } = useDirtyForm(current);

  const load = async () => {
    const { data } = await supabase.from("policies").select("*").order("sort_order");
    const list = data ?? [];
    setPolicies(list);
    if (list.length > 0 && !active) setActive(list[0].id);
    rebase(list.find((p: any) => p.id === (active ?? list[0]?.id)));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    if (!current) return;
    setSaving(true);
    const { error } = await supabase.from("policies").update({
      title: current.title, content: current.content, enabled: current.enabled,
    }).eq("id", current.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { rebase(current); toast({ title: "Policy saved" }); }
  };

  const updatePolicy = (id: string, field: string, value: any) => {
    setPolicies((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  if (loading) return <Skeleton className="h-96 max-w-3xl rounded-2xl" />;
  if (policies.length === 0) return <EmptyState title="No policies yet" description="Add a policy in the database to manage it here." />;

  return (
    <div className="max-w-3xl space-y-5 pb-20">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Policies</h1>}

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {policies.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { setActive(p.id); rebase(p); }}
              className={`shrink-0 px-3.5 h-9 rounded-full text-[12px] font-medium transition-colors ${
                isActive ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.title}
            </button>
          );
        })}
      </div>

      {current && (
        <Section
          title={current.title || "Policy"}
          description={`Last updated: ${new Date(current.updated_at).toLocaleDateString()}`}
          actions={<Switch checked={current.enabled} onCheckedChange={(v) => updatePolicy(current.id, "enabled", v)} />}
        >
          <div className="space-y-4">
            <FormRow label="Title">
              <Input className="h-11" value={current.title} onChange={(e) => updatePolicy(current.id, "title", e.target.value)} />
            </FormRow>
            <FormRow label="Content" hint="Markdown supported.">
              <Textarea
                value={current.content}
                onChange={(e) => updatePolicy(current.id, "content", e.target.value)}
                rows={15}
                className="font-mono text-[12px]"
              />
            </FormRow>
          </div>
        </Section>
      )}

      <StickyActionBar visible={dirty} message="Unsaved policy changes">
        <Button size="sm" variant="ghost" onClick={load} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default PolicyManager;
