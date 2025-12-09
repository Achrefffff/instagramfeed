# Architecture Diagrams & Visual Reference

## 1. Data Flow Architecture

### Authentication Flow

```
User (Browser)
    ↓
[Click "Connect Instagram"]
    ↓
Shopify App (React Router)
    ↓
app/routes/api.instagram.connect/route.jsx
    ↓
facebook.com/oauth
    ↓
[User Logs in + Grants Permissions]
    ↓
Redirects to: auth/instagram/callback
    ↓
app/routes/auth.instagram.callback/route.jsx
    ↓
Exchange code for token
    ↓
Prisma: Save InstagramConfig
    ↓
✅ Redirect to success page
```

### Post Synchronization Flow

```
User Opens App Admin Page
    ↓
app/routes/app._index/route.jsx loader
    ↓
┌─────────────────────────────────────────────────────┐
│ Parallel (Promise.all):                             │
├─────────────────────────────────────────────────────┤
│ ├─ Check token refresh (if < 7 days to expiry)      │
│ ├─ Get Instagram accounts                            │
│ └─ Get Instagram username                            │
│ ├─ Fetch published posts (pagination)               │
│ └─ Fetch tagged posts (pagination)                  │
└─────────────────────────────────────────────────────┘
    ↓
For each post:
├─ If carousel: Get carousel children (⚠️ SEQUENTIAL)
├─ Get insights (likes, reach, saved)
└─ Upsert to Prisma database
    ↓
┌─────────────────────────────────────────────────────┐
│ Return grouped by account:                           │
├─────────────────────────────────────────────────────┤
│ ├─ Published posts                                   │
│ ├─ Tagged posts                                      │
│ ├─ Warnings/errors                                  │
│ └─ Account configurations                           │
└─────────────────────────────────────────────────────┘
    ↓
React Frontend renders PostCard components
```

### Metafield Update Flow (Theme Integration)

```
User Selects Posts in Admin
    ↓
app/routes/api.instagram.save-selection/route.jsx
    ↓
Validate input (Zod schema)
    ↓
Fetch selected posts from Prisma
    ↓
Convert to JSON format
    ↓
Shopify GraphQL mutation: metafieldsSet
    ↓
Store in shop.metafields.custom.instagram_selected_posts
    ↓
┌──────────────────────────────────────────────────┐
│ Theme Block Reads Metafield                      │
├──────────────────────────────────────────────────┤
│ extensions/instahop/blocks/instagram-feed.liquid │
│ - Displays carousel or grid                      │
│ - Handles video preview                          │
│ - Shows product tags                             │
└──────────────────────────────────────────────────┘
    ↓
Storefront displays posts to customers
```

---

## 2. Database Schema Diagram

```
┌──────────────────────────────┐
│    InstagramConfig           │
├──────────────────────────────┤
│ id (PK)                      │
│ shop (UNIQUE)                │  ← Shopify shop domain
│ instagramId (UNIQUE)         │  ← Instagram account ID
│ username (UNIQUE)            │  ← Instagram username
│ accessToken                  │  ← OAuth token
│ tokenExpiresAt               │  ← Refresh trigger (7-day buffer)
│ lastRefreshedAt              │
│ isActive                     │
│ createdAt / updatedAt        │
│                              │
│ INDEX: tokenExpiresAt        │
│ INDEX: isActive              │
└────────────┬─────────────────┘
             │ (One-to-Many)
             │
             ↓ CASCADE DELETE
      ┌──────────────────────────────┐
      │   InstagramPost              │
      ├──────────────────────────────┤
      │ id (PK)                      │
      │ configId (FK) ──────────────→│  (Shopify + posts)
      │ shop                         │
      │                              │
      │ Media:                       │
      │ ├─ mediaUrl                  │
      │ ├─ thumbnailUrl              │
      │ ├─ mediaType (IMAGE/VIDEO)   │
      │ └─ carouselChildren (JSON)   │
      │                              │
      │ Metadata:                    │
      │ ├─ caption                   │
      │ ├─ permalink                 │
      │ ├─ publishedAt               │
      │ ├─ isTagged                  │
      │ └─ ownerUsername             │
      │                              │
      │ Engagement:                  │
      │ ├─ likeCount                 │
      │ ├─ commentsCount             │
      │ ├─ impressions               │
      │ ├─ reach                     │
      │ └─ saved                     │
      │                              │
      │ INDEXES:                     │
      │ ├─ configId, publishedAt     │
      │ ├─ configId, likeCount       │
      │ ├─ configId, impressions     │
      │ └─ configId, isTagged        │
      └──────────────────────────────┘
```

---

## 3. Request Timeout Architecture (TO BE IMPLEMENTED)

### Current Issue: No Timeout

```
fetch(url) ────────────► [Instagram API]
    ↓
[Waiting indefinitely if API doesn't respond]
    ↓
[Browser times out at ~30s]
    ↓
❌ User frustrated
```

### After Fix: 10-Second Timeout

```
fetch(url) ──┬─► [Instagram API] ✓ responds < 10s ──► Success ✅
             │
             └─► AbortController fires at 10s
                 ↓
                 setTimeout cleared
                 ↓
                 return 408 (Request Timeout) ✅
```

---

## 4. Performance Comparison: Sequential vs Parallel

### Current Performance (Sequential Carousel Fetch)

```
Timeline (seconds):
0s  ├─ Get posts: ~0.2s
    │
0.2 ├─ Post 1 (image): nothing extra
    │
0.3 ├─ Post 2 (carousel): +2s fetch children
    │    └─ 2.3s complete
    │
2.3 ├─ Post 3 (carousel): +2s fetch children
    │    └─ 4.3s complete
    │
4.3 ├─ Post 4 (image): nothing extra
    │
4.4 ├─ Get insights: ~1.5s (parallel)
    │
5.9 ├─ Database: ~0.5s
    │
6.4 └─ TOTAL: ~6.4 seconds
```

### Optimized Performance (Parallel Carousel Fetch)

```
Timeline (seconds):
0s  ├─ Get posts: ~0.2s
    │
0.2 ├─ Parallel carousel fetch:
    │  ├─ Post 2 children: 2s
    │  ├─ Post 3 children: 2s  (happens at SAME TIME)
    │  └─ both done at: 2.2s
    │
2.2 ├─ Get insights: ~1.5s (parallel)
    │
3.7 ├─ Database: ~0.5s
    │
4.2 └─ TOTAL: ~4.2 seconds (34% faster!) ⚡
```

---

## 5. Error Handling Flow

```
Any Operation
    ↓
Try/Catch Block
    ↓
┌─────────────────────────────────────────┐
│ Error Type Classification               │
├─────────────────────────────────────────┤
│ ├─ ValidationError (400)                │
│ │  └─ Input validation failed           │
│ │                                        │
│ ├─ InstagramAPIError (statusCode)       │
│ │  ├─ 401: Token expired                │
│ │  ├─ 429: Rate limited                 │
│ │  ├─ 500: Server error                 │
│ │  └─ 408: Timeout (TO BE ADDED)        │
│ │                                        │
│ ├─ DatabaseError (500)                  │
│ │  └─ Prisma operation failed           │
│ │                                        │
│ └─ Other (500)                          │
│    └─ Unexpected error                  │
└─────────────────────────────────────────┘
    ↓
handleError(error, context)
    ↓
┌─────────────────────────────────────────┐
│ 1. Log with context                     │
│ 2. Map to HTTP status code              │
│ 3. Return data() response               │
│ 4. Graceful degradation                 │
└─────────────────────────────────────────┘
    ↓
Response to Frontend or Retry
```

---

## 6. Token Refresh Lifecycle

```
Instagram Token Issued
├─ Expires: ~60 days from now
│
Day 0-52:
├─ Token valid
├─ No refresh needed
│
Day 53 (7 days before expiry):
├─ ⚠️ checkAndRefreshTokenIfNeeded() triggers
├─ Attempt refresh via Facebook API
├─ Success: Update database with new token
├─ Failure: Flag for user, but continue with old token
│  (graceful degradation)
│
Day 54-59:
├─ Using refreshed token
├─ New expiry: ~60 days from refresh
│
Day 60 (original expiry):
├─ ❌ OLD TOKEN WOULD EXPIRE HERE
├─ ✅ BUT WE REFRESHED ON DAY 53
├─ New token still valid for ~54 more days
│
Repeat every 60 days
```

---

## 7. Rate Limiting Strategy

```
┌─────────────────────────────────────────┐
│ RATE_LIMITS Configuration               │
├─────────────────────────────────────────┤
│ CONNECT_ATTEMPTS:                       │
│  ├─ Max: 3 attempts                     │
│  └─ Window: 1 hour                      │
│                                          │
│ SAVE:                                   │
│  ├─ Max: 20 saves                       │
│  └─ Window: 5 minutes                   │
│                                          │
│ PRODUCT_TAGGING:                        │
│  ├─ Max: 10 operations                  │
│  └─ Window: 5 minutes                   │
└─────────────────────────────────────────┘
        ↓
Key Format: {action}:{shop}
        ↓
In-Memory Store: Map<string, Array<timestamp>>
        ↓
On Request:
├─ Check Map for key
├─ Count recent entries (within window)
├─ If count >= max: reject (429)
├─ If count < max: allow + record timestamp
└─ Cleanup old entries every 1 hour

⚠️ NOTE: Doesn't scale to multi-process
    (need Redis for production at scale)
```

---

## 8. Component Dependency Graph

```
Root (root.jsx)
    ├─ ErrorBoundary.jsx
    ├─ LanguageSwitcher.jsx
    │
    └─ app.jsx (Shell)
        └─ app._index/route.jsx (Loader)
            │
            ├─ EmptyState component
            │  └─ [Connect Instagram button]
            │
            ├─ ConfiguredState component
            │  ├─ Account selector dropdown
            │  ├─ PostCard (x many)
            │  │  ├─ Image display
            │  │  ├─ Username display (conditional)
            │  │  ├─ Engagement stats
            │  │  └─ [Open lightbox button]
            │  │
            │  └─ ProductCard (x many)
            │
            └─ Lightbox component
                ├─ instagram-lightbox.js (minified 8KB)
                ├─ Carousel navigation
                ├─ Keyboard handling (arrows, escape)
                └─ Product tags overlay

Data Flow:
loader → [post data] → PostCard → [click] → Lightbox
                    ↓
          instagram-lightbox.js (DOM manipulation)
```

---

## 9. File Size Optimization Results

### Before Minification

```
instagram-lightbox.js: 12,051 bytes
├─ Readable formatting
├─ Full comments
├─ Variable names: updateLightbox, navigatePost, etc.
└─ Whitespace: all preserved
```

### After Minification

```
instagram-lightbox.js: 8,096 bytes ✅
├─ No readable formatting
├─ Comments removed
├─ Variable names: n(), e(), t(), etc.
└─ Whitespace: removed
└─ Compression: -33% reduction

Breakdown:
- Original: 12,051 bytes
- Minified: 8,096 bytes
- Reduction: 3,955 bytes (33%)
- Shopify limit: 10,000 bytes
- Status: ✅ PASSES
- Margin: 1,904 bytes spare
```

---

## 10. API Call Latency Distribution

```
                    Frequency
        ↑
    High│     ┌───┐
        │     │   │
        │     │   │        ┌───┐
    Med │ ┌───┤   ├───┐ ┌──┤   ├───┐
        │ │   │   │   │ │  │   │   │
    Low │ │   │   │   ├─┼──┤   │   ├─────
        └─┴───┴───┴───┴─┴──┴───┴───┴─────→ Latency (ms)
        100  200  400 800  1s   2s   5s   10s

Legend:
├─ 100-200ms: Get accounts, exchange token
├─ 200-400ms: Get username, get insights
├─ 400-800ms: Get posts (single page)
├─ 1-2s: Get insights (batched)
├─ 2s: Get carousel children (⚠️ slow)
└─ 5-10s: Multiple carousel children (sequential)

Total page load: 3-10 seconds (currently)
                2-7 seconds (after optimizations)
```

---

## 11. Security Layers

```
User Request
    ↓
┌─────────────────────────────────────────┐
│ Layer 1: HTTPS/TLS                      │
│ └─ All traffic encrypted                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Layer 2: Shopify Admin Auth              │
│ └─ Verify shop ownership + scopes        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Layer 3: CSRF Protection (OAuth)         │
│ └─ State parameter validation            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Layer 4: Input Validation (Zod)          │
│ └─ Schema validation on all inputs       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Layer 5: Rate Limiting                  │
│ └─ Prevent brute force attacks          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Layer 6: Parameterized Queries (Prisma) │
│ └─ Prevent SQL injection                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Layer 7: Caption Sanitization (TODO)    │
│ └─ Prevent XSS attacks                  │
└─────────────────────────────────────────┘
    ↓
Safe Processing
```

---

## 12. Deployment Pipeline

```
Local Development
    ↓
git commit
    ↓
npm run lint       ✅ Code style
npm run typecheck  ✅ TypeScript
npm run test       ✅ Unit tests
npm run build      ✅ Production build
    ↓
Git Push → GitHub
    ↓
├─ GitHub Actions (if configured)
│  ├─ Run all tests
│  ├─ Build verification
│  └─ Security scan
│
├─ Deploy to Staging
│  ├─ Verify database migrations
│  ├─ Test full OAuth flow
│  └─ Load testing
│
└─ Deploy to Production
   ├─ Blue-green deployment
   ├─ Monitor error rates
   └─ Rollback plan ready
```

---

This visual reference helps understand the system architecture and data flows. Combined with CODE_AUDIT.md and IMPLEMENTATION_GUIDE.md, you have complete documentation for understanding and improving the SocialFlux app.
