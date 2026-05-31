import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Section, FormRow, StickyActionBar } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";
import IconCropper from "@/components/admin/IconCropper";

interface SocialLink { platform: string; url: string; enabled: boolean; icon_url?: string | null; }
interface FooterLink { label: string; url: string; }

const SocialRow = ({ link, onChange, onRemove }: { link: SocialLink; onChange: (field: keyof SocialLink, value: any) => void; onRemove: () => void; }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PNG, JPG, SVG, or WebP image.", variant: "destructive" });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // SVGs can't be cropped on canvas reliably — upload as-is
    if (file.type === "image/svg+xml") {
      uploadFile(file, "svg");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const uploadFile = async (file: File | Blob, ext: string) => {
    setUploading(true);
    try {
      const fileName = `social-icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(fileName, file, {
        contentType: (file as File).type || `image/${ext}`,
        cacheControl: "3600",
      });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(fileName);
      onChange("icon_url", data.publicUrl);
      toast({ title: "Icon uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Could not upload icon. Check that the media bucket exists and is public.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleCropped = async (blob: Blob) => {
    setCropSrc(null);
    await uploadFile(blob, "png");
  };

  return (
    <div className="rounded-xl border border-border/40 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Input className="h-11 w-28 sm:w-32" value={link.platform} onChange={(e) => onChange("platform", e.target.value)} placeholder="instagram" />
        <Input className="h-11 flex-1 min-w-[180px]" value={link.url} onChange={(e) => onChange("url", e.target.value)} placeholder="https://..." />
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-11 w-11 p-0 text-destructive hover:text-destructive shrink-0"><Trash2 size={14} /></Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {link.icon_url ? (
            <div className="w-10 h-10 rounded-full bg-background border border-border/60 flex items-center justify-center overflow-hidden">
              <img src={link.icon_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted/40 border border-dashed border-border/60 flex items-center justify-center text-[10px] text-muted-foreground/50 uppercase">
              {(link.platform || "?").slice(0, 2)}
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handlePick} className="hidden" />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="h-9 text-[12px]">
            {uploading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Upload size={12} className="mr-1" />}
            {link.icon_url ? "Change" : "Upload"}
          </Button>
          {link.icon_url && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("icon_url", "")} className="h-9 text-[12px] text-muted-foreground">Clear</Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Show</span>
          <Switch checked={link.enabled} onCheckedChange={(v) => onChange("enabled", v)} />
        </div>
      </div>
      <IconCropper open={!!cropSrc} imageSrc={cropSrc} onCancel={() => setCropSrc(null)} onCrop={handleCropped} />
    </div>
  );
};

const FooterEditor = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(settings);

  const load = () => {
    supabase
      .from("footer_settings" as any)
      .select("*")
      .eq("id", "default")
      .single()
      .then(({ data }) => {
        setSettings(data);
        rebase(data);
        setLoading(false);
      });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("footer_settings" as any)
      .update({ ...settings, updated_at: new Date().toISOString() } as any)
      .eq("id", "default");
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { rebase(settings); toast({ title: "Footer saved" }); }
  };

  const updateField = (key: string, value: any) => setSettings((p: any) => ({ ...p, [key]: value }));
  const updateSocial = (idx: number, field: string, value: any) => {
    const links = [...(settings.social_links || [])];
    links[idx] = { ...links[idx], [field]: value };
    updateField("social_links", links);
  };
  const addSocial = () => updateField("social_links", [...(settings.social_links || []), { platform: "tiktok", url: "", enabled: true, icon_url: "" }]);
  const removeSocial = (idx: number) => updateField("social_links", (settings.social_links || []).filter((_: any, i: number) => i !== idx));
  const updateLink = (key: string, idx: number, field: string, value: string) => {
    const links = [...(settings[key] || [])];
    links[idx] = { ...links[idx], [field]: value };
    updateField(key, links);
  };
  const addLink = (key: string) => updateField(key, [...(settings[key] || []), { label: "", url: "/" }]);
  const removeLink = (key: string, idx: number) => updateField(key, (settings[key] || []).filter((_: any, i: number) => i !== idx));

  if (loading || !settings) return <Skeleton className="h-96 max-w-2xl rounded-2xl" />;

  const renderLinkList = (key: string, title: string) => (
    <Section
      title={title}
      actions={
        <Button variant="outline" size="sm" className="h-9" onClick={() => addLink(key)}>
          <Plus size={14} className="mr-1" /> Add
        </Button>
      }
    >
      {(settings[key] || []).length === 0 ? (
        <p className="text-[12px] text-muted-foreground/60 py-2">No links yet.</p>
      ) : (
        <div className="space-y-2">
          {(settings[key] || []).map((link: FooterLink, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <Input className="h-11 w-28 sm:w-32" value={link.label} onChange={(e) => updateLink(key, idx, "label", e.target.value)} placeholder="Label" />
              <Input className="h-11 flex-1" value={link.url} onChange={(e) => updateLink(key, idx, "url", e.target.value)} placeholder="/path" />
              <Button variant="ghost" size="sm" onClick={() => removeLink(key, idx)} className="h-11 w-11 p-0 text-destructive hover:text-destructive shrink-0"><Trash2 size={14} /></Button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );

  return (
    <div className="max-w-2xl space-y-5 pb-20">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Footer</h1>}

      <Section title="Brand info">
        <div className="space-y-4">
          <FormRow label="Store name">
            <Input className="h-11" value={settings.store_name || ""} onChange={(e) => updateField("store_name", e.target.value)} />
          </FormRow>
          <FormRow label="Description">
            <Textarea value={settings.description || ""} onChange={(e) => updateField("description", e.target.value)} rows={3} />
          </FormRow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow label="Email">
              <Input className="h-11" type="email" value={settings.email || ""} onChange={(e) => updateField("email", e.target.value)} />
            </FormRow>
            <FormRow label="Phone">
              <Input className="h-11" inputMode="tel" value={settings.phone || ""} onChange={(e) => updateField("phone", e.target.value)} />
            </FormRow>
          </div>
          <FormRow label="Address">
            <Input className="h-11" value={settings.address || ""} onChange={(e) => updateField("address", e.target.value)} />
          </FormRow>
          <FormRow label="Copyright text" hint="Use {year} to insert the current year automatically.">
            <Input className="h-11" value={settings.copyright_text || ""} onChange={(e) => updateField("copyright_text", e.target.value)} placeholder="© {year} Your store" />
          </FormRow>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Show newsletter form</span>
            <Switch checked={settings.newsletter_enabled ?? true} onCheckedChange={(v) => updateField("newsletter_enabled", v)} />
          </div>
        </div>
      </Section>

      <Section
        title="Social links"
        description="Icons displayed in the footer"
        actions={
          <Button variant="outline" size="sm" className="h-9" onClick={addSocial}>
            <Plus size={14} className="mr-1" /> Add
          </Button>
        }
      >
        {(settings.social_links || []).length === 0 ? (
          <p className="text-[12px] text-muted-foreground/60 py-2">No social links yet.</p>
        ) : (
          <div className="space-y-2">
            {(settings.social_links || []).map((link: SocialLink, idx: number) => (
              <SocialRow
                key={idx}
                link={link}
                onChange={(field, value) => updateSocial(idx, field, value)}
                onRemove={() => removeSocial(idx)}
              />
            ))}
          </div>
        )}
      </Section>

      {renderLinkList("quick_links", "Quick links")}
      {renderLinkList("customer_care_links", "Customer care links")}

      <StickyActionBar visible={dirty} message="Unsaved footer changes">
        <Button size="sm" variant="ghost" onClick={load} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default FooterEditor;
