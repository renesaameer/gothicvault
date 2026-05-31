import { Link } from "react-router-dom";
import { ScrollScene } from "@/components/ui/scroll-scene";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
const heroBg = "/hero-bg.jpg";

interface Section { id: string; enabled: boolean; sort_order: number; content: any; }

const About = () => {
  useDocumentMeta({
    title: "About AEROM — Our Story & Craft",
    description: "Meet AEROM — a Bangladesh-based modest fashion house creating timeless abayas, khimars and modest essentials with care and craft.",
    canonicalPath: "/about",
  });
  const { data: sections } = useQuery<Section[]>({
    queryKey: ["about-sections"],
    queryFn: async () => {
      const { data } = await supabase.from("about_sections").select("*").order("sort_order");
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const getSection = (id: string) => sections?.find((s) => s.id === id);
  const isEnabled = (id: string) => getSection(id)?.enabled !== false;
  const getContent = (id: string) => (getSection(id)?.content as any) ?? {};

  const header = getContent("header");
  const story = getContent("story");
  const mv = getContent("mission_vision");
  const founder = getContent("founder");
  const values = getContent("values");
  const cta = getContent("cta");
  const valuesCards = values.cards || [];

  

  return (
    <div className="page-enter">
      {isEnabled("header") && (
        <section className="section-padding py-20 sm:py-28 text-center">
          <div className="fade-up">
            <h1 className="apple-heading-lg text-foreground mb-3">{header.title || "About Us"}</h1>
            <p className="apple-body max-w-2xl mx-auto mb-4">{header.intro || ""}</p>
            <div className="premium-divider max-w-[60px] mx-auto" />
          </div>
        </section>
      )}

      {isEnabled("story") && (
        <section className="section-padding pb-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="fade-up">
              <div className="aspect-[3/2] rounded-2xl overflow-hidden bg-secondary shadow-lg border border-border/20">
                <img src={story.image || heroBg} alt="Brand Story" className="w-full h-full object-cover" loading="lazy" decoding="async" width={600} height={400} />
              </div>
            </div>
            <div className="fade-up">
              <h2 className="apple-heading-md text-foreground mb-3">{story.headline || "Our Story"}</h2>
              <div className="premium-divider max-w-[40px] mb-6" />
              <div className="apple-body whitespace-pre-line">{story.text || ""}</div>
            </div>
          </div>
        </section>
      )}

      {isEnabled("mission_vision") && (mv.mission || mv.vision) && (
        <section className="section-padding section-spacing section-alt">
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {mv.mission && (
              <div className="fade-up glass-card rounded-2xl p-6 sm:p-8">
                <h2 className="apple-heading-sm text-foreground mb-3">Our Mission</h2>
                <div className="premium-divider max-w-[40px] mb-4" />
                <p className="apple-body whitespace-pre-line">{mv.mission}</p>
              </div>
            )}
            {mv.vision && (
              <div className="fade-up glass-card rounded-2xl p-6 sm:p-8">
                <h2 className="apple-heading-sm text-foreground mb-3">Our Vision</h2>
                <div className="premium-divider max-w-[40px] mb-4" />
                <p className="apple-body whitespace-pre-line">{mv.vision}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {isEnabled("founder") && (founder.message || founder.image) && (
        <section className="section-padding section-spacing">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="fade-up lg:order-2">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-secondary max-w-md mx-auto shadow-lg border border-border/20">
                <img src={founder.image || heroBg} alt="Founder" className="w-full h-full object-cover" loading="lazy" decoding="async" width={400} height={500} />
              </div>
            </div>
            <div className="fade-up lg:order-1">
              <h2 className="apple-heading-md text-foreground mb-3">{founder.headline || "Inspiration"}</h2>
              <div className="premium-divider max-w-[40px] mb-6" />
              <p className="apple-body whitespace-pre-line">{founder.message}</p>
            </div>
          </div>
        </section>
      )}

      {isEnabled("values") && valuesCards.length > 0 && (
        <section className="section-padding section-spacing section-alt">
          <div className="fade-up text-center mb-10">
            <h2 className="apple-heading-lg text-foreground mb-4">Our Values</h2>
            <div className="premium-divider max-w-[60px] mx-auto" />
          </div>
          <div className="fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {valuesCards.map((v: any, i: number) => (
                <div key={i} className="text-center p-6 glass-card rounded-2xl hover:-translate-y-0.5 transition-transform duration-150">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <DynamicIcon name={v.icon || "Heart"} className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="apple-body-sm">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isEnabled("cta") && (
        <section className="section-padding section-spacing text-center">
          <div className="fade-up">
            <h2 className="apple-heading-md text-foreground mb-6">{cta.text || "Find your perfect piece"}</h2>
            <Link to={cta.button_link || "/shop"} className="inline-flex items-center justify-center bg-primary text-primary-foreground px-10 py-4 rounded-full text-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.4)]">
              {cta.button_text || "Shop now"}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default About;
