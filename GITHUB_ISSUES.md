# GitHub Issues for Next Stage

## Pre-existing TypeScript Errors

### Issue 1: Fix Better Auth API Route Type Errors
**Title**: Fix TypeScript errors in auth route
**Priority**: High
**Labels**: bug, typescript

**Description**:
- `app/api/auth/[...all]/route.ts(20,21)`: Object is possibly 'undefined'
- `app/api/auth/[...all]/route.ts(56,10)`: Handler type error - not callable
These errors prevent typecheck from passing.

**Steps to Reproduce**:
1. Run `npx tsc --noEmit`
2. Observe errors in auth route

**Expected Behavior**: No TypeScript errors in auth route

---

### Issue 2: Fix Search Suggest Optional Chain
**Title**: Fix TypeScript error in search suggest route
**Priority**: Medium
**Labels**: bug, typescript

**Description**:
- `app/api/v1/search/suggest/route.ts(9,21)`: Object is possibly 'undefined'

**Steps to Reproduce**:
1. Run `npx tsc --noEmit`
2. Observe error in search suggest route

**Expected Behavior**: No TypeScript errors

---

### Issue 3: Fix Create Listing Form Type Compatibility
**Title**: Fix form handler type compatibility in create listing form
**Priority**: Medium
**Labels**: bug, typescript, forms

**Description**:
- `features/listings/components/create-listing-form.tsx`: Form handler type mismatch
- SubmitHandler type incompatibility with new extended fields

**Steps to Reproduce**:
1. Open create listing form
2. Check TypeScript errors in form submission handler

**Expected Behavior**: Form handler properly typed with extended fields

---

## Next Stage Features

### Issue 4: Implement Advanced Marketplace Search
**Title**: Implement advanced marketplace search with filters
**Priority**: High
**Labels**: feature, search, filters

**Description**:
Implement full-text search with filters for:
- Brand/model filters
- Price range
- City/area
- Condition
- PTA/CPID status
- Battery health
- Storage/RAM
- Warranty
- Dealer/private seller
- Inspected/verified
- Featured ranking
- Pagination with stable sort order

**Acceptance Criteria**:
- Search works with all filters
- Results are paginated
- Sort order is stable
- Query validation and limits enforced
- Appropriate database indexes

---

### Issue 5: Build Filter UX Components
**Title**: Build user-friendly filter UI for marketplace
**Priority**: High
**Labels**: feature, ui, filters

**Description**:
Create filter sidebar/modal with:
- Price range slider
- Brand dropdown with search
- Condition checkboxes
- PTA/CPID status dropdown
- Battery health range
- City/area selection
- Clear filters button
- Active filters display
- Filter count badges

**Acceptance Criteria**:
- Mobile-responsive design
- Keyboard accessible
- Filter state persists in URL
- Fast filter application

---

### Issue 6: Enhance Listing Detail Page
**Title**: Enhance listing detail page with trust signals
**Priority**: High
**Labels**: feature, ui, listings

**Description**:
Add to listing detail page:
- Image gallery with thumbnails
- Trust badges backed by persisted data
- PTA/CPID status display
- Battery and condition details
- Inspection panel integration
- Seller/dealer profile section
- Location map
- Favorites functionality
- Share/copy link
- Related listings
- SEO metadata
- JSON-LD without sensitive data

**Acceptance Criteria**:
- No full IMEI in HTML or client state
- Badges only shown when backed by data
- Mobile-responsive
- Fast page load

---

### Issue 7: Complete Contact Seller Flow
**Title**: Complete contact seller lead capture flow
**Priority**: High
**Labels**: feature, messaging, leads

**Description**:
Complete contact seller functionality:
- Authentication behavior for unauthenticated users
- Rate limiting verification
- Seller ownership checks
- Conversation creation/reuse logic
- Lead/contact persistence
- Safe contact information handling
- Clear error and loading states
- Success feedback

**Acceptance Criteria**:
- Unauthenticated users prompted to sign in
- Rate limits enforced server-side
- No duplicate conversations
- Lead data properly captured

---

### Issue 8: Build Dealer Dashboard
**Title**: Build dealer dashboard with inventory and leads management
**Priority**: Medium
**Labels**: feature, dealer, dashboard

**Description**:
Create dealer dashboard with:
- Inventory management
- Lead tracking and status updates
- Staff management interface
- Branch management
- Listing performance metrics
- Sales statistics (real data only)
- Lead conversion tracking

**Acceptance Criteria**:
- Authorization for dealer staff actions
- Real persisted statistics only
- No fake metrics or revenue
- Mobile-responsive

---

### Issue 9: Implement Moderation Workflow
**Title**: Implement listing and user moderation system
**Priority**: Medium
**Labels**: feature, moderation, admin

**Description**:
Build moderation system:
- Listing reports
- User reports
- Admin review workflow
- Status transitions
- Authorization
- Audit logging
- Rate limiting on reports
- Server-side admin controls
- Safe handling of abusive content

**Acceptance Criteria**:
- Admin actions authorized server-side
- Audit logs for all moderation actions
- No client-only admin controls
- Report limits enforced

---

### Issue 10: Improve SEO and Performance
**Title**: Improve SEO and performance across the platform
**Priority**: Medium
**Labels**: seo, performance

**Description**:
Improve:
- Homepage SEO
- Search page SEO
- Filter page SEO
- Listing card performance
- Listing detail performance
- Create listing page
- Messaging performance
- Dealer dashboard performance
- Admin panel performance
- Image optimization
- Bundle size optimization

**Acceptance Criteria**:
- Lighthouse scores improved
- Core Web Vitals passing
- Proper meta tags and structured data
- Fast page loads

---

### Issue 11: Add Comprehensive Tests
**Title**: Add unit and integration tests
**Priority**: Medium
**Labels**: testing, quality

**Description**:
Add tests for:
- Security (IMEI masking, rate limiting)
- API endpoints
- Server actions
- Repository operations
- Form validation
- Dealer system
- Promotion system
- Phone history

**Acceptance Criteria**:
- Test coverage > 70%
- All critical paths tested
- CI/CD integration

---

### Issue 12: Replace In-Memory Rate Limiter with Redis
**Title**: Replace in-memory rate limiter with Redis for production
**Priority**: Low
**Labels**: infrastructure, production

**Description**:
Current in-memory rate limiter won't work in distributed deployment. Replace with Redis-based solution for production scalability.

**Acceptance Criteria**:
- Redis-based rate limiting implemented
- Fallback mechanism for Redis failures
- Configuration for distributed deployment

---

## Database Maintenance

### Issue 13: Add Missing Database Indexes
**Title**: Add missing database indexes for performance
**Priority**: Medium
**Labels**: database, performance

**Description**:
Review and add missing indexes:
- Composite indexes for common query patterns
- GIN indexes for JSONB fields
- Partial indexes for filtered queries
- Covering indexes for hot paths

**Acceptance Criteria**:
- All slow queries optimized
- Index usage monitored
