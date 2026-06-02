# Frontend Migration Checklist: Supabase → Fastify API

## Overview
This document outlines the migration plan for transitioning the frontend from Supabase direct database access to the custom Fastify backend API architecture.

## Current State Analysis

### Supabase Usage Patterns (65 files, 384 matches)

#### High-Impact Areas
1. **Authentication** (supabase.auth.*)
   - Login/Register flows
   - Session management
   - Token refresh
   - User profile access

2. **Data Queries** (supabase.from() / supabase.rpc())
   - Products (33 matches in Products.tsx)
   - Orders (24 matches in Orders.tsx)
   - Admin data (19 matches in useAdminData.ts)
   - Homepage content (15 matches in Index.tsx)
   - Cart/Checkout (10 matches in Checkout.tsx)

3. **Admin Operations**
   - Product management
   - Order management
   - Category management
   - Coupon management
   - User role management
   - Settings management

4. **Real-time Features**
   - Subscriptions (if any)
   - Live updates

### Frontend Dependencies
- `@supabase/supabase-js` (current)
- `@tanstack/react-query` (already installed - good for API client)
- `zustand` (state management)
- `react-router-dom` (routing)

## Migration Strategy

### Phase 1: Foundation (Week 1)
- [ ] Build centralized API client architecture
- [ ] Implement auth client with token refresh handling
- [ ] Implement cookie/session handling for auth
- [ ] Set up error handling and retry logic
- [ ] Configure API base URL and environment variables

### Phase 2: Authentication (Week 1-2)
- [ ] Replace Supabase auth with Fastify API auth
- [ ] Integrate login/register with Fastify API
- [ ] Integrate refresh token flow with Fastify API
- [ ] Implement protected routes with Fastify API auth
- [ ] Implement admin routes with Fastify API auth
- [ ] Update auth context/providers

### Phase 3: Core Features (Week 2-3)
- [ ] Migrate cart state to use Fastify API
- [ ] Migrate checkout flow to use Fastify API
- [ ] Migrate order history to use Fastify API
- [ ] Replace product queries with Fastify API
- [ ] Replace category queries with Fastify API

### Phase 4: Admin Features (Week 3-4)
- [ ] Migrate admin dashboard to use Fastify API
- [ ] Replace admin role checks with Fastify API middleware
- [ ] Migrate product management to Fastify API
- [ ] Migrate order management to Fastify API
- [ ] Migrate customer management to Fastify API
- [ ] Migrate coupon management to Fastify API
- [ ] Migrate homepage settings to Fastify API
- [ ] Migrate analytics to Fastify API

### Phase 5: Cleanup (Week 4)
- [ ] Remove Supabase frontend dependencies
- [ ] Remove Supabase client files
- [ ] Remove Supabase types
- [ ] Add proper loading/error states throughout
- [ ] Test frontend with Fastify API integration
- [ ] Performance optimization

## API Client Architecture

### Structure
```
src/lib/api/
├── client.ts              # Main API client with axios/fetch
├── auth-client.ts         # Auth-specific client
├── endpoints.ts           # API endpoint definitions
├── types.ts               # API response types
└── utils.ts               # API utilities (error handling, retry, etc.)
```

### Features
- Token management (access + refresh)
- Automatic token refresh
- Cookie-based session handling
- Request/response interceptors
- Error handling and retry logic
- Request cancellation
- Loading states
- Type-safe API calls

## Compatibility Matrix

| Feature | Supabase | Fastify API | Migration Effort | Risk |
|---------|-----------|-------------|------------------|------|
| Auth (login/register) | ✅ | ✅ | Medium | Low |
| Token refresh | ✅ | ✅ | Medium | Low |
| Protected routes | ✅ | ✅ | Medium | Low |
| Admin auth | ✅ | ✅ | Medium | Low |
| Product queries | ✅ | ✅ | Low | Low |
| Category queries | ✅ | ✅ | Low | Low |
| Cart operations | ✅ | ✅ | Medium | Medium |
| Checkout flow | ✅ | ✅ | High | High |
| Order history | ✅ | ✅ | Medium | Medium |
| Admin products | ✅ | ✅ | Medium | Low |
| Admin orders | ✅ | ✅ | Medium | Low |
| Admin customers | ✅ | ✅ | Medium | Low |
| Admin coupons | ✅ | ✅ | Low | Low |
| Admin homepage | ✅ | ✅ | Low | Low |
| Admin analytics | ✅ | ✅ | Low | Low |

## Risk Assessment

### High Risk Areas
1. **Checkout Flow** - Complex business logic, transaction handling
2. **Cart State** - Real-time updates, inventory validation
3. **Admin Operations** - Role-based access, data integrity

### Mitigation Strategies
- Implement comprehensive testing for checkout flow
- Use optimistic updates for cart state
- Implement proper error handling and rollback
- Maintain feature flags for gradual rollout
- Keep Supabase as fallback during migration

## Testing Strategy

### Unit Tests
- API client functions
- Auth utilities
- Error handling
- Token refresh logic

### Integration Tests
- Auth flows (login, register, refresh)
- Cart operations
- Checkout flow
- Admin operations

### E2E Tests
- Critical user journeys
- Admin workflows
- Error scenarios

## Rollback Plan

1. Keep Supabase client as fallback
2. Feature flags for API switching
3. Database backup before migration
4. Gradual user rollout
5. Monitoring and alerting

## Success Criteria

- [ ] All Supabase dependencies removed
- [ ] All features working with Fastify API
- [ ] Performance maintained or improved
- [ ] Error rates below threshold
- [ ] User experience preserved
- [ ] Admin functionality fully operational
