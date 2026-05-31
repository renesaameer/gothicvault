// Helper for computing displayable price ranges from a product's variants JSONB.
// Two systems coexist:
//   1. Modern: rows in `product_variants` table (price, sale_price, stock, sku, option_values).
//   2. Legacy: `products.variants` JSONB blob — kept for backward-compat with old products.

export interface ParsedVariant {
  type: string;
  same_price: boolean;
  options: { value: string; price: number | null; image_index: number | null }[];
}

export interface OptionGroup {
  name: string;
  values: string[];
  image_map?: Record<string, number>; // option value -> image index
  type?: "text" | "color" | "image"; // visual rendering hint
  color_map?: Record<string, string>; // option value -> hex color (#RRGGBB)
  show_on_card?: boolean; // whether to render swatches/pills on the product card
}

export interface VariantRow {
  id?: string;
  product_id?: string;
  option_values: Record<string, string>;
  price: number;
  sale_price: number | null;
  stock: number;
  sku: string;
  active: boolean;
  sort_order: number;
  image_url?: string | null;
}


export function parseOptionGroups(raw: unknown): OptionGroup[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((g: any) => ({
      name: String(g?.name ?? "").trim(),
      values: Array.isArray(g?.values) ? g.values.map((v: any) => String(v ?? "").trim()).filter(Boolean) : [],
      image_map: g?.image_map && typeof g.image_map === "object" ? g.image_map : undefined,
      type: (g?.type === "color" ? "color" : "text") as "text" | "color",
      color_map: g?.color_map && typeof g.color_map === "object" ? g.color_map : undefined,
      show_on_card: g?.show_on_card !== false, // default true
    }))
    .filter((g) => g.name && g.values.length > 0);
}

/** Cartesian product of option group values → list of {Color: "Red", Size: "M"} combos. */
export function buildVariantCombinations(groups: OptionGroup[]): Record<string, string>[] {
  if (groups.length === 0) return [];
  return groups.reduce<Record<string, string>[]>(
    (acc, g) => acc.flatMap((combo) => g.values.map((v) => ({ ...combo, [g.name]: v }))),
    [{}]
  );
}

export function variantKey(values: Record<string, string>): string {
  return Object.keys(values)
    .sort()
    .map((k) => `${k}=${values[k]}`)
    .join("|");
}

/** Resolve a chosen set of option values to a concrete variant row. */
export function resolveVariantRow(
  rows: VariantRow[],
  selected: Record<string, string>
): VariantRow | null {
  if (rows.length === 0) return null;
  const want = variantKey(selected);
  return rows.find((r) => variantKey(r.option_values || {}) === want) ?? null;
}

/** Effective price for a row = sale_price if set & lower, else price. */
export function effectiveRowPrice(row: VariantRow): number {
  if (row.sale_price != null && row.sale_price > 0 && row.sale_price < row.price) return row.sale_price;
  return row.price;
}

/** Price range from real product_variants rows. */
export function getVariantRowsPriceRange(
  basePrice: number,
  rows: VariantRow[] | null | undefined
): { min: number; max: number; hasRange: boolean } {
  const active = (rows ?? []).filter((r) => r.active !== false);
  if (active.length === 0) return { min: basePrice, max: basePrice, hasRange: false };
  const prices = active.map(effectiveRowPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, hasRange: min !== max };
}

// ───────────────────────────────────────────────────────────────────────────
// Legacy helpers (kept so old products with only `products.variants` still render)
// ───────────────────────────────────────────────────────────────────────────

export function parseProductVariants(raw: unknown): ParsedVariant[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((v: any) => {
    const opts = Array.isArray(v?.options) ? v.options : [];
    return {
      type: String(v?.type || ""),
      same_price: v?.same_price !== false,
      options: opts.map((o: any) =>
        typeof o === "string"
          ? { value: o, price: null, image_index: null }
          : { value: String(o?.value ?? ""), price: o?.price ?? null, image_index: o?.image_index ?? null }
      ),
    };
  });
}

/**
 * Returns the price range for a product based on its variants.
 * - If no variants OR all variants are "same_price", returns { min: basePrice, max: basePrice, hasRange: false }.
 * - Otherwise returns the lowest and highest possible prices considering per-option overrides.
 */
export function getProductPriceRange(
  basePrice: number,
  variantsRaw: unknown
): { min: number; max: number; hasRange: boolean } {
  const variants = parseProductVariants(variantsRaw);
  const overridingGroups = variants.filter((v) => !v.same_price && v.options.some((o) => o.price != null));
  if (overridingGroups.length === 0) {
    return { min: basePrice, max: basePrice, hasRange: false };
  }
  const prices: number[] = [];
  prices.push(basePrice);
  for (const g of overridingGroups) {
    for (const o of g.options) {
      prices.push(o.price != null ? Number(o.price) : basePrice);
    }
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, hasRange: min !== max };
}
