# Token Refresh Strategy

## Overview

Instagram Long-Lived tokens expire after approximately **60 days**. To prevent authentication failures, the app implements automatic token refresh logic.

## How It Works

### 1. Token Expiration Tracking

- When a user connects their Instagram account, the token expiration date is calculated and stored in the database
  - Field: `InstagramConfig.tokenExpiresAt`
  - Last refreshed: `InstagramConfig.lastRefreshedAt`

### 2. Automatic Refresh

Before making any Instagram API call, the app checks if the token needs refreshing:

```javascript
// In app/routes/app._index/route.jsx
activeConfig = await instagram.checkAndRefreshTokenIfNeeded(config, prisma);
```

**Refresh Threshold**: 7 days before expiration

- If token expires in less than 7 days → refresh immediately
- If token expires in more than 7 days → use existing token

### 3. Refresh Process

When a refresh is triggered:

1. Call `instagram.refreshToken(currentAccessToken)`
2. Exchange current token for a new long-lived token
3. Store new token in database with new expiration date
4. Continue with refreshed token

### 4. Graceful Degradation

If token refresh fails:

- Log the warning
- Continue with existing token
- Retry refresh on next API call
- User data is NOT lost

## Database Changes

Migration: `20251129162449_add_token_expiry`

New fields in `InstagramConfig`:

- `tokenExpiresAt DateTime?` - When the current token expires
- `lastRefreshedAt DateTime?` - Last successful refresh timestamp

## Frontend Notifications (Future Enhancement)

Consider notifying users when:

- Token refresh fails after 3 attempts
- Token expires soon (within 24 hours)
- Manual reconnection required

## Testing

To test token refresh locally:

1. Set a token expiration time to now + 8 days
2. Call any Instagram API endpoint
3. Check logs for "Token expiry approaching, attempting refresh"
4. Verify `lastRefreshedAt` is updated in database
