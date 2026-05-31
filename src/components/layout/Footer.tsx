import { Link } from "react-router-dom";
import { useState } from "react";
import { useLayoutData } from "./LayoutDataProvider";
import { useToast } from "@/hooks/use-toast";
import BrandMark from "@/components/brand/BrandMark";
import { subscribeToNewsletter } from "@/lib/newsletter";

const isExternal = (url: string) => /^https?:\/\//i.test(url);

const SocialIcon = ({ link }: { link: { platform: string; url: string; icon_url?: string | null } }) => {
  const label = link.platform || "Social";
  const [imgError, setImgError] = useState(false);
  const inner = link.icon_url && !imgError ? (
    <span className="w-10 h-10 rounded-full overflow-hidden glass-button grid place-items-center">
      <img src={link.icon_url} alt={label} className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
    </span>
  ) : (
    <span className="w-10 h-10 rounded-full glass-button grid place-items-center text-[10px] font-medium uppercase tracking-[0.18em] text-foreground">
      {label.slice(0, 2)}
    </span>
  );
  return (
    <a
      href={link.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-block transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
    >
      {inner}
    </a>
  );
};

const FooterColumn = ({ title, links }: { title: string; links: { label: string; url: string }[] }) => {
  if (!links?.length) return null;
  return (
    <div>
      <h3 className="font-display text-[11px] font-semibold tracking-[0.32em] uppercase text-foreground/80 mb-5 [text-shadow:0_0_10px_rgba(200,180,235,0.25)]">{title}</h3>
      <ul className="space-y-3">
        {links.map((l, i) => (
          <li key={i}>
            {isExternal(l.url) ? (
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[14px] text-foreground/60 hover:text-foreground transition-colors duration-300">
                {l.label}
              </a>
            ) : (
              <Link to={l.url || "/"} className="text-[14px] text-foreground/60 hover:text-foreground transition-colors duration-300">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Footer = () => {
  const { footer } = useLayoutData();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const f = footer || ({} as any);
  const brandName = f.store_name || "AEROM";
  const year = new Date().getFullYear();
  const copyright = (f.copyright_text || `© {year} ${brandName}. All rights reserved.`).replace("{year}", String(year));
  const social = (f.social_links || []).filter((s: any) => s?.enabled !== false && s?.url);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const result = await subscribeToNewsletter(email);
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Could not subscribe", description: result.message, variant: "destructive" });
      return;
    }
    toast({ title: "Subscribed", description: "Thanks for joining our list." });
    setEmail("");
  };

  return (
    <ScrollScene variant="cinematic" intensity={0.9}>
    <footer className="relative bg-background text-foreground">

      {/* Chain + crystal top separator */}
      <div aria-hidden className="relative flex items-center justify-center pt-10 sm:pt-14 lg:pt-16 pb-2">
        <div className="flex-1 h-px max-w-[38%] bg-[linear-gradient(90deg,transparent,rgba(220,210,240,0.45),transparent)]" />
        <div className="mx-4 flex items-center gap-2">
          <span className="text-[rgba(210,200,235,0.65)] text-xs tracking-[0.4em]">✦</span>
          <span className="block w-3 h-3 rotate-45 bg-[linear-gradient(135deg,#d8c8f0,#7a5fa0)] shadow-[0_0_14px_rgba(180,150,230,0.6)] border border-[rgba(220,210,240,0.5)]" />
          <span className="text-[rgba(210,200,235,0.65)] text-xs tracking-[0.4em]">✦</span>
        </div>
        <div className="flex-1 h-px max-w-[38%] bg-[linear-gradient(90deg,transparent,rgba(220,210,240,0.45),transparent)]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(120,90,180,0.18),transparent_70%)]" />
      <div className="section-padding pt-2 sm:pt-4 lg:pt-6 pb-6 sm:pb-10 relative">
        <div className="glass-card p-6 sm:p-10 lg:p-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-4 lg:col-span-4">
              <Link to="/" aria-label={`${brandName} — Home`} className="inline-block">
                <BrandMark size="lg" />
              </Link>
              {f.description && (
                <p className="mt-5 text-[13px] sm:text-[14px] leading-[1.65] text-foreground/55 max-w-sm">{f.description}</p>
              )}
              {social.length > 0 && (
                <div className="mt-6 sm:mt-7 flex items-center gap-2.5 sm:gap-3">
                  {social.map((s: any, i: number) => <SocialIcon key={i} link={s} />)}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="md:col-span-2 lg:col-span-2">
              <FooterColumn title="Explore" links={f.quick_links || []} />
            </div>

            {/* Customer care */}
            <div className="md:col-span-3 lg:col-span-2">
              <FooterColumn title="Support" links={f.customer_care_links || []} />
            </div>

            {/* Stay in touch + newsletter */}
            <div className="md:col-span-3 lg:col-span-4">
              <h3 className="font-display text-[11px] font-semibold tracking-[0.32em] uppercase text-foreground/80 mb-4 sm:mb-5 [text-shadow:0_0_10px_rgba(200,180,235,0.25)]">Stay In Touch</h3>
              <ul className="space-y-2 text-[13px] sm:text-[14px] text-foreground/55">
                {f.email && (
                  <li><a href={`mailto:${f.email}`} className="hover:text-foreground transition-colors duration-300">{f.email}</a></li>
                )}
                {f.phone && (
                  <li><a href={`tel:${f.phone.replace(/\s/g, "")}`} className="hover:text-foreground transition-colors duration-300">{f.phone}</a></li>
                )}
                {f.address && <li className="leading-[1.65]">{f.address}</li>}
              </ul>

              {f.newsletter_enabled !== false && (
                <form onSubmit={handleSubscribe} className="mt-5 sm:mt-6 flex w-full max-w-md items-center gap-2">
                  <div className="flex-1 h-12 sm:h-14 px-4 sm:px-5 rounded-full glass-button flex items-center">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full bg-transparent text-[13px] sm:text-[14px] text-foreground placeholder:text-foreground/40 focus:outline-none"
                      aria-label="Email address"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-pill btn-pill-sm text-[11px] sm:text-[12px] font-medium tracking-[0.14em] uppercase disabled:opacity-60"
                  >
                    {submitting ? "…" : "Join"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Chain divider before copyright */}
          <div aria-hidden className="mt-10 sm:mt-14 flex items-center justify-center gap-3">
            <div className="flex-1 h-px bg-[linear-gradient(90deg,transparent,rgba(220,210,240,0.35),transparent)]" />
            <span className="text-[rgba(210,200,235,0.55)] text-[10px] tracking-[0.4em]">✦ ☾ ✦</span>
            <div className="flex-1 h-px bg-[linear-gradient(90deg,transparent,rgba(220,210,240,0.35),transparent)]" />
          </div>
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-center sm:text-left">
            <p className="text-[11px] sm:text-[12px] text-foreground/45 tracking-[-0.005em]">
              {copyright}
            </p>
            <p className="text-[11px] sm:text-[12px] text-foreground/45">
              Developed by{" "}
              <a
                href="https://renesaameer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/65 hover:text-foreground transition-colors duration-300"
              >
                Renesa Ameer
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
