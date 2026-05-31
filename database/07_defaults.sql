-- ============================================================================
-- 07 — Default singleton rows for settings tables
-- ============================================================================

insert into public.shop_settings (id) values ('default') on conflict (id) do nothing;
insert into public.footer_settings (id, store_name, description)
  values ('default','SPEOS','Sophisticated Premium Essential for Outstanding Style') on conflict (id) do nothing;
insert into public.contact_settings (id, page_title, page_intro)
  values ('default','Contact Us','Get in touch with our team') on conflict (id) do nothing;
insert into public.design_settings (id) values ('default') on conflict (id) do nothing;
insert into public.invoice_settings (id, store_name) values ('default','SPEOS') on conflict (id) do nothing;
insert into public.whatsapp_settings (id) values ('default') on conflict (id) do nothing;
insert into public.floating_icons_settings (id) values ('default') on conflict (id) do nothing;
insert into public.announcement_bar (id) values ('default') on conflict (id) do nothing;