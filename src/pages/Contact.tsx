import { useState, useMemo } from "react";
import { ScrollScene } from "@/components/ui/scroll-scene";
import { MailIcon, PhoneIcon, MapPinIcon, SendIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { trackLead } from "@/lib/trackingEvents";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ContactSettings } from "@/types/database";
import { contactFormSchema } from "@/lib/validation";
import { sanitizeMapEmbed } from "@/lib/sanitizeMapEmbed";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";


type SocialLinkItem = { label: string; url: string };

const parseSocialLinks = (value: unknown): SocialLinkItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      label: typeof item?.label === "string" ? item.label : "",
      url: typeof item?.url === "string" ? item.url : "",
    }))
    .filter((item) => item.label && item.url);
};

const defaultSettings: Partial<ContactSettings> = {
  page_title: "Get in Touch",
  page_intro: "",
  submit_button_text: "Send Message",
  phone_field_enabled: true,
  social_section_enabled: false,
  faq_shortcut_enabled: false,
  map_enabled: false,
};

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery<ContactSettings>({
    queryKey: ["contact-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (error) throw error;
      return data as ContactSettings;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const resolvedSettings = settings ?? (defaultSettings as ContactSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const parsed = contactFormSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Please check the form",
        description: parsed.error.issues[0]?.message ?? "Some fields are invalid.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ? parsed.data.phone : null,
      message: parsed.data.message,
    };

    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert(payload);
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message || "Message could not be sent. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "Thank you! We'll get back to you shortly." });
      trackLead({ email: payload.email, phone: payload.phone || undefined });
      setForm({ name: "", email: "", phone: "", message: "" });
    }
  };

  const socialLinks = useMemo(() => parseSocialLinks(resolvedSettings.social_links), [resolvedSettings.social_links]);
  const faqItems = (resolvedSettings.faq_shortcut_items as any[]) ?? [];

  useDocumentMeta({
    title: `${resolvedSettings.page_title || "Contact"} — AEROM`,
    description: resolvedSettings.page_intro || "Get in touch with AEROM",
    canonicalPath: "/contact",
  });

  

  return (
    <div className="page-enter">
      <ScrollScene variant="cinematic" intensity={0.8}><section className="section-padding py-10 sm:py-12 lg:py-14 text-center section-alt">
        <div className="fade-up max-w-3xl mx-auto">
          <h1 className="apple-heading-lg text-foreground mb-2">{resolvedSettings.page_title || "Get in Touch"}</h1>
          <p className="apple-body mb-3">{resolvedSettings.page_intro || ""}</p>
          <div className="premium-divider max-w-[60px] mx-auto" />
        </div>
      </section></ScrollScene>

      <ScrollScene variant="cinematic" intensity={0.8}><section className="section-padding py-8 sm:py-10 lg:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {resolvedSettings.phone_number && (
            <div className="fade-up glass-card rounded-xl p-4 sm:p-5 hover:-translate-y-0.5 transition-transform duration-150">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><PhoneIcon size={18} className="text-primary" /></div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium">Phone</p>
              <p className="text-sm font-medium text-foreground mt-1 break-words">{resolvedSettings.phone_number}</p>
            </div>
          )}
          {resolvedSettings.email_address && (
            <div className="fade-up glass-card rounded-xl p-4 sm:p-5 hover:-translate-y-0.5 transition-transform duration-150">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><MailIcon size={18} className="text-primary" /></div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium">Email</p>
              <p className="text-sm font-medium text-foreground mt-1 break-words">{resolvedSettings.email_address}</p>
            </div>
          )}
          {resolvedSettings.show_address && resolvedSettings.business_address && (
            <div className="fade-up glass-card rounded-xl p-4 sm:p-5 sm:col-span-2 lg:col-span-1 hover:-translate-y-0.5 transition-transform duration-150">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><MapPinIcon size={18} className="text-primary" /></div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium">Address</p>
              <p className="text-sm font-medium text-foreground mt-1 whitespace-pre-line">{resolvedSettings.business_address}</p>
            </div>
          )}
        </div>
      </section></ScrollScene>

      <ScrollScene variant="cinematic" intensity={0.8}><section className="section-padding pb-10 lg:pb-14">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 max-w-6xl mx-auto">
          <div className="fade-up glass-card rounded-2xl p-5 sm:p-6">
            <h2 className="apple-heading-sm text-foreground mb-1">Send us a message</h2>
            <div className="premium-divider max-w-[40px] mb-5" />
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input type="text" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full bg-secondary/70 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
              <input type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full bg-secondary/70 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
              {resolvedSettings.phone_field_enabled !== false && (
                <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-secondary/70 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
              )}
              <textarea placeholder="Your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5} className="w-full bg-secondary/70 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none" />
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 w-full sm:w-auto disabled:opacity-50 shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.35)]">
                <SendIcon size={16} /> {submitting ? "Sending…" : resolvedSettings.submit_button_text || "Send Message"}
              </button>
            </form>
          </div>

          <div className="fade-up space-y-5">
            {resolvedSettings.social_section_enabled && socialLinks.length > 0 && (
              <div className="glass-card rounded-2xl p-5 sm:p-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Social</h3>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {socialLinks.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5 hover:bg-primary/5 hover:border-primary/30 transition-all duration-150">
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                      <ExternalLinkIcon size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {resolvedSettings.faq_shortcut_enabled && faqItems.length > 0 && (
              <div className="glass-card rounded-2xl p-5 sm:p-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Quick answers</h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqItems.map((faq: any, i: number) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="bg-secondary/50 rounded-xl px-4 border-none">
                      <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {resolvedSettings.map_enabled && resolvedSettings.map_embed && (() => {
              const safe = sanitizeMapEmbed(resolvedSettings.map_embed);
              if (!safe) return null;
              return (
                <div className="glass-card rounded-2xl p-2 overflow-hidden" dangerouslySetInnerHTML={{ __html: safe }} />
              );
            })()}
          </div>
        </div>
      </section></ScrollScene>
    </div>
  );
};

export default Contact;
