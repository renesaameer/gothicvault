import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminCategories, adminKeys } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChevronLeft, FolderTree } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { Section, FormRow, EmptyState } from "@/components/admin/ui";

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  parent_id: string | null;
  image_url: string | null;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface TreeNode extends Category {
  children: TreeNode[];
}

const CategoryManager = ({ hideTitle }: { hideTitle?: boolean } = {}) => {
  const { data, isLoading } = useAdminCategories();
  const categories = (data?.categories ?? []) as Category[];
  const productCounts = data?.productCounts ?? {};
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const buildTree = (cats: Category[], parentId: string | null = null): TreeNode[] => {
    return cats
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({ ...c, children: buildTree(cats, c.id) }))
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const tree = buildTree(categories);

  const handleSave = async () => {
    if (!editing) return;
    const slug = editing.slug || editing.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = {
      name: editing.name,
      slug,
      sort_order: editing.sort_order,
      parent_id: editing.parent_id,
      image_url: editing.image_url,
      featured_image_url: editing.featured_image_url,
      meta_title: editing.meta_title,
      meta_description: editing.meta_description,
    };

    try {
      if (isNew) {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
        if (error) throw error;
      }
      toast({ title: isNew ? "Category created" : "Category updated" });
      setEditing(null);
      setIsNew(false);
      qc.invalidateQueries({ queryKey: adminKeys.categories });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (cat: Category) => {
    if (productCounts[cat.id]) {
      toast({ title: "Cannot delete", description: `"${cat.name}" has ${productCounts[cat.id]} products assigned.`, variant: "destructive" });
      return;
    }
    const hasChildren = categories.some((c) => c.parent_id === cat.id);
    if (hasChildren) {
      toast({ title: "Cannot delete", description: `"${cat.name}" has subcategories. Remove them first.`, variant: "destructive" });
      return;
    }
    if (!confirm(`Delete "${cat.name}"?`)) return;
    qc.setQueryData(adminKeys.categories, (old: any) => old ? { ...old, categories: old.categories.filter((c: any) => c.id !== cat.id) } : old);
    toast({ title: "Category deleted" });
    await supabase.from("categories").delete().eq("id", cat.id);
    qc.invalidateQueries({ queryKey: adminKeys.categories });
  };

  const getParentOptions = (excludeId?: string): Category[] => {
    if (!excludeId) return categories;
    const descendants = new Set<string>();
    const collect = (id: string) => {
      descendants.add(id);
      categories.filter((c) => c.parent_id === id).forEach((c) => collect(c.id));
    };
    collect(excludeId);
    return categories.filter((c) => !descendants.has(c.id));
  };

  const getCategoryPath = (cat: Category): string => {
    const parts: string[] = [cat.name];
    let current = cat;
    while (current.parent_id) {
      const parent = categories.find((c) => c.id === current.parent_id);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
    }
    return parts.join(" → ");
  };

  const renderTree = (nodes: TreeNode[], depth = 0) => (
    <div className={depth > 0 ? "ml-3 sm:ml-4 border-l border-border/60 pl-3 sm:pl-4 mt-1" : ""}>
      {nodes.map((node) => (
        <div key={node.id}>
          <div className="group flex items-center justify-between gap-2 py-2 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition">
            <div className="flex items-center gap-2.5 min-w-0">
              {node.image_url ? (
                <img src={node.image_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-muted border border-border/60 shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/60 shrink-0 flex items-center justify-center">
                  <FolderTree size={14} className="text-muted-foreground/50" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{node.name}</div>
                <div className="text-[11px] text-muted-foreground/70 truncate">
                  /{node.slug} · {productCounts[node.id] || 0} product{(productCounts[node.id] || 0) === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(node); setIsNew(false); }}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(node)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          {node.children.length > 0 && renderTree(node.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  if (editing) {
    const parentOptions = getParentOptions(isNew ? undefined : editing.id);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1" onClick={() => { setEditing(null); setIsNew(false); }}>
            <ChevronLeft size={16} /> Back
          </Button>
          <Button size="sm" onClick={handleSave}>{isNew ? "Create" : "Save"}</Button>
        </div>

        <Section title={isNew ? "New category" : "Edit category"} description="Basic information">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Name" required>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </FormRow>
            <FormRow label="Slug" hint="Auto-generated from name if empty">
              <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto" />
            </FormRow>
            <FormRow label="Parent category" className="sm:col-span-2">
              <Select value={editing.parent_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, parent_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="No parent (top level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top level)</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{getCategoryPath(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Sort order">
              <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })} />
            </FormRow>
          </div>
        </Section>

        <Section title="Images" description="Category & featured imagery">
          <div className="grid gap-5 sm:grid-cols-2">
            <ImageUpload
              value={editing.image_url ? [editing.image_url] : []}
              onChange={(urls) => setEditing({ ...editing, image_url: urls[0] || null })}
              multiple={false}
              label="Category image"
              cropAspect="1:1"
              hint="1:1 · 1600 × 1600 px"
            />
            <ImageUpload
              value={editing.featured_image_url ? [editing.featured_image_url] : []}
              onChange={(urls) => setEditing({ ...editing, featured_image_url: urls[0] || null })}
              multiple={false}
              label="Featured image"
              cropAspect="4:5"
              hint="Optional · 4:5 · homepage card"
            />
          </div>
        </Section>

        <Section title="SEO" description="Search engine metadata">
          <div className="grid gap-4">
            <FormRow label="Meta title">
              <Input value={editing.meta_title ?? ""} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} placeholder="Optional" />
            </FormRow>
            <FormRow label="Meta description">
              <Input value={editing.meta_description ?? ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} placeholder="Optional" />
            </FormRow>
          </div>
        </Section>
      </div>
    );
  }

  return (
    <Section
      title={hideTitle ? undefined : "Categories"}
      description={hideTitle ? undefined : "Hierarchical product taxonomy"}
      actions={
        <Button size="sm" onClick={() => { setEditing({ id: "", name: "", slug: "", sort_order: 0, parent_id: null, image_url: null, featured_image_url: null, meta_title: null, meta_description: null }); setIsNew(true); }}>
          <Plus size={14} className="mr-1" /> Add
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : tree.length === 0 ? (
        <EmptyState
          icon={<FolderTree size={20} />}
          title="No categories yet"
          description="Create your first category to start organizing products."
        />
      ) : (
        renderTree(tree)
      )}
    </Section>
  );
};

export default CategoryManager;
