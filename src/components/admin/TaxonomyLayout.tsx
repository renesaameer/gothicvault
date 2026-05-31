import { NavLink, Outlet } from "react-router-dom";
import { PageHeader } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/admin/taxonomy/categories", label: "Categories" },
  { to: "/admin/taxonomy/tags", label: "Tags" },
  { to: "/admin/taxonomy/brands", label: "Brands" },
];

const TaxonomyLayout = () => (
  <div>
    <PageHeader title="Taxonomy" subtitle="Organize your catalog" />

    <div className="mb-5 -mx-1 px-1 overflow-x-auto">
      <div
        className="inline-flex items-center gap-1 p-1 rounded-xl min-w-full sm:min-w-0 sm:w-fit"
        style={{ background: "hsl(var(--a-sunken))" }}
      >
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => cn(
              "flex-1 sm:flex-none px-4 h-8 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center",
              isActive
                ? "bg-[hsl(var(--a-surface))] text-[hsl(var(--a-ink))] shadow-[var(--a-shadow-ring),var(--a-shadow-xs)]"
                : "text-[hsl(var(--a-muted))] hover:text-[hsl(var(--a-ink))]"
            )}
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>

    <Outlet />
  </div>
);

export default TaxonomyLayout;
