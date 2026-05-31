import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import type { ContactSettings } from "@/types/database";
import { Section, FormRow, StickyActionBar } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

type SocialLinkItem = { label: string; url: string };
const DEMO_SOCIAL_LINK: SocialLinkItem = { label: "Facebook", url: "https://facebook.com" };

const parseSocialLinks = (value: unknown): SocialLinkItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      label: typeof item?.label === "string" ? item.label : "",
      url: typeof item?.url === "string" ? item.url : "",
    }))
    .filter((item) => item.label || item.url);
};

const ContactManager = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(settings);

  const load = () => {
    supabase.from("contact_settings").select("*").eq("id", "default").single().then(({ data }) => {
      if (!data) { setLoading(false); return; }
      const normalizedSocial = parseSocialLinks(data.social_links);
      const next = {
        ...data,
        social_links: normalizedSocial.length > 0 ? normalizedSocial : [DEMO_SOCIAL_LINK],
      } as ContactSettings;
      setSettings(next);
      rebase(next);
      setLoading(false);
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const socialLinks = useMemo(() => parseSocialLinks(settings?.social_links), [settings?.social_links]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const payload = { ...settings, social_links: socialLinks.length > 0 ? socialLinks : [DEMO_SOCIAL_LINK] };
    const { error } = await supabase.from("contact_settings").update(payload).eq("id", "default");
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { rebase(settings); toast({ title: "Settings saved" }); }
  };

  const updateSocialLink = (index: number, key: keyof SocialLinkItem, value: string) => {
    if (!settings) return;
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [key]: value };
    setSettings({ ...settings, social_links: updated } as ContactSettings);
  };
  const addSocialLink = () => {
    if (!settings) return;
    setSettings({ ...settings, social_links: [...socialLinks, { label: "", url: "https://" }] } as ContactSettings);
  };
  const removeSocialLink = (index: number) => {
    if (!settings) return;
    const updated = socialLinks.filter((_, i) => i !== index);
    setSettings({ ...settings, social_links: updated.length > 0 ? updated : [DEMO_SOCIAL_LINK] } as ContactSettings);
  };

  if (loading || !settings) return <Skeleton className="h-96 max-w-3xl rounded-2xl" />;

  const set = (patch: Partial<ContactSettings>) => setSettings({ ...settings, ...patch });

  return (
    <div className="max-w-3xl space-y-5 pb-20">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Contact page</h1>}

      <Section title="Page content" description="Headline and intro shown on the contact page">
        <div className="space-y-4">
          <FormRow label="Page title">
            <Input className="h-11" value={settings.page_title ?? ""} onChange={(e) => set({ page_title: e.target.value })} />
          </FormRow>
          <FormRow label="Page intro">
            <Input className="h-11" value={settings.page_intro ?? ""} onChange={(e) => set({ page_intro: e.target.value })} />
          </FormRow>
        </div>
      </Section>

      <Section title="Contact form">
        <div className="space-y-4">
          <FormRow label="Receiving email" hint="Where form submissions are sent.">
            <Input className="h-11" type="email" value={settings.receiving_email ?? ""} onChange={(e) => set({ receiving_email: e.target.value })} />
          </FormRow>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Phone field</span>
            <Switch checked={settings.phone_field_enabled} onCheckedChange={(v) => set({ phone_field_enabled: v })} />
          </div>
          <FormRow label="Submit button text">
            <Input className="h-11" value={settings.submit_button_text ?? ""} onChange={(e) => set({ submit_button_text: e.target.value })} />
          </FormRow>
        </div>
      </Section>

      <Section title="Contact information">
        <div className="space-y-4">
          <FormRow label="Email address">
            <Input className="h-11" type="email" value={settings.email_address ?? ""} onChange={(e) => set({ email_address: e.target.value })} />
          </FormRow>
          <FormRow label="Phone number">
            <Input className="h-11" inputMode="tel" value={settings.phone_number ?? ""} onChange={(e) => set({ phone_number: e.target.value })} />
          </FormRow>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Show address</span>
            <Switch checked={settings.show_address} onCheckedChange={(v) => set({ show_address: v })} />
          </div>
          {settings.show_address && (
            <FormRow label="Business address">
              <Textarea value={settings.business_address ?? ""} onChange={(e) => set({ business_address: e.target.value })} rows={2} />
            </FormRow>
          )}
        </div>
      </Section>

      <Section
        title="Social links"
        description="Cards displayed on the contact page"
        actions={<Switch checked={settings.social_section_enabled} onCheckedChange={(v) => set({ social_section_enabled: v })} />}
      >
        {settings.social_section_enabled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground/60">Demo link stays if you remove all entries.</p>
              <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="h-9">
                <Plus size={12} className="mr-1" /> Add link
              </Button>
            </div>
            {socialLinks.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input className="h-11 w-28 sm:w-32" placeholder="Label" value={item.label} onChange={(e) => updateSocialLink(index, "label", e.target.value)} />
                <Input className="h-11 flex-1" placeholder="https://..." value={item.url} onChange={(e) => updateSocialLink(index, "url", e.target.value)} />
                <Button type="button" variant="ghost" size="sm" className="h-11 w-11 p-0 text-destructive hover:text-destructive shrink-0" onClick={() => removeSocialLink(index)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Map"
        actions={<Switch checked={settings.map_enabled} onCheckedChange={(v) => set({ map_enabled: v })} />}
      >
        {settings.map_enabled && (
          <FormRow label="Google Maps embed URL">
            <Input className="h-11" value={settings.map_embed ?? ""} onChange={(e) => set({ map_embed: e.target.value })} />
          </FormRow>
        )}
      </Section>

      <Section title="FAQ shortcut" actions={<Switch checked={settings.faq_shortcut_enabled} onCheckedChange={(v) => set({ faq_shortcut_enabled: v })} />}>
        <p className="text-[12px] text-muted-foreground/60">Show a “View FAQs” link below the contact form.</p>
      </Section>

      <StickyActionBar visible={dirty} message="Unsaved contact changes">
        <Button size="sm" variant="ghost" onClick={load} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default ContactManager;
