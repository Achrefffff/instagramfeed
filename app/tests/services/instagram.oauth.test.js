import { describe, it, expect, vi, beforeEach } from "vitest";
import { instagram } from "../../services/instagram.server.js";

describe("Instagram OAuth - Complete Flow", () => {
  describe("getAuthUrl", () => {
    it("should generate correct OAuth URL with all required parameters", () => {
      const state = "shop.myshopify.com-1234567890";
      const url = instagram.getAuthUrl(state);

      expect(url).toContain("https://www.facebook.com/v18.0/dialog/oauth");
      expect(url).toContain(`client_id=${process.env.INSTAGRAM_APP_ID}`);
      expect(url).toContain(
        `redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}`,
      );
      expect(url).toContain(`state=${state}`);
      expect(url).toContain("instagram_basic");
      expect(url).toContain("instagram_manage_insights");
      expect(url).toContain("pages_show_list");
      expect(url).toContain("response_type=code");
    });

    it("should throw error if state is missing", () => {
      expect(() => instagram.getAuthUrl("")).toThrow(
        "State parameter is required",
      );
      expect(() => instagram.getAuthUrl(null)).toThrow(
        "State parameter is required",
      );
      expect(() => instagram.getAuthUrl(undefined)).toThrow(
        "State parameter is required",
      );
    });

    it("should handle special characters in state", () => {
      const stateWithSpecialChars = "shop.myshopify.com-1234567890!@#$";
      const url = instagram.getAuthUrl(stateWithSpecialChars);

      expect(url).toContain("https://www.facebook.com/v18.0/dialog/oauth");
      expect(url).toContain("client_id=");
      expect(url).toContain("state=");
      expect(url).toBeTruthy();
    });
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange authorization code for short-lived token", async () => {
      const code = "test_code_abc123def456";

      const result = await instagram.exchangeCodeForToken(code);

      expect(result).toHaveProperty("access_token");
      expect(result.access_token).toContain("test_long_lived_token");
      expect(result).toHaveProperty("token_type", "bearer");
      expect(result).toHaveProperty("expires_in");
      expect(result.expires_in).toBe(5184000); // ~60 jours
    });

    it("should throw error if code is missing", async () => {
      await expect(instagram.exchangeCodeForToken("")).rejects.toThrow(
        "Authorization code is required",
      );
      await expect(instagram.exchangeCodeForToken(null)).rejects.toThrow(
        "Authorization code is required",
      );
    });
  });

  describe("getLongLivedToken", () => {
    it("should exchange short-lived token for long-lived token", async () => {
      const shortLivedToken = "short_lived_token_xyz";

      const result = await instagram.getLongLivedToken(shortLivedToken);

      expect(result).toHaveProperty("access_token");
      expect(result.access_token).toContain("test_long_lived_token");
      expect(result.expires_in).toBe(5184000); // ~60 jours
    });

    it("should throw error if short-lived token is missing", async () => {
      await expect(instagram.getLongLivedToken("")).rejects.toThrow(
        "Short-lived token is required",
      );
      await expect(instagram.getLongLivedToken(null)).rejects.toThrow(
        "Short-lived token is required",
      );
    });
  });

  describe("getInstagramAccounts", () => {
    it("should fetch connected Instagram accounts", async () => {
      const token = "test_long_lived_token_12345";

      const accounts = await instagram.getInstagramAccounts(token);

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0]).toHaveProperty("id", "page_123");
      expect(accounts[0]).toHaveProperty("name", "Test Page");
      expect(accounts[0]).toHaveProperty("instagram_business_account");
    });

    it("should throw error if token is missing", async () => {
      await expect(instagram.getInstagramAccounts("")).rejects.toThrow(
        "Access token is required",
      );
      await expect(instagram.getInstagramAccounts(null)).rejects.toThrow(
        "Access token is required",
      );
    });
  });

  describe("getInstagramBusinessAccount", () => {
    it("should extract Instagram business account ID from page", async () => {
      const pageId = "page_123";
      const token = "test_long_lived_token_12345";

      const accountId = await instagram.getInstagramBusinessAccount(
        pageId,
        token,
      );

      expect(accountId).toBe("ig_account_789");
    });

    it("should throw error if pageId or token is missing", async () => {
      await expect(
        instagram.getInstagramBusinessAccount("", "token"),
      ).rejects.toThrow("Page ID and access token are required");
      await expect(
        instagram.getInstagramBusinessAccount("page_123", ""),
      ).rejects.toThrow("Page ID and access token are required");
    });
  });

  describe("getInstagramUsername", () => {
    it("should fetch Instagram username", async () => {
      const instagramAccountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const username = await instagram.getInstagramUsername(
        instagramAccountId,
        token,
      );

      expect(username).toBe("test_username");
    });
  });

  describe("Complete OAuth Flow", () => {
    it("should complete full OAuth flow from code to username", async () => {
      // Step 1: Exchange code for token
      const code = "test_code_complete_flow_123";
      const tokenResult = await instagram.exchangeCodeForToken(code);
      expect(tokenResult.access_token).toBeDefined();

      // Step 2: Get Instagram accounts
      const accounts = await instagram.getInstagramAccounts(
        tokenResult.access_token,
      );
      expect(accounts.length).toBeGreaterThan(0);

      // Step 3: Get Instagram business account
      const pageWithInstagram = accounts.find(
        (p) => p.instagram_business_account,
      );
      const igAccountId = pageWithInstagram.instagram_business_account.id;

      // Step 4: Get username
      const username = await instagram.getInstagramUsername(
        igAccountId,
        tokenResult.access_token,
      );
      expect(username).toBe("test_username");

      // Step 5: Verify all data is consistent
      expect(tokenResult).toHaveProperty("access_token");
      expect(tokenResult).toHaveProperty("expires_in", 5184000);
    });
  });
});
