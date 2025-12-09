# Implementation Guide - Code Audit Recommendations

This document provides step-by-step implementation instructions for the Priority 1 and Priority 2 recommendations from the code audit.

---

## 1. Priority 1: Add Request Timeout Handling

### Current Issue

```javascript
// instagram.server.js - fetchWithErrorHandling()
const response = await fetch(url, options);
// No timeout - request can hang indefinitely
```

### Solution

Create a wrapper function with AbortController timeout:

**File:** `app/services/instagram.server.js`

**Change 1: Update `fetchWithErrorHandling` (around line 95)**

```javascript
async function fetchWithErrorHandling(url, options = {}, timeoutMs = 10000) {
  return retryWithBackoff(async () => {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          const error = new InstagramAPIError(
            data.error?.message || "Instagram API request failed",
            response.status,
            data,
          );
          logger.error("Instagram API error", error, {
            url: url.split("?")[0],
            status: response.status,
          });
          throw error;
        }

        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutError = new InstagramAPIError(
          `Request timeout after ${timeoutMs}ms`,
          408,
          null,
        );
        logger.error("Instagram request timeout", error, {
          url: url.split("?")[0],
          timeoutMs,
        });
        throw timeoutError;
      }

      if (error instanceof InstagramAPIError) {
        throw error;
      }
      const networkError = new InstagramAPIError(
        `Network error: ${error.message}`,
        500,
        null,
      );
      logger.error("Instagram network error", error, {
        url: url.split("?")[0],
      });
      throw networkError;
    }
  });
}
```

**Change 2: Update all `fetchWithErrorHandling` calls to use default timeout**

Most calls don't need changes:

```javascript
// These use default 10s timeout - no change needed
const data = await fetchWithErrorHandling(url);
```

For long-running operations (pagination), use explicit timeout:

```javascript
// getInstagramPosts - pagination might need longer
const data = await fetchWithErrorHandling(nextUrl, {}, 15000); // 15s for pagination
```

### Testing

```javascript
// vitest test for timeout
import { describe, it, expect, vi } from "vitest";

describe("fetchWithErrorHandling timeout", () => {
  it("should timeout after specified duration", async () => {
    const slowUrl = "https://httpstat.us/200?sleep=20000"; // 20s response

    try {
      await fetchWithErrorHandling(slowUrl, {}, 1000); // 1s timeout
      expect.fail("Should have thrown timeout error");
    } catch (error) {
      expect(error.message).toContain("Request timeout");
      expect(error.statusCode).toBe(408);
    }
  });
});
```

**Effort:** 30 minutes
**Impact:** Prevents hanging requests in production

---

## 2. Priority 1: Parallelize Carousel Children Fetching

### Current Issue

```javascript
// app/routes/app._index/route.jsx lines 130-145
for (const post of allPosts) {
  if (post.media_type === "CAROUSEL_ALBUM") {
    const children = await instagram.getCarouselChildren(post.id, token);
    // Called sequentially - if 5 carousel posts, 5 API calls one after another
    // ~2s per call = ~10s total
  }
}
```

### Solution

Batch all carousel children requests and execute in parallel:

**File:** `app/routes/app._index/route.jsx`

**Current Code (lines 115-145):**

```javascript
const allPosts = [...publishedPosts, ...taggedPosts];

const processedPostsWithInsights = await Promise.all(
  allPosts.map(async (post) => {
    const insights = getInsights(post); // Already parallel

    const hashtags = instagram.extractHashtags(post.caption);
    const ownerUsername = post.username || config.username;

    let carouselChildren = null;
    if (post.media_type === "CAROUSEL_ALBUM") {
      try {
        const children = await instagram.getCarouselChildren(
          post.id,
          activeConfig.accessToken,
        );
        // ... process children
      } catch (error) {
        logger.warn("Failed to fetch carousel children", { ... });
      }
    }
    // ...
  }),
);
```

**Replace with:**

```javascript
const allPosts = [...publishedPosts, ...taggedPosts];

// Step 1: Collect carousel post IDs
const carouselPostIds = allPosts
  .filter((post) => post.media_type === "CAROUSEL_ALBUM")
  .map((post) => post.id);

// Step 2: Fetch all carousel children in parallel
let allCarouselChildren = {};
if (carouselPostIds.length > 0) {
  try {
    const carouselResults = await Promise.all(
      carouselPostIds.map(async (postId) => {
        try {
          const children = await instagram.getCarouselChildren(
            postId,
            activeConfig.accessToken,
          );
          return { postId, children };
        } catch (error) {
          logger.warn("Failed to fetch carousel children for post", {
            postId,
            error: error?.message,
          });
          return { postId, children: null };
        }
      }),
    );

    // Convert to lookup map
    carouselResults.forEach(({ postId, children }) => {
      if (children && children.length > 0) {
        allCarouselChildren[postId] = JSON.stringify(
          children.map((child) => ({
            url: child.media_url,
            type: child.media_type,
          })),
        );
      }
    });
  } catch (error) {
    logger.error("Failed to fetch carousel children batch", error);
  }
}

// Step 3: Process posts with pre-fetched carousel data
const processedPostsWithInsights = await Promise.all(
  allPosts.map(async (post) => {
    const insights = getInsights(post);
    const hashtags = instagram.extractHashtags(post.caption);
    const ownerUsername = post.username || config.username;

    // Use pre-fetched carousel data
    const carouselChildren = allCarouselChildren[post.id] || null;

    return prisma.instagramPost.upsert({
      where: { id: post.id },
      update: {
        caption: post.caption || null,
        mediaUrl: post.media_url,
        thumbnailUrl: post.thumbnail_url || null,
        permalink: post.permalink,
        publishedAt: new Date(post.timestamp),
        mediaType: post.media_type,
        carouselChildren, // Use pre-fetched value
        // ... rest of update
      },
      create: {
        // ... create fields
        carouselChildren, // Use pre-fetched value
      },
    });
  }),
);
```

### Performance Improvement

```
Before: Sequential carousel children fetching
- Post 1: 200ms
- Post 2: 200ms
- Post 3 (carousel): 200ms + 2000ms child fetch = 2200ms
- Post 4 (carousel): 200ms + 2000ms child fetch = 2200ms
Total: ~4.6s

After: Parallel carousel children fetching
- Fetch posts: 200ms
- Fetch all carousel children (in parallel): 2000ms (not sequential)
- Process all posts: 500ms
Total: ~2.7s (41% faster)
```

### Testing

```javascript
// app/tests/services/carousel.parallel.test.js
import { describe, it, expect, vi } from "vitest";

describe("Parallel carousel fetching", () => {
  it("should fetch all carousel children in parallel", async () => {
    const mockPosts = [
      { id: "1", media_type: "IMAGE" },
      { id: "2", media_type: "CAROUSEL_ALBUM" },
      { id: "3", media_type: "CAROUSEL_ALBUM" },
      { id: "4", media_type: "IMAGE" },
    ];

    const fetchSpy = vi.spyOn(global, "fetch");

    // Mock carousel fetch
    const startTime = performance.now();
    // ... call loader
    const duration = performance.now() - startTime;

    // Should be ~2s (parallel), not ~4s (sequential)
    expect(duration).toBeLessThan(3000);
    expect(fetchSpy).toHaveBeenCalledTimes(
      2, // 2 carousel children requests in parallel
    );
  });
});
```

**Effort:** 45 minutes
**Impact:** 40-50% faster page loads for carousel-heavy accounts

---

## 3. Priority 2: Add Caption Sanitization

### Current Issue

```javascript
// Theme block displays caption directly
{
  {
    post.caption;
  }
}
// Risk: If caption contains HTML/JavaScript, could execute
```

### Solution

Sanitize captions before storing or displaying:

**File 1: `app/routes/app._index/route.jsx` (add at top)**

```javascript
import DOMPurify from 'isomorphic-dompurify';

// In fetchInstagramPosts function, when processing caption:
const sanitizedCaption = DOMPurify.sanitize(post.caption || "", {
  ALLOWED_TAGS: ['a', 'br', 'em', 'strong'], // Allow some formatting
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
});

// Store sanitized caption
caption: sanitizedCaption || null,
```

**File 2: Add to `package.json` dependencies**

```json
{
  "dependencies": {
    "isomorphic-dompurify": "^2.11.0"
  }
}
```

Run:

```powershell
npm install isomorphic-dompurify
```

**File 3: `extensions/instahop/blocks/instagram-feed.liquid` (already safe)**

Liquid templates automatically escape output:

```liquid
{{ post.caption }}  <!-- Already escaped by Shopify -->
```

No changes needed for theme block (Shopify handles escaping).

### Testing

```javascript
// app/tests/services/caption-sanitization.test.js
import { describe, it, expect } from "vitest";
import DOMPurify from "isomorphic-dompurify";

describe("Caption sanitization", () => {
  it("should remove script tags from caption", () => {
    const maliciousCaption = 'Nice photo <script>alert("xss")</script>';
    const clean = DOMPurify.sanitize(maliciousCaption, {
      ALLOWED_TAGS: [],
    });
    expect(clean).not.toContain("<script>");
  });

  it("should allow emoji and basic text", () => {
    const caption = "Check this out! 😊 #amazing";
    const clean = DOMPurify.sanitize(caption);
    expect(clean).toContain("😊");
    expect(clean).toContain("#amazing");
  });

  it("should strip onclick attributes", () => {
    const caption = '<a href="https://example.com" onclick="alert(1)">Link</a>';
    const clean = DOMPurify.sanitize(caption, {
      ALLOWED_TAGS: ["a"],
      ALLOWED_ATTR: ["href"],
    });
    expect(clean).not.toContain("onclick");
  });
});
```

**Effort:** 1 hour
**Impact:** Eliminates XSS vulnerability in caption field

---

## 4. Priority 2: Add Request Duration Logging

### Current Issue

```javascript
// No performance metrics in logs
logger.info("Posts saved successfully", { configId: config.id });
// Should also track: how long did this take?
```

### Solution

Track duration from start to end:

**File:** `app/routes/app._index/route.jsx`

**Change: Top of loader function (around line 214)**

```javascript
export const loader = async ({ request }) => {
  const pageLoadStartTime = performance.now();

  try {
    // ... existing code ...

    // At end, before returning data
    const totalDuration = performance.now() - pageLoadStartTime;

    logger.info("Page load completed successfully", {
      shop: session.shop,
      duration: `${totalDuration.toFixed(0)}ms`,
      postCount: allGroupedPosts.length,
      configCount: configs.length,
      hasWarnings: warnings.length > 0,
      warningCount: warnings.length,
    });

    return data({
      posts: allGroupedPosts,
      configs,
      warnings,
    });
  } catch (error) {
    const totalDuration = performance.now() - pageLoadStartTime;

    logger.error("Page load failed", error, {
      shop: session?.shop,
      duration: `${totalDuration.toFixed(0)}ms`,
      action: "page_load",
    });

    throw error;
  }
};
```

**Change: In `fetchInstagramPosts` function**

```javascript
async function fetchInstagramPosts(config) {
  const fetchStartTime = performance.now();

  try {
    logger.info("Fetching posts for account", {
      configId: config.id,
      username: config.username,
    });

    // ... existing fetch code ...

    const fetchDuration = performance.now() - fetchStartTime;

    logger.info("Posts fetched and saved successfully", {
      configId: config.id,
      duration: `${fetchDuration.toFixed(0)}ms`,
      postCount: allPosts.length,
    });

    return allPosts;
  } catch (error) {
    const fetchDuration = performance.now() - fetchStartTime;

    logger.error("Failed to fetch Instagram posts", error, {
      configId: config.id,
      username: config.username,
      duration: `${fetchDuration.toFixed(0)}ms`,
    });

    // ... existing error handling ...
  }
}
```

**Change: In API endpoints (e.g., save-selection)**

```javascript
export const action = async ({ request }) => {
  const actionStartTime = performance.now();
  const startTime = Date.now(); // Keep this for other calculations

  try {
    // ... existing code ...

    const actionDuration = performance.now() - actionStartTime;

    logger.info("Save selection completed", {
      shop,
      duration: `${actionDuration.toFixed(0)}ms`,
      postCount: selectedPostIds.length,
    });

    return data({ success: true, ... });
  } catch (error) {
    const actionDuration = performance.now() - actionStartTime;

    logger.error("Save selection failed", error, {
      shop,
      duration: `${actionDuration.toFixed(0)}ms`,
    });

    return handleError(error, { action: "save-selection" });
  }
};
```

### Production Log Examples

```json
{
  "level": "info",
  "message": "Page load completed successfully",
  "shop": "test-shop.myshopify.com",
  "duration": "3450ms",
  "postCount": 42,
  "configCount": 2,
  "hasWarnings": false,
  "timestamp": "2025-01-15T10:30:45.123Z"
}
```

### Monitoring Setup

With these logs, set up alerts:

```
WARNING: Page load > 10 seconds
ERROR: Page load failures spike
METRIC: Average load time trending
```

**Effort:** 20 minutes
**Impact:** Production visibility into performance issues

---

## 5. Priority 3: Expand Test Coverage

### Current Coverage Analysis

```
Services: ~70% coverage
Utils: ~75% coverage
Routes: ~60% coverage (loaders are complex to test)

Target: 85% coverage
```

### Missing Test Scenarios

#### 5.1 Token Refresh Edge Cases

**File:** `app/tests/services/token-refresh.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { instagram } from "../../services/instagram.server";
import prisma from "../../db.server";

describe("Token refresh lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should refresh token when 7 days until expiry", async () => {
    const config = {
      id: "test-config",
      shop: "test.myshopify.com",
      accessToken: "short-lived-token",
      tokenExpiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days
    };

    const updatedConfig = await instagram.checkAndRefreshTokenIfNeeded(
      config,
      prisma,
    );

    expect(updatedConfig.accessToken).not.toBe("short-lived-token");
    expect(updatedConfig.lastRefreshedAt).toBeDefined();
  });

  it("should NOT refresh token when 30 days until expiry", async () => {
    const config = {
      id: "test-config",
      tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      accessToken: "still-valid-token",
    };

    const result = await instagram.checkAndRefreshTokenIfNeeded(config, prisma);

    // Should return unchanged config
    expect(result.accessToken).toBe("still-valid-token");
  });

  it("should gracefully degrade on refresh failure", async () => {
    // Mock refresh to fail
    vi.spyOn(instagram, "refreshToken").mockRejectedValue(
      new Error("Network error"),
    );

    const config = {
      id: "test-config",
      tokenExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      accessToken: "old-token",
    };

    const result = await instagram.checkAndRefreshTokenIfNeeded(config, prisma);

    // Should return config with error flag
    expect(result.tokenRefreshFailed).toBe(true);
    expect(result.accessToken).toBe("old-token"); // Unchanged
  });
});
```

#### 5.2 Carousel Mixed Media Types

**File:** `app/tests/services/carousel-mixed-media.test.js`

```javascript
describe("Carousel with mixed media", () => {
  it("should handle carousel with images and videos", async () => {
    const carouselChildren = [
      { media_url: "https://example.com/image1.jpg", media_type: "IMAGE" },
      { media_url: "https://example.com/video1.mp4", media_type: "VIDEO" },
      { media_url: "https://example.com/image2.jpg", media_type: "IMAGE" },
    ];

    // Mock API response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: carouselChildren }),
    });

    global.fetch = mockFetch;

    const children = await instagram.getCarouselChildren("post123", "token");

    expect(children).toHaveLength(3);
    expect(children[0].media_type).toBe("IMAGE");
    expect(children[1].media_type).toBe("VIDEO");
  });

  it("should store carousel children as JSON string", async () => {
    const children = [
      { url: "https://example.com/image.jpg", type: "IMAGE" },
      { url: "https://example.com/video.mp4", type: "VIDEO" },
    ];

    const jsonString = JSON.stringify(children);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].type).toBe("IMAGE");
  });
});
```

#### 5.3 Database Transaction Edge Cases

**File:** `app/tests/routes/error-handling.test.js`

```javascript
describe("Error handling and database rollback", () => {
  it("should handle partial upsert failure", async () => {
    // Create multiple posts
    const posts = [
      { id: "post1", caption: "Post 1" },
      { id: "post2", caption: "Post 2" },
    ];

    // Mock Prisma to fail on second post
    let callCount = 0;
    const mockUpsert = vi.fn(async () => {
      callCount++;
      if (callCount === 2) {
        throw new Error("Database connection lost");
      }
      return { id: "success" };
    });

    // ... test error handling

    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });
});
```

**Effort:** 2-3 hours
**Impact:** 85%+ test coverage, confidence in edge cases

---

## 6. Execution Order & Timeline

### Week 1: Priority 1 (Essential for Production)

- **Monday:** Add request timeout handling (30 min)
- **Tuesday:** Parallelize carousel children (45 min)
- **Tuesday PM:** Test both changes (1 hour)
- **Wednesday:** Code review and deployment prep

### Week 2: Priority 2 (Security & Observability)

- **Thursday:** Add caption sanitization (1 hour)
- **Friday:** Add performance logging (20 min)
- **Friday PM:** Test and validate

### Week 3: Priority 3 (Quality)

- **Next week:** Expand test coverage (2-3 hours)

### Total Effort

- Priority 1: 1.75 hours (must do before production)
- Priority 2: 1.33 hours (first iteration after launch)
- Priority 3: 2-3 hours (ongoing improvement)

---

## 7. Deployment Checklist

After implementing recommendations:

- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No lint warnings: `npm run lint`
- [ ] Code coverage > 85%: `npm run test:coverage`
- [ ] Performance tested locally
- [ ] Production deployment tested in staging
- [ ] Rollback plan documented
- [ ] Team trained on new changes
