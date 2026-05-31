import { Link } from "react-router-dom";

export interface FeaturedCategory {
  id: string;
  sort_order: number;
  enabled: boolean;
  title: string | null;
  image_url: string | null;
  category_id: string | null;
}

interface CategoryRef { id: string; slug: string; name: string }

const Card = ({
  cat,
  link,
  className = "",
  priority = false,
}: {
  cat: FeaturedCategory;
  link: string | null;
  className?: string;
  priority?: boolean;
}) => {
  const inner = (
    <>
      <img
        src={cat.image_url || "/placeholder.svg"}
        alt={cat.title || "Category"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white">
        <span className="inline-block text-[18px] sm:text-[22px] font-medium leading-none border-b border-current pb-1">
          {cat.title}
        </span>
      </div>
    </>
  );
  const wrapCls = `group relative overflow-hidden bg-secondary/40 ${className}`;
  return link ? (
    <Link to={link} className={wrapCls} aria-label={cat.title || undefined}>{inner}</Link>
  ) : (
    <div className={wrapCls}>{inner}</div>
  );
};

const FeaturedCategories = ({
  categories,
  categoryRefs = [],
}: {
  categories: FeaturedCategory[];
  categoryRefs?: CategoryRef[];
}) => {
  const active = (categories || []).filter((c) => c.enabled !== false).slice(0, 12);
  if (active.length === 0) return null;

  const linkFor = (c: FeaturedCategory): string | null => {
    if (!c.category_id) return "/shop";
    const ref = categoryRefs.find((r) => r.id === c.category_id);
    return ref ? `/shop?category=${ref.slug}` : "/shop";
  };

  const editorial = active.slice(0, 3);
  if (editorial.length === 3) {
    const [a, b, c] = editorial;
    return (
      <section className="w-full">
        <div className="grid md:hidden grid-cols-2 gap-px bg-background">
          <Card cat={a} link={linkFor(a)} className="col-span-2 aspect-[4/5] w-full" priority />
          <Card cat={b} link={linkFor(b)} className="aspect-[4/5] w-full" />
          <Card cat={c} link={linkFor(c)} className="aspect-[4/5] w-full" />
        </div>
        <div className="hidden md:grid grid-cols-3 gap-px bg-background">
          {editorial.map((cat, i) => (
            <Card key={cat.id} cat={cat} link={linkFor(cat)} className="aspect-[3/4] w-full" priority={i === 0} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-background">
        {active.map((cat, i) => (
          <Card key={cat.id} cat={cat} link={linkFor(cat)} className="aspect-[4/5] md:aspect-[3/4] w-full" priority={i === 0} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedCategories;
