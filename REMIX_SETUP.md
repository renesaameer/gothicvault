# SPEOS — Remix / Fresh Setup Guide

Get a freshly remixed or cloned copy of this project running end-to-end.

## 1. Create the database

1. Open your new Supabase project → **SQL Editor** → **New query**.
2. Open [`database/full_setup.sql`](./database/full_setup.sql) from this repo,
   copy the entire contents, paste into the editor, and click **Run**.
3. The script is idempotent — safe to re-run. It creates:
   - All tables, columns, defaults, indexes
   - The `app_role` enum and all helper functions
   - Row Level Security policies on every table
   - The `media` storage bucket + access policies
   - The `on_auth_user_created` trigger (auto-creates profile rows)
   - Default singleton rows for settings tables (shop, footer, contact,
     design, invoice, whatsapp, floating-icons, announcement bar)

The installer is generated from the modular parts in `/database/0N_*.sql`.
See [`database/README.md`](./database/README.md) for the per-section
breakdown and the `npm run db:build / db:verify / db:export` scripts.

## 2. Configure environment variables

If Lovable is connected to the new Supabase project, `.env` is populated
automatically. Otherwise, copy `.env.example` to `.env` and fill in the
three `VITE_SUPABASE_*` values from **Project Settings → API**.

## 3. Set Edge Function secrets

In the Supabase Dashboard → **Edge Functions → Manage secrets**, add:

| Secret | Source |
|---|---|
| `STEADFAST_API_KEY` | Steadfast merchant dashboard |
| `STEADFAST_SECRET_KEY` | Steadfast merchant dashboard |
| `ECOMDRIVE_API_KEY` | EcomDrive account settings |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_DB_URL`, `SUPABASE_JWKS`, and `LOVABLE_API_KEY` are managed
by the platform — do not set them manually.

## 4. Edge Functions

They deploy automatically from `supabase/functions/*` when the project
builds. No manual `supabase deploy` is required on Lovable.

## 5. Claim the admin account

1. Visit `/admin/login` on the deployed site.
2. Sign up with the email you want to use as the owner.
3. The RLS policy `"First user can claim admin"` lets the **first**
   authenticated user insert their own `user_roles` row with `admin`.
   The app does this automatically on first login.
4. All subsequent admin/staff roles are managed from `/admin/roles`.

## 6. Verify

- [ ] Storefront loads at `/`
- [ ] `/shop` lists products (will be empty until you add some)
- [ ] `/admin` loads and you have admin access
- [ ] Place a test COD order — it appears in `/admin/orders`
- [ ] Image upload works in the product editor (uses the `media` bucket)

## Troubleshooting

**"new row violates row-level security policy on user_roles"** —
You're trying to sign up after a different account already claimed admin.
Have an existing admin assign your role from `/admin/roles`.

**Edge function 401 / "missing JWT"** — Functions use signing-keys auth.
Make sure you're calling them via `supabase.functions.invoke()` so the
anon key + user JWT are attached automatically.

**Storage uploads fail** — Confirm the `media` bucket exists and is
public; re-run `database/full_setup.sql` if not.