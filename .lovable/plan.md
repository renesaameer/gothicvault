## Admin deep audit — what's actually broken

**Critical (reproduced in console + session replay):**
The entire `/admin` route is currently dead. Recharts inside `SalesChart` throws React minified error #300, the root-level `ErrorBoundary` catches it, and the whole admin layout is replaced with the "Something went wrong" screen. Reload doesn't help because the error is deterministic on mount. This blocks every admin user from reaching any page (Products, Orders, Settings — everything).

Root cause: a recharts component is being rendered before `ResponsiveContainer` has a measurable size in certain Suspense/lazy timing situations, and the throw bubbles all the way to the top-level boundary because there is no per-route boundary.

**Other issues found during audit:**

1. No per-route `ErrorBoundary` inside `AdminLayout` — any thrown error in any admin page kills the whole shell (sidebar disappears, no way to navigate away).
2. `SalesChart` uses CSS variable `hsl(var(--foreground))` for `fill`. Recharts measures colors at render time; on first mount before CSS is applied this can produce invalid props.
3. Empty data array still renders the chart (e.g. when `orders = []`) — `ResponsiveContainer` with zero-height parent during Suspense fallback swap can flip-flop and crash.
4. `AnnouncementEditor` route is not wrapped with `settingsChild` so it does not receive `hideTitle`, duplicating the title with the new SettingsLayout header.
5. `AdminLayout` reads `localStorage` synchronously inside `useState` initializer that also runs on SSR-style first paint — minor, but causes one extra layout commit when collapsed/expanded states mismatch on hydration.
6. `useAdmin` dispatches both `onAuthStateChange` initial event AND `getSession`, but the gate `initializedRef` only skips the very first event — if Supabase fires `INITIAL_SESSION` after `getSession()` resolves, both handlers run and `role` is set twice causing a brief re-render flash on every admin route change.
7. `Dashboard` `useMemo` recomputes the entire chart array on every `dateFilter` change AND any time `raw` reference changes — fine, but the skeleton block re-mounts because of `key={location.pathname}` page fade in AdminLayout; the chart is lazy-loaded again on every internal state change inside Dashboard? No — but the fade key is fine. Leave it.
8. Dead `Shield` import still in `SettingsLayout.tsx` icon list is used (for User Roles), OK. But `prefetchAdminRoutes` in `AdminLayout` no longer prefetches `Customers/Coupons/Offers` for staff path — minor.
9. `ROUTE_LOADERS` map is missing `/admin/inquiries` badge target consistency and `/admin/ecomdrive-logs` — hover prefetch silently no-ops. Low priority.

## Fix plan

### 1. Stop the admin from crashing on dashboard load (critical)

- Add a small reusable `AdminErrorBoundary` (local class component, no third-party dep) that renders a compact inline error card with a retry button instead of replacing the entire app.
- Wrap the `<Outlet />` inside `AdminLayout` with it — sidebar stays mounted, user can navigate to another page.
- Wrap `<SalesChart />` inside `Dashboard` with the same boundary so a chart failure shows "Chart unavailable — retry" without losing the rest of the dashboard.

### 2. Make `SalesChart` resilient

- Guard render: if `data.length === 0` show an `EmptyState` ("No sales in this range") instead of mounting recharts at all.
- Replace `hsl(var(--foreground))` / `hsl(var(--muted-foreground))` / `hsl(var(--border))` with concrete computed color strings via `getComputedStyle(document.documentElement).getPropertyValue('--a-ink')`-style resolution at module init (or pre-resolved hex from the design tokens), so recharts always gets valid color props.
- Wrap chart contents in a `width/height > 0` sanity check (read parent rect in a `useLayoutEffect`, skip render until measured) to avoid the zero-size first-frame crash inside `ResponsiveContainer`.

### 3. Cleanups (low risk, same pass)

- Wrap `AnnouncementEditor` route with `settingsChild(AnnouncementEditor)` and add `hideTitle` support to that component so SettingsLayout's header is the single source of truth.
- Extend `ROUTE_LOADERS` with `inquiries`, `ecomdrive-logs` so hover prefetch covers them.
- Fix `useAdmin`: skip duplicate `INITIAL_SESSION` events by tracking last-processed user id, not just the first event flag.

### 4. Verify

- Confirm `/admin` loads dashboard with sidebar intact.
- Force chart failure (temporarily pass `data={undefined as any}`) → confirm fallback card shows and rest of dashboard renders.
- Navigate Dashboard → Products → Orders → Settings → each Settings tab; confirm no duplicate titles, no flicker, no console errors.
- Reload `/admin/settings/announcement` and check the header is rendered by SettingsLayout only.

## Files touched

- `src/components/admin/AdminErrorBoundary.tsx` (new)
- `src/components/admin/AdminLayout.tsx` (wrap Outlet, extend ROUTE_LOADERS)
- `src/components/admin/SalesChart.tsx` (resilient render, concrete colors, size guard)
- `src/pages/admin/Dashboard.tsx` (boundary around chart, empty-data branch)
- `src/App.tsx` (use `settingsChild` for AnnouncementEditor)
- `src/components/admin/AnnouncementEditor.tsx` (accept `hideTitle`, drop local title)
- `src/hooks/useAdmin.ts` (dedupe auth events)

No backend / DB changes. Pure frontend resilience + polish.
