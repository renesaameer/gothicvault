import { useMemo } from "react";
import { ScrollScene } from "@/components/ui/scroll-scene";
import { useSearchParams, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

interface Policy { id: string; slug?: string; title: string; content: string | null; enabled: boolean; sort_order: number; updated_at: string; }

const legacyTabMap: Record<string, string> = {
  "privacy-policy": "privacy",
  privacy: "privacy",
  "shipping-policy": "shipping",
  shipping: "shipping",
  "refund-return": "returns",
  "return-exchange": "returns",
  "return": "returns",
  returns: "returns",
  refund: "refund",
  "refund-policy": "refund",
  "terms-conditions": "terms",
  "terms-of-service": "terms",
  terms: "terms",
  faq: "faq",
  faqs: "faq",
};

const Policies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab: tabParam } = useParams();

  const requestedSlug = (searchParams.get("tab") || tabParam || "").trim().toLowerCase();
  const resolvedSlug = legacyTabMap[requestedSlug] ?? requestedSlug;
  useDocumentMeta({
    title: resolvedSlug
      ? `${resolvedSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — AEROM`
      : "Policies — AEROM",
    description: "Read AEROM policies on shipping, returns, privacy and terms — clear and customer-first.",
    canonicalPath: resolvedSlug ? `/policies/${resolvedSlug}` : "/policies",
  });

  const { data: policies, isError } = useQuery<Policy[]>({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("policies").select("*").eq("enabled", true).order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Policy[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const resolvedTab = resolvedSlug;
  const activePolicy = useMemo(
    () => policies?.find((p) => p.id === resolvedTab || p.slug === resolvedTab) || (!resolvedTab ? policies?.[0] : undefined),
    [policies, resolvedTab]
  );
  const activeTab = activePolicy?.id || "";

  return (
    <div className="page-enter">
      <ScrollScene variant="cinematic" intensity={0.8}><section className="section-padding py-20 sm:py-28 text-center">
        <div className="fade-up">
          <h1 className="apple-heading-lg text-foreground mb-3">Our Policies</h1>
          <p className="apple-body max-w-2xl mx-auto mb-4">Transparency and trust are at the heart of everything we do.</p>
          <div className="premium-divider max-w-[60px] mx-auto" />
        </div>
      </section></ScrollScene>

      <ScrollScene variant="cinematic" intensity={0.8}><section className="section-padding pb-20 lg:pb-28 max-w-4xl mx-auto text-center">
        {!!policies?.length && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {policies.map((p) => (
              <button
                key={p.id}
                onClick={() => setSearchParams({ tab: p.slug ?? p.id })}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  activeTab === p.id
                    ? "bg-primary text-primary-foreground shadow-[0_2px_8px_-3px_hsl(var(--primary)/0.3)]"
                    : "bg-secondary/70 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {!policies ? (
          <div className="glass-card rounded-2xl p-5 sm:p-8 min-h-[280px] text-left" />
        ) : activePolicy ? (
          <div key={activeTab} className="fade-up glass-card rounded-2xl p-5 sm:p-8 text-left">
            <h2 className="apple-heading-sm text-foreground mb-2">{activePolicy.title}</h2>
            <p className="text-xs text-muted-foreground mb-2">Last updated: {new Date(activePolicy.updated_at).toLocaleDateString("bn-BD")}</p>
            <div className="premium-divider mb-6" />
            <div className="prose prose-sm max-w-none">
              {activePolicy.content ? (
                activePolicy.content.split("\n\n").map((paragraph, i) => {
                  if (paragraph.includes("**")) {
                    const parts = paragraph.split("**");
                    return (
                      <div key={i} className="mb-4">
                        {parts.map((part, j) =>
                          j % 2 === 1 ? (
                            <h3 key={j} className="text-base font-semibold text-foreground mt-8 mb-3">{part}</h3>
                          ) : (
                            <div key={j} className="apple-body-sm whitespace-pre-line">{part}</div>
                          )
                        )}
                      </div>
                    );
                  }
                  return <p key={i} className="apple-body-sm mb-4 whitespace-pre-line">{paragraph}</p>;
                })
              ) : (
                <p className="apple-body-sm text-muted-foreground">No content yet. Update from the admin panel.</p>
              )}
            </div>
          </div>
        ) : isError ? (
          <div className="glass-card rounded-2xl p-5 sm:p-8">
            <p className="apple-body-sm text-muted-foreground">Policies cannot be loaded at the moment.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-5 sm:p-8">
            <p className="apple-body-sm text-muted-foreground">No policies found.</p>
          </div>
        )}
      </section></ScrollScene>
    </div>
  );
};

export default Policies;
