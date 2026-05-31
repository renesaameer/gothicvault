import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Section, FormRow, StickyActionBar } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

const DEFAULT = { enabled: false, text: "", link: "", bg_color: "#000000", text_color: "#ffffff", dismissible: true };

const AnnouncementEditor = () => {
  const [data, setData] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(data);

  const load = () => {
    supabase.from("announcement_bar").select("*").eq("id", "default").single().then(({ data: d }) => {
      if (d) { setData(d as any); rebase(d as any); }
      setLoading(false);
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("announcement_bar").update({
      enabled: data.enabled, text: data.text, link: data.link,
      bg_color: data.bg_color, text_color: data.text_color, dismissible: data.dismissible,
    } as any).eq("id", "default");
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { rebase(data); toast({ title: "Announcement bar saved" }); }
  };

  if (loading) return <Skeleton className="h-72 max-w-2xl rounded-2xl" />;

  return (
    <div className="max-w-2xl space-y-5 pb-20">
      <Section
        title="Announcement bar"
        description="Slim banner shown above the header"
        actions={<Switch checked={data.enabled} onCheckedChange={(v) => setData({ ...data, enabled: v })} />}
      >
        <div className="space-y-4">
          <FormRow label="Text">
            <Input className="h-11" value={data.text} onChange={(e) => setData({ ...data, text: e.target.value })} placeholder="🎉 Free shipping on orders over ৳1500!" />
          </FormRow>
          <FormRow label="Link" hint="Optional — make the bar clickable.">
            <Input className="h-11" value={data.link} onChange={(e) => setData({ ...data, link: e.target.value })} placeholder="/shop" />
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Background">
              <div className="flex gap-2 items-center">
                <input type="color" value={data.bg_color} onChange={(e) => setData({ ...data, bg_color: e.target.value })} className="w-11 h-11 rounded-lg border-0 cursor-pointer p-0 shrink-0" />
                <Input className="h-11 flex-1 font-mono text-[12px]" value={data.bg_color} onChange={(e) => setData({ ...data, bg_color: e.target.value })} />
              </div>
            </FormRow>
            <FormRow label="Text">
              <div className="flex gap-2 items-center">
                <input type="color" value={data.text_color} onChange={(e) => setData({ ...data, text_color: e.target.value })} className="w-11 h-11 rounded-lg border-0 cursor-pointer p-0 shrink-0" />
                <Input className="h-11 flex-1 font-mono text-[12px]" value={data.text_color} onChange={(e) => setData({ ...data, text_color: e.target.value })} />
              </div>
            </FormRow>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Allow users to dismiss</span>
            <Switch checked={data.dismissible} onCheckedChange={(v) => setData({ ...data, dismissible: v })} />
          </div>

          <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: data.bg_color, color: data.text_color }}>
            <span className="text-[12px] font-medium">{data.text || "Preview text…"}</span>
          </div>
        </div>
      </Section>

      <StickyActionBar visible={dirty} message="Unsaved announcement changes">
        <Button size="sm" variant="ghost" onClick={load} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default AnnouncementEditor;
