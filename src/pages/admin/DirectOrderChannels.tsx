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

interface Channel {
  id: string;
  enabled: boolean;
  label: string;
  identifier: string;
  message_template: string;
  sort_order: number;
}

const channelKind = (c: Channel): "whatsapp" | "messenger" => {
  const l = (c.label || "").toLowerCase();
  return l.includes("messenger") || l.includes("facebook") ? "messenger" : "whatsapp";
};

const HINT: Record<string, string> = {
  whatsapp: "WhatsApp number with country code (digits only). E.g. 8801XXXXXXXXX",
  messenger: "Facebook page username (the part after m.me/). E.g. yourpage",
};

const DirectOrderChannels = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [rows, setRows] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(rows);

  const load = () => {
    supabase.from("direct_order_channels").select("*").order("sort_order").then(({ data }) => {
      const next = (data as Channel[]) ?? [];
      setRows(next);
      rebase(next);
      setLoading(false);
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const update = (id: string, patch: Partial<Channel>) => {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const save = async () => {
    for (const c of rows) {
      if (c.enabled && !c.identifier.trim()) {
        toast({ title: `${c.label} is missing its ${channelKind(c) === "whatsapp" ? "phone number" : "username"}`, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    const ops = rows.map((c) =>
      supabase.from("direct_order_channels").update({
        enabled: c.enabled, label: c.label, identifier: c.identifier.trim(), message_template: c.message_template,
      }).eq("id", c.id)
    );
    const results = await Promise.all(ops);
    setSaving(false);
    const err = results.find((r) => r.error)?.error;
    if (err) toast({ title: "Save failed", description: err.message, variant: "destructive" });
    else { rebase(rows); toast({ title: "Channels saved" }); }
  };

  if (loading) {
    return <div className="max-w-2xl space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}</div>;
  }

  if (rows.length === 0) {
    return <EmptyState title="No direct order channels" description="Configure WhatsApp and Messenger channels in the database to enable them here." />;
  }

  return (
    <div className="max-w-2xl space-y-4 pb-20">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Direct order channels</h1>}
      {rows.map((c) => {
        const kind = channelKind(c);
        return (
          <Section
            key={c.id}
            title={kind === "whatsapp" ? "WhatsApp" : "Messenger"}
            description="Shown on the product details page."
            actions={<Switch checked={c.enabled} onCheckedChange={(v) => update(c.id, { enabled: v })} />}
          >
            <div className="space-y-4">
              <FormRow label="Button label">
                <Input className="h-11" value={c.label} onChange={(e) => update(c.id, { label: e.target.value })} />
              </FormRow>
              <FormRow
                label={kind === "whatsapp" ? "Phone number" : "Page username"}
                hint={HINT[kind]}
              >
                <Input
                  className="h-11"
                  inputMode={kind === "whatsapp" ? "tel" : "text"}
                  value={c.identifier}
                  onChange={(e) => update(c.id, { identifier: e.target.value })}
                  placeholder={HINT[kind]}
                />
              </FormRow>
              {kind === "whatsapp" && (
                <FormRow
                  label="Message template"
                  hint={"Variables: {product_name}, {product_url}"}
                >
                  <Textarea rows={2} value={c.message_template} onChange={(e) => update(c.id, { message_template: e.target.value })} />
                </FormRow>
              )}
            </div>
          </Section>
        );
      })}

      <StickyActionBar visible={dirty} message="Unsaved channel changes">
        <Button size="sm" variant="ghost" onClick={load} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default DirectOrderChannels;
