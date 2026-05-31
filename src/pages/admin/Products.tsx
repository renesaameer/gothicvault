import React, { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminProducts, useDeleteProduct, useToggleProductField, adminKeys } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag, Package, Save, GripVertical } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TabRow } from "@/components/admin/products/TabsEditor";
import type { FaqRow } from "@/components/admin/products/FaqsEditor";

const ImageUpload = lazy(() => import("@/components/admin/ImageUpload"));
const VariantsEditor = lazy(() => import("@/components/admin/products/VariantsEditor"));
const TabsEditor = lazy(() => import("@/components/admin/products/TabsEditor"));
const FaqsEditor = lazy(() => import("@/components/admin/products/FaqsEditor"));
const DisplaySettings = lazy(() => import("@/components/admin/products/DisplaySettings"));
const EditorFallback = () => <div className="h-20 rounded-lg bg-muted/40 animate-pulse" />;
import {
  type OptionGroup,
  type VariantRow,
} from "@/lib/variants";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  base_price: number;
  compare_price: number | null;
  status: "draft" | "active" | "archived";
  is_new_arrival: boolean;
  stock: number;
  featured: boolean;
  best_seller: boolean;
  images: string[];
  slug: string;
  short_description: string | null;
  description: string | null;
  sku: string | null;
  category_id: string | null;
  brand_id: string | null;
  rating: number;
  review_count: number;
  show_shipping_info: boolean;
  show_stock_status: boolean;
  show_offers: boolean;
}

interface ProductOffer {
  id?: string;
  product_id?: string;
  offer_type: string;
  buy_quantity: number | null;
  get_quantity: number | null;
  discount_value: number | null;
  free_product_id: string | null;
  display_text: string;
  enabled: boolean;
  sort_order: number;
}

const offerTypes = [
  { value: "buy_x_get_y_same", label: "Buy X Get Y Free (Same Product)" },
  { value: "buy_x_get_y_diff", label: "Buy X Get Different Product Free" },
  { value: "buy_x_get_off", label: `Buy X Get ${CURRENCY_SYMBOL} Off` },
  { value: "flat_percent", label: "Flat Percentage Off" },
  { value: "free_delivery", label: "Free Delivery" },
  { value: "buy_x_get_y_free_delivery", label: "Buy X Get Y Free + Free Delivery" },
];

const emptyProduct: Omit<ProductRow, "id"> = {
  name: "", price: 0, sale_price: null, base_price: 0, compare_price: null,
  status: "draft", is_new_arrival: false,
  stock: 0, featured: false, best_seller: false,
  images: [], slug: "", short_description: "", description: null,
  sku: "", category_id: null, brand_id: null,
  rating: 0, review_count: 0,
  show_shipping_info: true, show_stock_status: true, show_offers: true,
};

const FieldLabel = ({ children, hint, required }: { children: React.ReactNode; hint?: string; required?: boolean }) => (
  <div className="mb-2">
    <label className="text-[13px] font-medium text-foreground/90 leading-tight">
      {children}{required && <span className="text-destructive/70 ml-0.5">*</span>}
    </label>
    {hint && <p className="text-[11px] text-muted-foreground/55 mt-1 leading-relaxed">{hint}</p>}
  </div>
);

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      "bg-background rounded-2xl border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 space-y-5",
      className,
    )}
  >
    {children}
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="-mb-1">
    <h3 className="text-[14px] font-semibold text-foreground tracking-tight">{title}</h3>
    {subtitle && <p className="text-[12px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
  </div>
);

const Products = () => {
  const { data: productsData, isLoading: loading } = useAdminProducts();
  const products = (productsData ?? []) as unknown as ProductRow[];
  const qc = useQueryClient();
  const deleteProductMutation = useDeleteProduct();
  const toggleFieldMutation = useToggleProductField();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([]);
  const [tabs, setTabs] = useState<TabRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ customer_name: "", rating: 5, review: "" });
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allTags, setAllTags] = useState<{ id: string; name: string; type: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { toast } = useToast();

  // ── Drag & drop reordering ─────────────────────────────
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const persistOrder = async (orderedIds: string[]) => {
    // Optimistically update cache so UI stays in new order during save.
    qc.setQueryData(adminKeys.products, (old: any) => {
      if (!Array.isArray(old)) return old;
      const map = new Map(old.map((p: any) => [p.id, p]));
      return orderedIds.map((id, i) => ({ ...(map.get(id) as any), sort_order: i }));
    });
    // Persist all rows in parallel.
    await Promise.all(
      orderedIds.map((id, i) => supabase.from("products").update({ sort_order: i }).eq("id", id))
    );
    qc.invalidateQueries({ queryKey: adminKeys.products });
  };
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const ids = products.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    setDragId(null);
    setOverId(null);
    persistOrder(next);
  };

  const [offersDialogProduct, setOffersDialogProduct] = useState<ProductRow | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [newOffer, setNewOffer] = useState<ProductOffer>({
    offer_type: "buy_x_get_y_same", buy_quantity: 3, get_quantity: 1, discount_value: null,
    free_product_id: null, display_text: "Buy 3 Get 1 Free!", enabled: true, sort_order: 0,
  });

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("id, name").order("sort_order"),
      supabase.from("brands").select("id, name").order("sort_order"),
      supabase.from("tags").select("id, name, type").order("type").order("sort_order"),
    ]).then(([cRes, bRes, tRes]) => {
      setCategories(cRes.data ?? []);
      setBrands(bRes.data ?? []);
      setAllTags((tRes.data ?? []) as any);
    });
  }, []);

  const startEdit = async (product: ProductRow) => {
    setEditing(product);
    setIsNew(false);
    const [tabsRes, faqsRes, reviewsRes, variantsRes, mediaRes, tagsRes] = await Promise.all([
      supabase.from("product_tabs").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("product_faqs").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("reviews").select("*").eq("product_id", product.id).order("created_at", { ascending: false }),
      supabase.from("product_variants").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("product_media").select("image_url, sort_order").eq("product_id", product.id).is("variant_id", null).order("sort_order"),
      supabase.from("product_tags").select("tag_id").eq("product_id", product.id),
    ]);
    setTabs((tabsRes.data ?? []) as TabRow[]);
    setFaqs((faqsRes.data ?? []) as FaqRow[]);
    setReviews(reviewsRes.data ?? []);
    const images = (mediaRes.data ?? []).map((m: any) => m.image_url);
    setEditing({ ...product, images });
    setSelectedTagIds(((tagsRes.data ?? []) as any[]).map((t) => t.tag_id));
    const rows = (variantsRes.data ?? []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      option_values: (r.option_values || {}) as Record<string, string>,
      price: Number(r.price ?? 0),
      sale_price: r.sale_price != null ? Number(r.sale_price) : null,
      stock: Number(r.stock ?? 0),
      sku: r.sku ?? "",
      active: r.active !== false,
      sort_order: Number(r.sort_order ?? 0),
      image_url: r.image_url ?? null,
    }));

    setVariantRows(rows);
    setOriginalVariantIds(rows.map((r) => r.id!).filter(Boolean));
    // Derive option groups from existing variants
    const derivedGroups: Record<string, Set<string>> = {};
    rows.forEach((r) => {
      Object.entries(r.option_values || {}).forEach(([k, v]) => {
        (derivedGroups[k] ||= new Set()).add(String(v));
      });
    });
    setOptionGroups(
      Object.entries(derivedGroups).map(([name, values]) => ({
        name, values: [...values], type: "text" as const, show_on_card: true,
      }))
    );
  };

  const startNew = () => {
    setEditing({ id: "", ...emptyProduct } as ProductRow);
    setIsNew(true);
    setOptionGroups([]);
    setVariantRows([]);
    setOriginalVariantIds([]);
    setTabs([]);
    setFaqs([]);
    setReviews([]);
    setSelectedTagIds([]);
  };

  const closeEditor = () => {
    setEditing(null); setIsNew(false);
    setTabs([]); setFaqs([]); setOptionGroups([]); setVariantRows([]); setOriginalVariantIds([]);
    setSelectedTagIds([]);
  };

  const handleSave = async () => {
    if (!editing || saving) return;
    if (!editing.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug =
      editing.slug?.trim() ||
      editing.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const basePrice = Number(editing.base_price ?? editing.price) || 0;
    const comparePrice = editing.compare_price != null ? Number(editing.compare_price) : (editing.sale_price != null ? Number(editing.sale_price) : null);

    // Strict whitelist matching real DB columns (post-rebuild)
    const payload = {
      name: editing.name.trim(),
      slug,
      base_price: basePrice,
      compare_price: comparePrice,
      status: editing.status ?? "draft",
      is_new_arrival: !!editing.is_new_arrival,
      stock: Number(editing.stock) || 0,
      featured: !!editing.featured,
      best_seller: !!editing.best_seller,
      short_description: editing.short_description,
      description: editing.description,
      sku: editing.sku,
      category_id: editing.category_id,
      brand_id: editing.brand_id,
      rating: Number(editing.rating) || 0,
      review_count: Number(editing.review_count) || 0,
      show_shipping_info: editing.show_shipping_info !== false,
      show_stock_status: editing.show_stock_status !== false,
      show_offers: editing.show_offers !== false,
    };

    try {
      let productId = editing.id;
      if (isNew) {
        const { data: maxRow } = await supabase
          .from("products").select("sort_order")
          .order("sort_order", { ascending: false }).limit(1).maybeSingle();
        const nextSort = ((maxRow as any)?.sort_order ?? -1) + 1;
        const { data, error } = await supabase.from("products").insert({ ...payload, sort_order: nextSort } as any).select("id").single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload as any).eq("id", editing.id);
        if (error) throw error;
      }

      // ── Diff product_variants rows ──────────────────────
      const keptIds = variantRows.map((r) => r.id).filter(Boolean) as string[];
      const toDeleteVariants = originalVariantIds.filter((id) => !keptIds.includes(id));
      const toInsertVariants = variantRows
        .map((r, i) => ({ ...r, sort_order: i }))
        .filter((r) => !r.id)
        .map((r) => ({
          product_id: productId,
          option_values: r.option_values,
          price: r.price,
          sale_price: r.sale_price,
          stock: r.stock,
          sku: r.sku,
          active: r.active,
          sort_order: r.sort_order,
          image_url: r.image_url ?? null,
        }));

      const toUpdateVariants = variantRows
        .map((r, i) => ({ ...r, sort_order: i }))
        .filter((r) => r.id);

      const variantOps: PromiseLike<any>[] = [];
      if (toDeleteVariants.length > 0)
        variantOps.push(supabase.from("product_variants").delete().in("id", toDeleteVariants));
      if (toInsertVariants.length > 0)
        variantOps.push(supabase.from("product_variants").insert(toInsertVariants as any));
      for (const r of toUpdateVariants) {
        variantOps.push(
          supabase
            .from("product_variants")
            .update({
              option_values: r.option_values,
              price: r.price,
              sale_price: r.sale_price,
              stock: r.stock,
              sku: r.sku,
              active: r.active,
              sort_order: r.sort_order,
              image_url: r.image_url ?? null,
            } as any)
            .eq("id", r.id!)

        );
      }
      const variantResults = await Promise.all(variantOps);
      for (const res of variantResults) {
        if (res?.error) throw res.error;
      }

      // ── Diff tabs ──
      const tabsToDelete = tabs.filter((t) => t._deleted && t.id);
      const tabsToInsert = tabs.filter((t) => t._isNew && !t._deleted);
      const tabsToUpdate = tabs.filter((t) => !t._isNew && !t._deleted && t.id);
      const tabOps: PromiseLike<any>[] = [];
      if (tabsToDelete.length > 0)
        tabOps.push(supabase.from("product_tabs").delete().in("id", tabsToDelete.map((t) => t.id!)));
      if (tabsToInsert.length > 0)
        tabOps.push(
          supabase.from("product_tabs").insert(
            tabsToInsert.map((t, i) => ({
              product_id: productId,
              title: t.title,
              content: t.content,
              display_style: t.display_style || "text",
              sort_order: i,
            }))
          )
        );
      for (const t of tabsToUpdate) {
        tabOps.push(
          supabase
            .from("product_tabs")
            .update({
              title: t.title,
              content: t.content,
              display_style: t.display_style || "text",
              sort_order: t.sort_order,
            })
            .eq("id", t.id!)
        );
      }

      // ── Diff FAQs ──
      const faqsToDelete = faqs.filter((f) => f._deleted && f.id);
      const faqsToInsert = faqs.filter((f) => f._isNew && !f._deleted);
      const faqsToUpdate = faqs.filter((f) => !f._isNew && !f._deleted && f.id);
      const faqOps: PromiseLike<any>[] = [];
      if (faqsToDelete.length > 0)
        faqOps.push(supabase.from("product_faqs").delete().in("id", faqsToDelete.map((f) => f.id!)));
      if (faqsToInsert.length > 0)
        faqOps.push(
          supabase.from("product_faqs").insert(
            faqsToInsert.map((f, i) => ({
              product_id: productId,
              question: f.question,
              answer: f.answer,
              sort_order: i,
            }))
          )
        );
      for (const f of faqsToUpdate) {
        faqOps.push(
          supabase
            .from("product_faqs")
            .update({ question: f.question, answer: f.answer, sort_order: f.sort_order })
            .eq("id", f.id!)
        );
      }

      const otherResults = await Promise.all([...tabOps, ...faqOps]);
      for (const res of otherResults) {
        if (res?.error) throw res.error;
      }

      // ── Replace product_media (product-level images only) ──
      await supabase.from("product_media").delete().eq("product_id", productId).is("variant_id", null);
      const newImages = editing.images ?? [];
      if (newImages.length > 0) {
        await supabase.from("product_media").insert(
          newImages.map((url, i) => ({ product_id: productId, image_url: url, sort_order: i, type: "image" as const }))
        );
      }

      // ── Replace product_tags ──
      await supabase.from("product_tags").delete().eq("product_id", productId);
      if (selectedTagIds.length > 0) {
        await supabase.from("product_tags").insert(
          selectedTagIds.map((tag_id) => ({ product_id: productId, tag_id }))
        );
      }
      toast({ title: isNew ? "Product created" : "Product saved" });
      qc.invalidateQueries({ queryKey: adminKeys.products });
      closeEditor();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product? This will also remove its variants.")) return;
    deleteProductMutation.mutate(id);
    toast({ title: "Product deleted" });
  };

  const toggleField = (id: string, field: "featured" | "best_seller", value: boolean) => {
    toggleFieldMutation.mutate({ id, field, value });
  };

  // ── offers dialog ─────────────────────────────────────
  const openOffers = async (product: ProductRow) => {
    setOffersDialogProduct(product);
    const { data } = await supabase
      .from("product_offers")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order");
    setOffers((data as ProductOffer[]) ?? []);
    resetNewOffer();
  };
  const resetNewOffer = () =>
    setNewOffer({
      offer_type: "buy_x_get_y_same", buy_quantity: 3, get_quantity: 1, discount_value: null,
      free_product_id: null, display_text: "Buy 3 Get 1 Free!", enabled: true, sort_order: 0,
    });
  const generateDisplayText = (o: typeof newOffer) => {
    switch (o.offer_type) {
      case "buy_x_get_y_same": return `Buy ${o.buy_quantity} Get ${o.get_quantity} Free!`;
      case "buy_x_get_y_diff": return `Buy ${o.buy_quantity} Get a Free Gift!`;
      case "buy_x_get_off": return `Buy ${o.buy_quantity} Get ${CURRENCY_SYMBOL}${o.discount_value} Off!`;
      case "flat_percent": return `${o.discount_value}% Off!`;
      case "free_delivery": return `Free Delivery on orders above ${CURRENCY_SYMBOL}${o.discount_value}`;
      case "buy_x_get_y_free_delivery": return `Buy ${o.buy_quantity} Get ${o.get_quantity} Free + Free Delivery!`;
      default: return "";
    }
  };
  const handleOfferTypeChange = (type: string) => {
    const u = { ...newOffer, offer_type: type };
    u.display_text = generateDisplayText(u);
    setNewOffer(u);
  };
  const addOffer = async () => {
    if (!offersDialogProduct) return;
    const { error } = await supabase.from("product_offers").insert({
      product_id: offersDialogProduct.id,
      offer_type: newOffer.offer_type,
      buy_quantity: newOffer.buy_quantity,
      get_quantity: newOffer.get_quantity,
      discount_value: newOffer.discount_value,
      free_product_id: newOffer.free_product_id,
      display_text: newOffer.display_text,
      enabled: true,
      sort_order: offers.length,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Offer added" });
    openOffers(offersDialogProduct);
  };
  const deleteOffer = async (id: string) => {
    await supabase.from("product_offers").delete().eq("id", id);
    setOffers(offers.filter((o) => o.id !== id));
    toast({ title: "Offer removed" });
  };
  const toggleOffer = async (id: string, enabled: boolean) => {
    await supabase.from("product_offers").update({ enabled }).eq("id", id);
    setOffers(offers.map((o) => (o.id === id ? { ...o, enabled } : o)));
  };

  // ─────────────────────────────────────────────────────
  // EDITOR VIEW
  // ─────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Sticky header */}
        <div
          className="flex items-center justify-between mb-5 sticky top-0 z-10 backdrop-blur-xl py-4 -mt-4 px-1"
          style={{ backgroundColor: "hsl(var(--muted) / 0.85)" }}
        >
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              {isNew ? "New Product" : "Edit Product"}
            </h1>
            {!isNew && (
              <p className="text-[11px] text-muted-foreground/40 mt-0.5 truncate max-w-[280px]">
                {editing.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={closeEditor} className="rounded-xl text-[12px] h-9 px-4 text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl gap-1.5 text-[12px] h-9 px-5">
              <Save size={13} /> {saving ? "Saving…" : isNew ? "Create" : "Save"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 rounded-xl mb-5 h-10 p-0.5 gap-0.5 overflow-x-auto flex-nowrap snap-x">
            <TabsTrigger value="general" className="rounded-[10px] text-[12px] data-[state=active]:shadow-sm px-3.5 h-9 snap-start">General</TabsTrigger>
            <TabsTrigger value="media" className="rounded-[10px] text-[12px] data-[state=active]:shadow-sm px-3.5 h-9 snap-start">Media</TabsTrigger>
            <TabsTrigger value="variants" className="rounded-[10px] text-[12px] data-[state=active]:shadow-sm px-3.5 h-9 snap-start">Variants</TabsTrigger>
            <TabsTrigger value="content" className="rounded-[10px] text-[12px] data-[state=active]:shadow-sm px-3.5 h-9 snap-start">Content</TabsTrigger>
            <TabsTrigger value="display" className="rounded-[10px] text-[12px] data-[state=active]:shadow-sm px-3.5 h-9 snap-start">Display</TabsTrigger>
          </TabsList>


          {/* ── General ── */}
          <TabsContent value="general" className="space-y-4 mt-0">
            <Section>
              <div>
                <FieldLabel required>Product name</FieldLabel>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Premium Leather Tote" className="h-11" />
              </div>
              <div>
                <FieldLabel hint="Leave empty to auto-generate from name">Slug</FieldLabel>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="premium-leather-tote" className="font-mono text-[12px] text-muted-foreground h-10" />
              </div>
              <div>
                <FieldLabel hint="Shown on product cards and search results">Short description</FieldLabel>
                <Textarea
                  value={editing.short_description ?? ""}
                  onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                  placeholder="Brief product summary…"
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div>
                <FieldLabel hint="Detailed description shown on the product page">Description</FieldLabel>
                <Textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Full description…"
                  rows={5}
                  className="resize-none"
                />
              </div>
            </Section>

            <Section>
              <SectionHeader title="Organization" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={editing.category_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? null : v })}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Brand</FieldLabel>
                  <Select value={editing.brand_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, brand_id: v === "none" ? null : v })}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No brand</SelectItem>
                      {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/15">
                <div>
                  <FieldLabel hint="Canonical price (auto-syncs to legacy price)">Base price ({CURRENCY_SYMBOL})</FieldLabel>
                  <Input type="number" min="0" step="0.01" value={editing.base_price ?? 0} onChange={(e) => setEditing({ ...editing, base_price: +e.target.value })} className="h-10" />
                </div>
                <div>
                  <FieldLabel hint="Strike-through MSRP (optional)">Compare price ({CURRENCY_SYMBOL})</FieldLabel>
                  <Input type="number" min="0" step="0.01" value={editing.compare_price ?? ""} onChange={(e) => setEditing({ ...editing, compare_price: e.target.value === "" ? null : +e.target.value })} className="h-10" />
                </div>
                <div>
                  <FieldLabel>Stock</FieldLabel>
                  <Input type="number" min="0" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: +e.target.value })} className="h-10" />
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={editing.status ?? "draft"} onValueChange={(v) => setEditing({ ...editing, status: v as any })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-border/15">
                <label className="flex items-center gap-2 text-[12px] text-foreground/70 cursor-pointer">
                  <Switch checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} /> Featured
                </label>
                <label className="flex items-center gap-2 text-[12px] text-foreground/70 cursor-pointer">
                  <Switch checked={editing.best_seller} onCheckedChange={(v) => setEditing({ ...editing, best_seller: v })} /> Best seller
                </label>
                <label className="flex items-center gap-2 text-[12px] text-foreground/70 cursor-pointer">
                  <Switch checked={editing.is_new_arrival} onCheckedChange={(v) => setEditing({ ...editing, is_new_arrival: v })} /> New arrival
                </label>
              </div>
            </Section>

            {allTags.length > 0 && (
              <Section>
                <SectionHeader title="Tags" subtitle="Independent of categories — used for filtering" />
                {(["feature","material","color","style","audience"] as const).map((type) => {
                  const group = allTags.filter((t) => t.type === type);
                  if (group.length === 0) return null;
                  return (
                    <div key={type}>
                      <FieldLabel>{type}</FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {group.map((t) => {
                          const active = selectedTagIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSelectedTagIds(active ? selectedTagIds.filter((id) => id !== t.id) : [...selectedTagIds, t.id])}
                              className={cn(
                                "px-3 h-8 rounded-full text-[12px] font-medium transition border",
                                active ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border/40 hover:border-foreground/30"
                              )}
                            >
                              {t.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </Section>
            )}
          </TabsContent>

          {/* ── Media ── */}
          <TabsContent value="media" className="mt-0">
            <Section>
              <Suspense fallback={<EditorFallback />}>
                <ImageUpload
                  value={editing.images ?? []}
                  onChange={(urls) => setEditing({ ...editing, images: urls })}
                  multiple
                  label="Product Images"
                  cropAspect="4:5"
                  hint="Required 4:5 ratio · Recommended 2000 × 2500 px · Min 1000 × 1250 px · JPG/PNG"
                />
              </Suspense>
            </Section>
          </TabsContent>

          {/* ── Variants ── */}
          <TabsContent value="variants" className="mt-0">
            <Suspense fallback={<EditorFallback />}>
              <VariantsEditor
                basePrice={editing.base_price ?? editing.price ?? 0}
                baseSalePrice={editing.compare_price ?? editing.sale_price}
                baseStock={editing.stock}
                baseSku={editing.sku ?? ""}
                images={editing.images ?? []}
                onImagesChange={(imgs) => setEditing({ ...editing, images: imgs })}
                optionGroups={optionGroups}
                onOptionGroupsChange={setOptionGroups}
                variantRows={variantRows}
                onVariantRowsChange={setVariantRows}
                onBaseChange={(patch: any) => setEditing({
                  ...editing,
                  ...patch,
                  ...(patch.price != null ? { base_price: patch.price } : {}),
                  ...(patch.sale_price !== undefined ? { compare_price: patch.sale_price } : {}),
                })}
              />
            </Suspense>
          </TabsContent>

          {/* ── Content ── */}
          <TabsContent value="content" className="space-y-4 mt-0">
            <Suspense fallback={<EditorFallback />}>
              <TabsEditor tabs={tabs} onChange={setTabs} />
              <FaqsEditor faqs={faqs} onChange={setFaqs} />
            </Suspense>

            {!isNew && (
              <Section>
                <SectionHeader title="Reviews" subtitle={`${reviews.length} total`} />
                <div className="space-y-2">
                  {reviews.length === 0 && (
                    <p className="text-[12px] text-muted-foreground/40 text-center py-4">No reviews yet</p>
                  )}
                  {reviews.map((r) => (
                    <div key={r.id} className="border border-border/20 rounded-xl p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{r.customer_name} <span className="text-muted-foreground/50 ml-1">★ {r.rating}</span></p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{r.review}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        await supabase.from("reviews").delete().eq("id", r.id);
                        setReviews(reviews.filter((x) => x.id !== r.id));
                      }} className="text-muted-foreground/30 hover:text-destructive h-7 w-7 p-0"><Trash2 size={12} /></Button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/15 pt-4 space-y-2">
                  <p className="text-[11px] text-muted-foreground/50">Add a review</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Customer name" value={newReview.customer_name} onChange={(e) => setNewReview({ ...newReview, customer_name: e.target.value })} className="h-9 text-[13px]" />
                    <Input type="number" min="1" max="5" value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: +e.target.value })} className="h-9 text-[13px]" />
                    <Button size="sm" className="h-9 rounded-xl" onClick={async () => {
                      if (!newReview.customer_name || !editing.id) return;
                      const { data } = await supabase.from("reviews").insert({ product_id: editing.id, customer_name: newReview.customer_name, rating: newReview.rating, review: newReview.review }).select("*").single();
                      if (data) setReviews([data, ...reviews]);
                      setNewReview({ customer_name: "", rating: 5, review: "" });
                    }}>Add</Button>
                  </div>
                  <Textarea placeholder="Review text" value={newReview.review} onChange={(e) => setNewReview({ ...newReview, review: e.target.value })} rows={2} className="resize-none text-[13px]" />
                </div>
              </Section>
            )}
          </TabsContent>

          {/* ── Display ── */}
          <TabsContent value="display" className="mt-0">
            <Suspense fallback={<EditorFallback />}>
              <DisplaySettings
                showShippingInfo={editing.show_shipping_info !== false}
                showStockStatus={editing.show_stock_status !== false}
                showOffers={editing.show_offers !== false}
                onChange={(patch) =>
                  setEditing({
                    ...editing,
                    ...(patch.showShippingInfo != null ? { show_shipping_info: patch.showShippingInfo } : {}),
                    ...(patch.showStockStatus != null ? { show_stock_status: patch.showStockStatus } : {}),
                    ...(patch.showOffers != null ? { show_offers: patch.showOffers } : {}),
                  })
                }
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Products</h1>
          <p className="text-[13px] text-muted-foreground/60 mt-0.5">{products.length} products</p>
        </div>
        <Button size="sm" onClick={startNew} className="rounded-xl gap-1.5 text-[12px]"><Plus size={13} /> Add Product</Button>
      </div>

      {loading ? (
        <div className="bg-background rounded-2xl border border-border/40 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/20 last:border-0">
              <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/50">
          <Package size={36} className="mx-auto mb-4 opacity-20" />
          <p className="text-[14px] font-medium">No products yet</p>
          <p className="text-[13px] text-muted-foreground/40 mt-1">Add your first product to get started.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-background rounded-2xl border border-border/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="w-8 px-2 py-3.5"></th>
                    <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Product</th>
                    <th className="text-left px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Stock</th>
                    <th className="text-center px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Featured</th>
                    <th className="text-center px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Best</th>
                    <th className="text-right px-5 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      draggable
                      onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={(e) => { e.preventDefault(); if (overId !== p.id) setOverId(p.id); }}
                      onDragLeave={() => { if (overId === p.id) setOverId(null); }}
                      onDrop={(e) => { e.preventDefault(); handleDrop(p.id); }}
                      onDragEnd={() => { setDragId(null); setOverId(null); }}
                      className={cn(
                        "border-b border-border/15 last:border-0 hover:bg-muted/30 transition-colors",
                        dragId === p.id && "opacity-40",
                        overId === p.id && dragId && dragId !== p.id && "bg-primary/5 outline outline-1 outline-primary/30"
                      )}
                    >
                      <td className="px-2 py-3.5 cursor-grab active:cursor-grabbing text-muted-foreground/40">
                        <GripVertical size={14} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] && <img src={p.images[0]} alt="" className="w-11 h-11 rounded-xl object-cover" />}
                          <span className="font-medium text-foreground truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-foreground tabular-nums">
                        {CURRENCY_SYMBOL}{p.price}{p.sale_price ? <span className="text-muted-foreground/40 ml-1.5 line-through">{CURRENCY_SYMBOL}{p.sale_price}</span> : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("tabular-nums font-medium", p.stock <= 5 ? "text-destructive" : p.stock <= 20 ? "text-amber-500" : "text-foreground/70")}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Switch checked={p.featured} onCheckedChange={(v) => toggleField(p.id, "featured", v)} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Switch checked={p.best_seller} onCheckedChange={(v) => toggleField(p.id, "best_seller", v)} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => openOffers(p)} title="Offers" className="rounded-lg h-8 w-8 p-0"><Tag size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(p)} className="rounded-lg h-8 w-8 p-0"><Pencil size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive rounded-lg h-8 w-8 p-0"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {products.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); if (overId !== p.id) setOverId(p.id); }}
                onDragLeave={() => { if (overId === p.id) setOverId(null); }}
                onDrop={(e) => { e.preventDefault(); handleDrop(p.id); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={cn(
                  "bg-background rounded-2xl border border-border/40 p-4 transition-all",
                  dragId === p.id && "opacity-40",
                  overId === p.id && dragId && dragId !== p.id && "ring-2 ring-primary/40"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="cursor-grab active:cursor-grabbing text-muted-foreground/40 -ml-1"><GripVertical size={16} /></span>
                  {p.images?.[0] && <img src={p.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[12px] text-muted-foreground/60 tabular-nums">{CURRENCY_SYMBOL}{p.price} · Stock: <span className={p.stock <= 5 ? "text-destructive font-medium" : ""}>{p.stock}</span></p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                      <Switch checked={p.featured} onCheckedChange={(v) => toggleField(p.id, "featured", v)} /> Featured
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                      <Switch checked={p.best_seller} onCheckedChange={(v) => toggleField(p.id, "best_seller", v)} /> Best
                    </label>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" onClick={() => openOffers(p)} className="rounded-lg h-8 w-8 p-0"><Tag size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(p)} className="rounded-lg h-8 w-8 p-0"><Pencil size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive rounded-lg h-8 w-8 p-0"><Trash2 size={14} /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Offers Dialog */}
      <Dialog open={!!offersDialogProduct} onOpenChange={(open) => { if (!open) setOffersDialogProduct(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Offers & Deals</DialogTitle>
            <p className="text-sm text-muted-foreground">Create special offers like "Buy 3 Get 1 Free" or "Buy 3 Get {CURRENCY_SYMBOL}90 Off"</p>
          </DialogHeader>

          {offers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No offers yet</p>
          ) : (
            <div className="space-y-2">
              {offers.map((o) => (
                <div key={o.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Switch checked={o.enabled} onCheckedChange={(v) => toggleOffer(o.id!, v)} />
                    <span className="text-sm text-foreground truncate">{o.display_text}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteOffer(o.id!)} className="text-destructive hover:text-destructive flex-shrink-0"><Trash2 size={14} /></Button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Add new offer</h3>
            <Select value={newOffer.offer_type} onValueChange={handleOfferTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {offerTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {(newOffer.offer_type === "buy_x_get_y_same" || newOffer.offer_type === "buy_x_get_y_diff" || newOffer.offer_type === "buy_x_get_y_free_delivery") && (
              <div className="flex items-center gap-3 text-sm">
                <span>Buy</span>
                <Input type="number" inputMode="numeric" className="w-20" value={newOffer.buy_quantity ?? 3} onChange={(e) => { const u = { ...newOffer, buy_quantity: +e.target.value }; u.display_text = generateDisplayText(u); setNewOffer(u); }} />
                <span>get</span>
                <Input type="number" inputMode="numeric" className="w-20" value={newOffer.get_quantity ?? 1} onChange={(e) => { const u = { ...newOffer, get_quantity: +e.target.value }; u.display_text = generateDisplayText(u); setNewOffer(u); }} />
                <span>free</span>
              </div>
            )}

            {newOffer.offer_type === "buy_x_get_off" && (
              <div className="flex items-center gap-3 text-sm">
                <span>Buy</span>
                <Input type="number" inputMode="numeric" className="w-20" value={newOffer.buy_quantity ?? 3} onChange={(e) => { const u = { ...newOffer, buy_quantity: +e.target.value }; u.display_text = generateDisplayText(u); setNewOffer(u); }} />
                <span>get {CURRENCY_SYMBOL}</span>
                <Input type="number" inputMode="numeric" className="w-24" value={newOffer.discount_value ?? ""} onChange={(e) => { const u = { ...newOffer, discount_value: +e.target.value }; u.display_text = generateDisplayText(u); setNewOffer(u); }} />
                <span>off</span>
              </div>
            )}

            {newOffer.offer_type === "flat_percent" && (
              <div className="flex items-center gap-3 text-sm">
                <span>Discount</span>
                <Input type="number" inputMode="numeric" className="w-24" value={newOffer.discount_value ?? ""} onChange={(e) => { const u = { ...newOffer, discount_value: +e.target.value }; u.display_text = generateDisplayText(u); setNewOffer(u); }} />
                <span>%</span>
              </div>
            )}

            {newOffer.offer_type === "free_delivery" && (
              <div className="flex items-center gap-3 text-sm">
                <span>Min Cart Total {CURRENCY_SYMBOL}</span>
                <Input type="number" className="w-28" value={newOffer.discount_value ?? ""} onChange={(e) => { const u = { ...newOffer, discount_value: +e.target.value }; u.display_text = generateDisplayText(u); setNewOffer(u); }} />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Offer Display Text (editable)</label>
              <Input value={newOffer.display_text} onChange={(e) => setNewOffer({ ...newOffer, display_text: e.target.value })} />
            </div>

            <Button onClick={addOffer} className="w-full">Add offer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
