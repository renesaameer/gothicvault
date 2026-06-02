# Runtime Testing Checklist

## Overview
This checklist covers comprehensive runtime testing for the Gothic Vault e-commerce platform after migration to the custom Fastify backend.

## Authentication & Authorization Testing

### User Registration
- [ ] New user can register with valid email and password
- [ ] Password validation works (minimum length, complexity)
- [ ] Email validation works (format, uniqueness)
- [ ] Duplicate email registration rejected
- [ ] Weak password rejected
- [ ] Registration confirmation email sent (if configured)
- [ ] User created in database
- [ ] Default role assigned correctly

### User Login
- [ ] Valid credentials allow login
- [ ] Invalid credentials rejected
- [ ] Access token returned on successful login
- [ ] Refresh token returned (in cookie or response)
- [ ] Login rate limiting works (5 attempts per 15 minutes)
- [ ] Account locked after too many failed attempts
- [ ] Remember me functionality works (if implemented)

### Token Management
- [ ] Access token works for API requests
- [ ] Access token expires after configured time
- [ ] Refresh token can obtain new access token
- [ ] Refresh token expires after configured time
- [ ] Invalid refresh token rejected
- [ ] Expired access token rejected
- [ ] Token refresh loop not occurring
- [ ] Multiple concurrent sessions handled correctly

### Protected Routes
- [ ] Protected routes reject requests without token
- [ ] Protected routes accept requests with valid token
- [ ] Protected routes reject expired tokens
- [ ] Protected routes reject invalid tokens
- [ ] Role-based authorization works
- [ ] Admin routes require admin role
- [ ] Staff routes require staff role

### Password Management
- [ ] Password reset email sent on request
- [ ] Password reset token works
- [ ] Password reset token expires
- [ ] New password accepted
- [ ] Old password rejected after reset
- [ ] Password change works for logged-in user
- [ ] Current password required for change

### Email Verification
- [ ] Verification email sent on registration
- [ ] Verification token works
- [ ] Verification token expires
- [ ] User marked as verified after verification
- [ ] Unverified user cannot access protected routes

## Product & Catalog Testing

### Product Browsing
- [ ] Homepage loads correctly
- [ ] Hero slides display correctly
- [ ] Featured products load correctly
- [ ] Product categories load correctly
- [ ] Product search works
- [ ] Product filtering works
- [ ] Product sorting works
- [ ] Pagination works correctly

### Product Details
- [ ] Product page loads correctly
- [ ] Product images display correctly
- [ ] Product variants display correctly
- [ ] Variant selection works
- [ ] Price updates with variant selection
- [ ] Stock status displays correctly
- [ ] Product description displays
- [ ] Related products display
- [ ] Product reviews display
- [ ] Product FAQs display

### Product Media
- [ ] Product images load from new backend
- [ ] Image URLs are correct
- [ ] Image alt text displays
- [ ] Image zoom works (if implemented)
- [ ] Image gallery works
- [ ] Video media works (if applicable)

### Categories & Brands
- [ ] Category pages load correctly
- [ ] Category products filter correctly
- [ ] Brand pages load correctly
- [ ] Brand products filter correctly
- [ ] Category hierarchy works
- [ ] Brand logos display

## Shopping Cart Testing

### Add to Cart
- [ ] Product can be added to cart
- [ ] Variant selection works before adding
- [ ] Quantity selection works
- [ ] Cart updates in real-time
- [ ] Cart persists across page refresh
- [ ] Cart persists across sessions (if logged in)
- [ ] Duplicate items increment quantity
- [ ] Out-of-stock items rejected
- [ ] Stock validation works

### Cart Management
- [ ] Cart items display correctly
- [ ] Item quantity can be increased
- [ ] Item quantity can be decreased
- [ ] Item can be removed from cart
- [ ] Cart can be cleared
- [ ] Cart totals calculate correctly
- [ ] Subtotal calculates correctly
- [ ] Shipping cost calculates correctly
- [ ] Tax calculates correctly (if applicable)
- [ ] Total calculates correctly

### Cart Persistence
- [ ] Cart persists for guest users (localStorage/sessionStorage)
- [ ] Cart persists for logged-in users (database)
- [ ] Cart merges on login
- [ ] Cart syncs across tabs
- [ ] Cart expires after inactivity (if configured)

## Checkout Testing

### Checkout Flow
- [ ] Checkout page loads correctly
- [ ] Customer information form works
- [ ] Shipping address form works
- [ ] Delivery zone selection works
- [ ] Shipping cost updates with zone
- [ ] Billing information form works
- [ ] Payment method selection works
- [ ] Order review displays correctly
- [ ] Terms acceptance required

### Coupon Application
- [ ] Valid coupon applies correctly
- [ ] Invalid coupon rejected
- [ ] Expired coupon rejected
- [ ] Used coupon rejected
- [ ] Coupon minimum order requirement works
- [ ] Coupon maximum discount works
- [ ] Coupon usage increments correctly
- [ ] Coupon discount calculates correctly

### Order Creation
- [ ] Order creates successfully
- [ ] Order number generated
- [ ] Order status set to pending
- [ ] Stock decrements correctly
- [ ] Customer upserts correctly
- [ ] Payment processed (if integrated)
- [ ] Order confirmation displays
- [ ] Confirmation email sent (if configured)

### Order Validation
- [ ] Empty cart rejected
- [ ] Invalid customer data rejected
- [ ] Invalid shipping address rejected
- [ ] Invalid payment rejected
- [ ] Insufficient stock rejected
- [ ] Duplicate order prevention works

## Order Management Testing

### Order Tracking
- [ ] Order can be tracked by order number
- [ ] Order can be tracked by phone number
- [ ] Order status displays correctly
- [ ] Order details display correctly
- [ ] Order items display correctly
- [ ] Shipping information displays
- [ ] Tracking link works (if integrated)

### Order History
- [ ] User can view order history
- [ ] Order history paginates correctly
- [ ] Order details can be viewed
- [ ] Order can be cancelled (if allowed)
- [ ] Order cancellation works correctly
- [ ] Stock rolls back on cancellation
- [ ] Cancellation email sent (if configured)

### Admin Order Management
- [ ] Admin can view all orders
- [ ] Orders can be filtered
- [ ] Orders can be searched
- [ ] Order status can be updated
- [ ] Order details can be viewed
- [ ] Order can be cancelled by admin
- [ ] Refund placeholder can be created

## File Upload Testing

### Image Upload
- [ ] Valid image uploads successfully
- [ ] File size limit enforced (10MB)
- [ ] MIME type validation works
- [ ] Filename sanitization works
- [ ] Path traversal protection works
- [ ] Directory validation works
- [ ] Upload progress displays
- [ ] Upload error handling works

### Upload Management
- [ ] Uploaded images display correctly
- [ ] Images can be deleted
- [ ] Images can be replaced
- [ ] Image URLs are correct
- [ ] Image alt text works
- [ ] Image order works

### Rate Limiting
- [ ] Upload rate limit works (10 per minute)
- [ ] Rate limit error displays
- [ ] Rate limit resets after window

## Admin Functionality Testing

### Product Management
- [ ] Admin can create products
- [ ] Admin can edit products
- [ ] Admin can delete products
- [ ] Admin can manage variants
- [ ] Admin can upload product images
- [ ] Admin can manage stock
- [ ] Admin can manage pricing

### Category Management
- [ ] Admin can create categories
- [ ] Admin can edit categories
- [ ] Admin can delete categories
- [ ] Admin can upload category images
- [ ] Admin can manage category order

### Brand Management
- [ ] Admin can create brands
- [ ] Admin can edit brands
- [ ] Admin can delete brands
- [ ] Admin can upload brand logos

### Customer Management
- [ ] Admin can view customers
- [ ] Admin can search customers
- [ ] Admin can view customer details
- [ ] Admin can manage customer roles

### Coupon Management
- [ ] Admin can create coupons
- [ ] Admin can edit coupons
- [ ] Admin can delete coupons
- [ ] Admin can view coupon usage

### Delivery Zone Management
- [ ] Admin can create delivery zones
- [ ] Admin can edit delivery zones
- [ ] Admin can delete delivery zones
- [ ] Admin can manage zone pricing

### Shop Settings
- [ ] Admin can view shop settings
- [ ] Admin can edit shop settings
- [ ] Settings persist correctly
- [ ] Settings reflect on frontend

### Homepage Management
- [ ] Admin can manage hero slides
- [ ] Admin can manage sections
- [ ] Admin can manage testimonials
- [ ] Admin can manage FAQs
- [ ] Admin can manage why choose us cards
- [ ] Admin can manage video testimonials
- [ ] Admin can manage featured categories

## Performance Testing

### Response Times
- [ ] Homepage loads in < 2 seconds
- [ ] Product page loads in < 2 seconds
- [ ] Category page loads in < 2 seconds
- [ ] Cart operations complete in < 500ms
- [ ] Checkout completes in < 3 seconds
- [ ] API responses < 200ms (p95)
- [ ] Database queries < 100ms (p95)

### Load Testing
- [ ] System handles 100 concurrent users
- [ ] System handles 500 concurrent users
- [ ] System handles 1000 concurrent users
- [ ] No errors under load
- [ ] Response times acceptable under load
- [ ] Database connection pool not exhausted
- [ ] Memory usage stable under load

### Stress Testing
- [ ] System handles spike in traffic
- [ ] System recovers from overload
- [ ] No data corruption under stress
- [ ] Graceful degradation works

## Security Testing

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] CSRF protection works
- [ ] File upload exploits blocked
- [ ] Path traversal attempts blocked
- [ ] Command injection attempts blocked

### Authentication Security
- [ ] Brute force attacks prevented
- [ ] Session hijacking prevented
- [ ] Token theft prevented
- [ ] Password hashing secure
- [ ] Secure password reset flow

### API Security
- [ ] Rate limiting enforced
- [ ] CORS configured correctly
- [ ] Security headers present
- [ ] Sensitive data not exposed
- [ ] Error messages don't leak information

### Data Security
- [ ] Data encrypted at rest (if configured)
- [ ] Data encrypted in transit (HTTPS)
- [ ] PII protected
- [ ] Access controls enforced

## Error Handling Testing

### API Errors
- [ ] 400 Bad Request handled correctly
- [ ] 401 Unauthorized handled correctly
- [ ] 403 Forbidden handled correctly
- [ ] 404 Not Found handled correctly
- [ ] 409 Conflict handled correctly
- [ ] 429 Too Many Requests handled correctly
- [ ] 500 Internal Server Error handled correctly
- [ ] Error messages user-friendly

### Frontend Errors
- [ ] Network errors handled gracefully
- [ ] Timeout errors handled gracefully
- [ ] Validation errors display correctly
- [ ] Error boundaries work
- [ ] User can retry failed operations

### Database Errors
- [ ] Connection errors handled
- [ ] Query errors handled
- [ ] Transaction errors handled
- [ ] Constraint errors handled
- [ ] No data exposed in errors

## Cross-Browser Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile

### Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile landscape (667x375)

## Integration Testing

### Payment Gateway
- [ ] Payment integration works (if configured)
- [ ] Payment callbacks handled
- [ ] Payment failures handled
- [ ] Refund process works

### Email Service
- [ ] Transactional emails sent
- [ ] Email templates render correctly
- [ ] Email links work
- [ ] Email bounce handling

### SMS Service
- [ ] SMS notifications sent (if configured)
- [ ] SMS templates render correctly
- [ ] SMS delivery tracking

### Analytics
- [ ] Page views tracked
- [ ] Events tracked
- [ ] E-commerce events tracked
- [ ] User identification works

## Data Integrity Testing

### Database Integrity
- [ ] Foreign key constraints enforced
- [ ] Unique constraints enforced
- [ ] Not null constraints enforced
- [ ] Check constraints enforced
- [ ] Data types enforced

### Transaction Integrity
- [ ] ACID properties maintained
- [ ] Rollback works on failure
- [ ] No orphaned records
- [ ] No duplicate records
- [ ] No missing records

### Cache Integrity
- [ ] Cache invalidation works
- [ ] Cache consistency maintained
- [ ] Stale cache not served
- [ ] Cache warming works

## Accessibility Testing

### WCAG Compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast adequate
- [ ] Alt text present
- [ ] ARIA labels present
- [ ] Focus indicators visible

## Regression Testing

### Critical Paths
- [ ] User registration flow
- [ ] User login flow
- [ ] Product browsing flow
- [ ] Add to cart flow
- [ ] Checkout flow
- [ ] Order tracking flow

### Bug Fixes
- [ ] Previously fixed bugs not reoccurring
- [ ] Edge cases tested
- [ ] Boundary conditions tested

## Final Verification

### Smoke Tests
- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] Health check endpoint responding
- [ ] Critical endpoints accessible
- [ ] No errors in logs

### User Acceptance
- [ ] Stakeholder approval obtained
- [ ] UAT sign-off completed
- [ ] User feedback incorporated
- [ ] Known issues documented

## Test Environment
- [ ] Test environment configured
- [ ] Test data prepared
- [ ] Test accounts created
- [ ] Test scenarios documented
- [ ] Test results recorded

## Test Results Summary
- Total tests: _____
- Passed: _____
- Failed: _____
- Blocked: _____
- Pass rate: _____%

## Notes
- Test date: _______________
- Tested by: _______________
- Environment: _______________
- Issues found: _______________
- Resolutions: _______________
