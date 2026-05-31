
create or replace function public.sync_product_pricing()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if NEW.base_price is null or NEW.base_price = 0 then NEW.base_price := coalesce(NEW.price, 0); end if;
  NEW.price := NEW.base_price;
  NEW.sale_price := NEW.compare_price;
  return NEW;
end $$;

create or replace function public.maintain_category_hierarchy()
returns trigger language plpgsql
set search_path = public
as $$
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

create or replace function public.cascade_category_path()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if NEW.path is distinct from OLD.path then
    update public.categories
       set path = NEW.path || substring(path from length(OLD.path) + 1),
           full_slug = NEW.path || substring(path from length(OLD.path) + 1)
     where path like OLD.path || '/%';
  end if;
  return NEW;
end $$;

drop view if exists public.products_with_hierarchy cascade;
create view public.products_with_hierarchy
with (security_invoker = true) as
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
