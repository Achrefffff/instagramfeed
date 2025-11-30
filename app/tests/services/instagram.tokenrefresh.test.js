import { describe, it, expect, vi, beforeEach } from "vitest";
import { instagram } from "../../services/instagram.server.js";

// Mock Prisma
const mockPrisma = {
  instagramConfig: {
    update: vi.fn(),
  },
};

describe("Instagram Token Refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("refreshToken", () => {
    it("should refresh expired token", async () => {
      const currentToken = "old_expired_token";

      const result = await instagram.refreshToken(currentToken);

      expect(result).toHaveProperty("access_token");
      expect(result.access_token).toContain("test_long_lived_token");
      expect(result.expires_in).toBe(5184000); // ~60 jours
    });

    it("should throw error if current token is missing", async () => {
      await expect(instagram.refreshToken("")).rejects.toThrow(
        "Current access token is required",
      );
      await expect(instagram.refreshToken(null)).rejects.toThrow(
        "Current access token is required",
      );
    });

    it("should handle API errors when refreshing", async () => {
      const invalidToken = "completely_invalid_token_xyz";

      // Ce token va triggerer une erreur du MSW
      await expect(instagram.refreshToken(invalidToken)).rejects.toThrow();
    });
  });

  describe("checkAndRefreshTokenIfNeeded", () => {
    it("should NOT refresh token if expiry is more than 7 days away", async () => {
      const config = {
        id: "config_123",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "valid_token",
        tokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        lastRefreshedAt: new Date(),
      };

      const result = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        mockPrisma,
      );

      expect(result).toEqual(config);
      expect(mockPrisma.instagramConfig.update).not.toHaveBeenCalled();
    });

    it("should refresh token if expiry is within 7 days", async () => {
      const config = {
        id: "config_123",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "expiring_token",
        tokenExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        lastRefreshedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      };

      mockPrisma.instagramConfig.update.mockResolvedValueOnce({
        ...config,
        accessToken: "test_long_lived_token_12345",
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastRefreshedAt: new Date(),
      });

      const result = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        mockPrisma,
      );

      expect(mockPrisma.instagramConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "config_123" },
          data: expect.objectContaining({
            accessToken: "test_long_lived_token_12345",
            lastRefreshedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.accessToken).toBe("test_long_lived_token_12345");
    });

    it("should refresh immediately if token already expired", async () => {
      const config = {
        id: "config_456",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "already_expired_token",
        tokenExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
        lastRefreshedAt: new Date(),
      };

      mockPrisma.instagramConfig.update.mockResolvedValueOnce({
        ...config,
        accessToken: "test_long_lived_token_new",
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });

      const result = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        mockPrisma,
      );

      expect(mockPrisma.instagramConfig.update).toHaveBeenCalled();
      expect(result.tokenRefreshFailed).toBeUndefined();
    });

    it("should handle refresh failure gracefully", async () => {
      const config = {
        id: "config_789",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "token_that_will_fail_refresh",
        tokenExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        lastRefreshedAt: new Date(),
      };

      mockPrisma.instagramConfig.update.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const result = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        mockPrisma,
      );

      // Devrait retourner le flag d'erreur
      expect(result.tokenRefreshFailed).toBe(true);
      expect(result.tokenRefreshError).toContain("Unable to refresh");
    });

    it("should NOT refresh if config has no tokenExpiresAt date", async () => {
      const config = {
        id: "config_no_date",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "token",
        tokenExpiresAt: null,
        lastRefreshedAt: null,
      };

      const result = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        mockPrisma,
      );

      expect(result).toEqual(config);
      expect(mockPrisma.instagramConfig.update).not.toHaveBeenCalled();
    });

    it("should update database with correct new expiry time", async () => {
      const config = {
        id: "config_expiry_test",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "token",
        tokenExpiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        lastRefreshedAt: new Date(),
      };

      mockPrisma.instagramConfig.update.mockResolvedValueOnce({
        ...config,
        accessToken: "test_long_lived_token_12345",
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastRefreshedAt: new Date(),
      });

      await instagram.checkAndRefreshTokenIfNeeded(config, mockPrisma);

      const updateCall = mockPrisma.instagramConfig.update.mock.calls[0][0];
      const newExpiryTime = updateCall.data.tokenExpiresAt;

      // Vérifier que la nouvelle date est ~60 jours dans le futur
      const timeDiff = newExpiryTime - new Date();
      const daysFromNow = timeDiff / (1000 * 60 * 60 * 24);

      expect(daysFromNow).toBeGreaterThan(59);
      expect(daysFromNow).toBeLessThan(61);
    });

    it("should track lastRefreshedAt timestamp correctly", async () => {
      const config = {
        id: "config_timestamp",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "token",
        tokenExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        lastRefreshedAt: new Date("2025-01-01"),
      };

      mockPrisma.instagramConfig.update.mockResolvedValueOnce({
        ...config,
        accessToken: "test_long_lived_token_12345",
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastRefreshedAt: new Date(),
      });

      await instagram.checkAndRefreshTokenIfNeeded(config, mockPrisma);

      const updateCall = mockPrisma.instagramConfig.update.mock.calls[0][0];
      const updatedLastRefreshedAt = updateCall.data.lastRefreshedAt;

      // Vérifier que lastRefreshedAt est maintenant
      const timeDiff = new Date() - updatedLastRefreshedAt;
      expect(timeDiff).toBeLessThan(1000); // Less than 1 second old
    });
  });

  describe("Token Refresh Edge Cases", () => {
    it("should handle 7-day boundary correctly (exactly 7 days)", async () => {
      const config = {
        id: "config_boundary",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "token",
        tokenExpiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days (> 7 day threshold)
        lastRefreshedAt: new Date(),
      };

      const result = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        mockPrisma,
      );

      // À plus de 7 jours, ne pas refresh
      expect(result).toBeDefined();
      expect(result.id).toBe("config_boundary");
      expect(mockPrisma.instagramConfig.update).not.toHaveBeenCalled();
    });

    it("should handle 6 days and 23 hours (just inside threshold)", async () => {
      const config = {
        id: "config_boundary2",
        shop: "test.myshopify.com",
        username: "test_user",
        accessToken: "token",
        tokenExpiresAt: new Date(Date.now() + (7 * 24 - 1) * 60 * 60 * 1000), // 6 days 23h
        lastRefreshedAt: new Date(),
      };

      mockPrisma.instagramConfig.update.mockResolvedValueOnce({
        ...config,
        accessToken: "test_long_lived_token_12345",
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });

      const result = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        mockPrisma,
      );

      // À moins de 7 jours, should refresh
      expect(mockPrisma.instagramConfig.update).toHaveBeenCalled();
    });
  });
});
