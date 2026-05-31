import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/admin/ImageUpload";
import { Section, FormRow, StickyActionBar } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

const InvoiceSettings = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(settings);

  const load = () => {
    supabase.from("invoice_settings").select("*").eq("id", "default").single().then(({ data }) => {
      setSettings(data);
      rebase(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("invoice_settings").update(settings).eq("id", "default");
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { rebase(settings); toast({ title: "Invoice settings saved" }); }
  };

  if (loading || !settings) {
    return <Skeleton className="h-64 max-w-2xl rounded-2xl" />;
  }

  const set = (patch: any) => setSettings({ ...settings, ...patch });

  return (
    <div className="max-w-2xl space-y-5 pb-20">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Invoice & receipts</h1>}

      <Section title="Business details" description="Shown at the top of every invoice and receipt">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormRow label="Store name">
            <Input className="h-11" value={settings.store_name ?? ""} onChange={(e) => set({ store_name: e.target.value })} placeholder="Your store name" />
          </FormRow>
          <FormRow label="Store phone">
            <Input className="h-11" inputMode="tel" value={settings.store_phone ?? ""} onChange={(e) => set({ store_phone: e.target.value })} placeholder="+880 1XXXXXXXXX" />
          </FormRow>
        </div>
        <div className="mt-4 space-y-4">
          <FormRow label="Store email">
            <Input className="h-11" type="email" value={settings.store_email ?? ""} onChange={(e) => set({ store_email: e.target.value })} placeholder="hello@store.com" />
          </FormRow>
          <FormRow label="Store address">
            <Textarea value={settings.store_address ?? ""} onChange={(e) => set({ store_address: e.target.value })} placeholder="Full business address" rows={2} />
          </FormRow>
          <ImageUpload
            value={settings.logo_url ? [settings.logo_url] : []}
            onChange={(urls) => set({ logo_url: urls[0] || null })}
            multiple={false}
            label="Invoice logo"
            hint="Recommended: 360 × 72 px · PNG with transparent background"
          />
        </div>
      </Section>

      <Section title="Footer & terms" description="Optional copy printed at the bottom">
        <div className="space-y-4">
          <FormRow label="Footer text">
            <Input className="h-11" value={settings.footer_text ?? ""} onChange={(e) => set({ footer_text: e.target.value })} placeholder="Thank you for your business!" />
          </FormRow>
          <FormRow label="Signature label" hint="Leave empty to hide the signature line.">
            <Input className="h-11" value={settings.signature_label ?? ""} onChange={(e) => set({ signature_label: e.target.value })} placeholder="Authorized signature" />
          </FormRow>
          <FormRow label="Terms & conditions">
            <Textarea value={settings.terms_text ?? ""} onChange={(e) => set({ terms_text: e.target.value })} placeholder="Terms printed at the bottom of invoices (optional)" rows={3} />
          </FormRow>
        </div>
      </Section>

      <StickyActionBar visible={dirty} message="Unsaved invoice settings">
        <Button size="sm" variant="ghost" onClick={load} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default InvoiceSettings;
