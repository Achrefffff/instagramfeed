import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { instagram } from "../../services/instagram.server.js";
import { server } from "../mocks/server.js";
import { http, HttpResponse } from "msw";
import { retryWithBackoff } from "../../services/instagram.server.js";

// Note: retryWithBackoff needs to be exported to test directly
// For now we'll test it through the public API

const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/v18.0`;

describe("Instagram Retry Logic with Exponential Backoff", () => {
  describe("Automatic Retries on Transient Failures", () => {
    it("should retry on 503 Service Unavailable", async () => {
      let attemptCount = 0;

      // Override handler to simulate transient failure then success
      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          attemptCount++;

          if (attemptCount < 3) {
            // First 2 attempts: Service Unavailable
            return HttpResponse.json(
              { error: { message: "Service Unavailable" } },
              { status: 503 },
            );
          }

          // Third attempt: Success
          return HttpResponse.json({
            access_token: "test_long_lived_token_after_retry",
            token_type: "bearer",
            expires_in: 5184000,
          });
        }),
      );

      const code = "test_code_for_retry";
      const result = await instagram.exchangeCodeForToken(code);

      expect(attemptCount).toBeGreaterThanOrEqual(2); // Should have retried
      expect(result.access_token).toBe("test_long_lived_token_after_retry");
    });

    it("should retry on 429 Too Many Requests", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          attemptCount++;

          if (attemptCount === 1) {
            // First attempt: Rate limited
            return HttpResponse.json(
              { error: { message: "Rate limit exceeded" } },
              { status: 429 },
            );
          }

          // Second attempt: Success
          return HttpResponse.json({
            access_token: "test_token_after_rate_limit",
            token_type: "bearer",
            expires_in: 5184000,
          });
        }),
      );

      const code = "test_code_rate_limit";
      const result = await instagram.exchangeCodeForToken(code);

      expect(attemptCount).toBeGreaterThanOrEqual(1);
      expect(result.access_token).toBe("test_token_after_rate_limit");
    });

    it("should retry on 502 Bad Gateway", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          attemptCount++;

          if (attemptCount <= 2) {
            return HttpResponse.json(
              { error: { message: "Bad Gateway" } },
              { status: 502 },
            );
          }

          return HttpResponse.json({
            access_token: "test_token_after_502",
            token_type: "bearer",
            expires_in: 5184000,
          });
        }),
      );

      const code = "test_code_502";
      const result = await instagram.exchangeCodeForToken(code);

      expect(attemptCount).toBeGreaterThanOrEqual(2);
      expect(result.access_token).toBe("test_token_after_502");
    });

    it("should NOT retry on 400 Bad Request (client error)", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          attemptCount++;

          return HttpResponse.json(
            { error: { message: "Invalid parameters" } },
            { status: 400 },
          );
        }),
      );

      const code = "invalid_code";

      try {
        await instagram.exchangeCodeForToken(code);
      } catch (error) {
        // Expected to throw
      }

      // Should only try once, not retry on client error
      expect(attemptCount).toBe(1);
    });

    it("should NOT retry on 401 Unauthorized (client error)", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, ({ request }) => {
          attemptCount++;

          return HttpResponse.json(
            { error: { message: "Invalid access token" } },
            { status: 401 },
          );
        }),
      );

      try {
        await instagram.getInstagramAccounts("invalid_token");
      } catch (error) {
        // Expected to throw
      }

      // Should only try once
      expect(attemptCount).toBe(1);
    });

    it("should NOT retry on 403 Forbidden (client error)", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, ({ request }) => {
          attemptCount++;

          return HttpResponse.json(
            { error: { message: "Insufficient permissions" } },
            { status: 403 },
          );
        }),
      );

      try {
        await instagram.getInstagramAccounts("token_without_permission");
      } catch (error) {
        // Expected to throw
      }

      expect(attemptCount).toBe(1);
    });

    it("should fail after 3 retries on persistent server errors", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          attemptCount++;

          // Always return 503
          return HttpResponse.json(
            { error: { message: "Service Unavailable" } },
            { status: 503 },
          );
        }),
      );

      const code = "test_code_persistent_error";

      try {
        await instagram.exchangeCodeForToken(code);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should have tried 3 times (initial + 2 retries)
      expect(attemptCount).toBe(3);
    });
  });

  describe("Exponential Backoff Timing", () => {
    it("should have correct backoff delays (1s, 2s, 4s)", async () => {
      const timestamps = [];
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          timestamps.push(Date.now());
          attemptCount++;

          if (attemptCount < 3) {
            return HttpResponse.json(
              { error: { message: "Retry me" } },
              { status: 503 },
            );
          }

          return HttpResponse.json({
            access_token: "success_after_backoff",
            token_type: "bearer",
            expires_in: 5184000,
          });
        }),
      );

      const code = "test_code_backoff_timing";
      await instagram.exchangeCodeForToken(code);

      // Vérifier les délais entre tentatives
      // Note: Les délais peuvent avoir une petite variance, donc on utilise une tolérance
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];

        // Délai 1 devrait être ~1000ms (1s)
        expect(delay1).toBeGreaterThan(900);
        expect(delay1).toBeLessThan(1500);

        // Délai 2 devrait être ~2000ms (2s)
        expect(delay2).toBeGreaterThan(1800);
        expect(delay2).toBeLessThan(2500);
      }
    });
  });

  describe("Network Errors and Timeouts", () => {
    it("should retry on network timeout", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          attemptCount++;

          if (attemptCount < 2) {
            // Simulate timeout with a server error
            return HttpResponse.json(
              { error: { message: "Network timeout" } },
              { status: 503 },
            );
          }

          return HttpResponse.json({
            access_token: "token_after_timeout",
            token_type: "bearer",
            expires_in: 5184000,
          });
        }),
      );

      const code = "test_code_timeout";
      const result = await instagram.exchangeCodeForToken(code);

      expect(attemptCount).toBeGreaterThanOrEqual(1);
      expect(result.access_token).toBe("token_after_timeout");
    });
  });

  describe("Mixed Success and Failure Scenarios", () => {
    it("should successfully retry through Instagram accounts endpoint", async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, ({ request }) => {
          attemptCount++;

          if (attemptCount === 1) {
            return HttpResponse.json(
              { error: { message: "Temporary issue" } },
              { status: 503 },
            );
          }

          return HttpResponse.json({
            data: [
              {
                id: "page_after_retry",
                name: "Retried Page",
                instagram_business_account: {
                  id: "ig_after_retry",
                },
              },
            ],
          });
        }),
      );

      const token = "test_token_for_accounts_retry";
      const accounts = await instagram.getInstagramAccounts(token);

      expect(attemptCount).toBeGreaterThanOrEqual(1);
      expect(accounts[0].id).toBe("page_after_retry");
    });

    it("should handle sequential API calls with retries", async () => {
      let oauthAttempts = 0;
      let accountsAttempts = 0;

      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
          oauthAttempts++;

          if (oauthAttempts === 1) {
            return HttpResponse.json(
              { error: { message: "Server error" } },
              { status: 503 },
            );
          }

          return HttpResponse.json({
            access_token: "token_for_sequential_test",
            token_type: "bearer",
            expires_in: 5184000,
          });
        }),
        http.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, ({ request }) => {
          accountsAttempts++;

          if (accountsAttempts === 1) {
            return HttpResponse.json(
              { error: { message: "Server error" } },
              { status: 502 },
            );
          }

          return HttpResponse.json({
            data: [
              {
                id: "page_123",
                instagram_business_account: { id: "ig_456" },
              },
            ],
          });
        }),
      );

      // Call 1: Exchange code (with retry)
      const tokenResult = await instagram.exchangeCodeForToken("test_code_seq");
      expect(oauthAttempts).toBeGreaterThanOrEqual(1);

      // Call 2: Get accounts (with retry)
      const accounts = await instagram.getInstagramAccounts(
        tokenResult.access_token,
      );
      expect(accountsAttempts).toBeGreaterThanOrEqual(1);
      expect(accounts[0].id).toBe("page_123");
    });
  });

  describe("Retry Exhaustion", () => {
    it("should provide meaningful error after retry exhaustion", async () => {
      server.use(
        http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, () => {
          return HttpResponse.json(
            { error: { message: "Persistent service error" } },
            { status: 503 },
          );
        }),
      );

      const code = "test_code_exhausted";

      try {
        await instagram.exchangeCodeForToken(code);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeTruthy();
      }
    });
  });
});
