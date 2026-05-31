import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

const isImageKey = (key: string) =>
  key.includes("image") || key.includes("logo") || key.includes("photo") || key.includes("avatar") || key.includes("banner") || key.includes("icon_url") || key.includes("_url");

const AboutManager = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [sections, setSections] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSections = async () => {
    const { data } = await supabase.from("about_sections").select("*").order("sort_order");
    setSections(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchSections(); }, []);

  const updateSection = async (id: string, updates: any) => {
    const { error } = await supabase.from("about_sections").update(updates).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); fetchSections(); }
  };

  const updateContent = (section: any, key: string, value: any) => {
    setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, content: { ...s.content, [key]: value } } : s));
  };

  // Image uploads need to persist immediately — text fields still rely on the Save button.
  const saveImage = async (section: any, key: string, value: any) => {
    const newContent = { ...section.content, [key]: value };
    setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, content: newContent } : s));
    const { error } = await supabase.from("about_sections").update({ content: newContent }).eq("id", section.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Image saved" });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-3xl">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground mb-6">About page manager</h1>}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="bg-background rounded-xl border border-border">
            <div className="flex items-center justify-between px-5 py-4">
              <button className="flex items-center gap-2 text-sm font-medium text-foreground" onClick={() => setExpanded(expanded === section.id ? null : section.id)}>
                {expanded === section.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {section.title || section.id.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </button>
              <Switch checked={section.enabled} onCheckedChange={(v) => updateSection(section.id, { enabled: v })} />
            </div>
            {expanded === section.id && (
              <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                {/* Always show image upload for the section */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Section image</label>
                  <ImageUpload
                    value={typeof (section.content as any)?.image === "string" && (section.content as any).image ? [(section.content as any).image] : []}
                    onChange={(urls) => saveImage(section, "image", urls[0] || "")}
                    multiple={false}
                    label=""
                    hint="Recommended: 800 × 600 px · JPG or PNG"
                  />
                </div>
                {Object.entries(section.content as Record<string, any>).filter(([key]) => key !== "image").map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block capitalize">{key.replace(/_/g, " ")}</label>
                    {isImageKey(key) ? (
                      <ImageUpload
                        value={typeof value === "string" && value ? [value] : []}
                        onChange={(urls) => saveImage(section, key, urls[0] || "")}
                        multiple={false}
                        label=""
                      />
                    ) : typeof value === "string" && value.length > 100 ? (
                      <Textarea value={value} onChange={(e) => updateContent(section, key, e.target.value)} rows={3} />
                    ) : (
                      <Input value={String(value ?? "")} onChange={(e) => updateContent(section, key, e.target.value)} />
                    )}
                  </div>
                ))}
                <Button size="sm" onClick={() => updateSection(section.id, { content: section.content })}>Save changes</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutManager;
