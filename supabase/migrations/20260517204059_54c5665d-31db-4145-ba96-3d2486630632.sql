
do $$ begin create type public.category_type as enum ('category','subcategory','child'); exception when duplicate_object then null; end $$;
do $$ begin create type public.product_status as enum ('draft','active','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.tag_type as enum ('feature','material','color','style','audience'); exception when duplicate_object then null; end $$;
do $$ begin create type public.media_type as enum ('image','video','360'); exception when duplicate_object then null; end $$;

truncate table
  public.product_offers,
  public.product_tabs,
  public.product_faqs,
  public.reviews,
  public.product_variants,
  public.featured_categories,
  public.incomplete_orders
  restart identity cascade;

drop view if exists public.products_with_hierarchy cascade;
truncate table public.products restart identity cascade;
truncate table public.categories restart identity cascade;

alter table public.products
  drop column if exists images,
  drop column if exists variants,
  drop column if exists option_groups;

alter table public.products
  add column if not exists base_price numeric not null default 0,
  add column if not exists compare_price numeric,
  add column if not exists status public.product_status not null default 'draft',
  add column if not exists is_new_arrival boolean not null default false;

create or replace function public.sync_product_pricing()
returns trigger language plpgsql as $$
begin
  if NEW.base_price is null or NEW.base_price = 0 then NEW.base_price := coalesce(NEW.price, 0); end if;
  NEW.price := NEW.base_price;
  NEW.sale_price := NEW.compare_price;
  return NEW;
end $$;
drop trigger if exists trg_sync_product_pricing on public.products;
create trigger trg_sync_product_pricing before insert or update on public.products
  for each row execute function public.sync_product_pricing();

alter table public.categories
  add column if not exists level int not null default 1,
  add column if not exists category_type public.category_type not null default 'category',
  add column if not exists path text not null default '',
  add column if not exists full_slug text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists featured_image_url text,
  add column if not exists enabled boolean not null default true;

create unique index if not exists categories_full_slug_idx on public.categories(full_slug);
create index if not exists categories_parent_idx on public.categories(parent_id);

create or replace function public.maintain_category_hierarchy()
returns trigger language plpgsql as $$
declare parent_record record;
begin
  if NEW.parent_id is null then
    NEW.level := 1;
    NEW.category_type := 'category';
    NEW.path := NEW.slug;
    NEW.full_slug := NEW.slug;
  else
    select level, path into parent_record from public.categories where id = NEW.parent_id;
    if parent_record.level >= 3 then
      raise exception 'Maximum category depth is 3 (category -> subcategory -> child)';
    end if;
    NEW.level := parent_record.level + 1;
    NEW.category_type := case NEW.level when 1 then 'category'::public.category_type
                                         when 2 then 'subcategory'::public.category_type
                                         else 'child'::public.category_type end;
    NEW.path := parent_record.path || '/' || NEW.slug;
    NEW.full_slug := NEW.path;
  end if;
  return NEW;
end $$;
drop trigger if exists trg_maintain_category_hierarchy on public.categories;
create trigger trg_maintain_category_hierarchy before insert or update of slug, parent_id on public.categories
  for each row execute function public.maintain_category_hierarchy();

create or replace function public.cascade_category_path()
returns trigger language plpgsql as $$
begin
  if NEW.path is distinct from OLD.path then
    update public.categories
       set path = NEW.path || substring(path from length(OLD.path) + 1),
           full_slug = NEW.path || substring(path from length(OLD.path) + 1)
     where path like OLD.path || '/%';
  end if;
  return NEW;
end $$;
drop trigger if exists trg_cascade_category_path on public.categories;
create trigger trg_cascade_category_path after update of path on public.categories
  for each row execute function public.cascade_category_path();

alter table public.product_variants
  add column if not exists image_url text,
  add column if not exists gallery text[] not null default '{}'::text[];

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  image_url text not null,
  alt_text text,
  type public.media_type not null default 'image',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_media_product_idx on public.product_media(product_id, variant_id);

alter table public.product_media enable row level security;
drop policy if exists pub_view on public.product_media;
create policy pub_view on public.product_media for select using (true);
drop policy if exists admins_manage on public.product_media;
create policy admins_manage on public.product_media for all to authenticated
  using (public.is_admin_or_staff(auth.uid()))
  with check (public.is_admin_or_staff(auth.uid()));

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.tag_type not null,
  icon text,
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists tags_type_idx on public.tags(type);

alter table public.tags enable row level security;
drop policy if exists pub_view on public.tags;
create policy pub_view on public.tags for select using (true);
drop policy if exists admins_manage on public.tags;
create policy admins_manage on public.tags for all to authenticated
  using (public.is_admin_or_staff(auth.uid()))
  with check (public.is_admin_or_staff(auth.uid()));

create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (product_id, tag_id)
);
create index if not exists product_tags_tag_idx on public.product_tags(tag_id);

alter table public.product_tags enable row level security;
drop policy if exists pub_view on public.product_tags;
create policy pub_view on public.product_tags for select using (true);
drop policy if exists admins_manage on public.product_tags;
create policy admins_manage on public.product_tags for all to authenticated
  using (public.is_admin_or_staff(auth.uid()))
  with check (public.is_admin_or_staff(auth.uid()));

create or replace view public.products_with_hierarchy as
with cat as (
  select c.id,
         c.level,
         c.path,
         c.parent_id,
         (select parent_id from public.categories where id = c.parent_id) as grandparent_id
  from public.categories c
)
select p.*,
       p.category_id as leaf_category_id,
       case cat.level when 3 then cat.grandparent_id when 2 then cat.parent_id else cat.id end as main_category_id,
       case cat.level when 3 then cat.parent_id when 2 then cat.id else null end as sub_category_id,
       case cat.level when 3 then cat.id else null end as child_category_id,
       cat.path as category_path,
       cat.level as category_level
from public.products p
left join cat on cat.id = p.category_id;

grant select on public.products_with_hierarchy to anon, authenticated;

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_flags_idx on public.products(featured, best_seller, is_new_arrival);
