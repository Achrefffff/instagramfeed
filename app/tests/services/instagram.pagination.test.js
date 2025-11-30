import { describe, it, expect, vi, beforeEach } from "vitest";
import { instagram } from "../../services/instagram.server.js";

describe("Instagram Posts Pagination", () => {
  describe("getInstagramPosts", () => {
    it("should fetch first page of posts (25 posts)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 25);

      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBe(25);
      expect(posts[0]).toHaveProperty("id");
      expect(posts[0]).toHaveProperty("caption");
      expect(posts[0]).toHaveProperty("media_type");
      expect(posts[0]).toHaveProperty("media_url");
      expect(posts[0]).toHaveProperty("permalink");
      expect(posts[0]).toHaveProperty("timestamp");
    });

    it("should fetch all 75 posts with pagination (3 pages)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 500);

      // MSW mock retourne 75 posts en total (3 pages de 25)
      expect(posts.length).toBe(75);

      // Vérifier que les IDs sont incrémentés (post_1 à post_75)
      expect(posts[0].id).toBe("post_1");
      expect(posts[24].id).toBe("post_25");
      expect(posts[49].id).toBe("post_50");
      expect(posts[74].id).toBe("post_75");
    });

    it("should respect maxPosts limit", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const postsLimit50 = await instagram.getInstagramPosts(
        accountId,
        token,
        50,
      );
      expect(postsLimit50.length).toBe(50);

      const postsLimit100 = await instagram.getInstagramPosts(
        accountId,
        token,
        100,
      );
      expect(postsLimit100.length).toBe(75); // Only 75 available
    });

    it("should handle default maxPosts parameter (500)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token); // No maxPosts param

      expect(posts.length).toBe(75); // Gets all 75 available
    });

    it("should throw error if accountId is missing", async () => {
      const token = "test_long_lived_token_12345";

      await expect(instagram.getInstagramPosts("", token)).rejects.toThrow(
        "Instagram account ID and access token are required",
      );
      await expect(instagram.getInstagramPosts(null, token)).rejects.toThrow(
        "Instagram account ID and access token are required",
      );
    });

    it("should throw error if token is missing", async () => {
      const accountId = "ig_account_456";

      await expect(instagram.getInstagramPosts(accountId, "")).rejects.toThrow(
        "Instagram account ID and access token are required",
      );
      await expect(
        instagram.getInstagramPosts(accountId, null),
      ).rejects.toThrow("Instagram account ID and access token are required");
    });
  });

  describe("Pagination Cursor Logic", () => {
    it("should correctly parse and use cursor from paging.cursors.after", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      // This tests that the function correctly fetches all pages
      // by using the cursor from each response
      const posts = await instagram.getInstagramPosts(accountId, token, 500);

      // Vérifier que les posts sont dans l'ordre correct
      for (let i = 0; i < posts.length - 1; i++) {
        const currentPostNum = parseInt(posts[i].id.split("_")[1]);
        const nextPostNum = parseInt(posts[i + 1].id.split("_")[1]);

        // Les posts doivent être en ordre croissant
        expect(currentPostNum).toBeLessThan(nextPostNum);
      }
    });

    it("should stop pagination when no more cursors available", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 1000);

      // Même si on demande 1000 posts, il n'y en a que 75
      expect(posts.length).toBe(75);
    });

    it("should handle pagination with large maxPosts value", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 10000);

      // Should fetch all available posts (75) not just 25
      expect(posts.length).toBe(75);
    });
  });

  describe("Pagination with Different Post Counts", () => {
    it("should handle exactly one page (25 posts)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 25);

      expect(posts.length).toBe(25);
      expect(posts[0].id).toBe("post_1");
      expect(posts[24].id).toBe("post_25");
    });

    it("should handle between pages (30 posts)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 30);

      expect(posts.length).toBe(30);
      expect(posts[0].id).toBe("post_1");
      expect(posts[29].id).toBe("post_30");
    });

    it("should handle exactly two pages (50 posts)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 50);

      expect(posts.length).toBe(50);
      expect(posts[0].id).toBe("post_1");
      expect(posts[49].id).toBe("post_50");
    });

    it("should handle three pages (75 posts)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 75);

      expect(posts.length).toBe(75);
      expect(posts[0].id).toBe("post_1");
      expect(posts[74].id).toBe("post_75");
    });
  });

  describe("Post Data Integrity During Pagination", () => {
    it("should preserve all post fields across pagination", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 100);

      // Vérifier que chaque post a tous les champs requis
      posts.forEach((post) => {
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("caption");
        expect(post).toHaveProperty("media_type");
        expect(post).toHaveProperty("media_url");
        expect(post).toHaveProperty("permalink");
        expect(post).toHaveProperty("timestamp");
        expect(post).toHaveProperty("like_count");
        expect(post).toHaveProperty("comments_count");
      });
    });

    it("should have correct post data", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 30);

      // Vérifier les données du premier post
      expect(posts[0].caption).toContain("Test post 1");
      expect(posts[0].media_type).toBe("IMAGE");
      expect(posts[0].media_url).toContain("example.com");
      expect(posts[0].like_count).toBe(10);
      expect(posts[0].comments_count).toBe(1);

      // Vérifier les données du 30ème post
      expect(posts[29].caption).toContain("Test post 30");
      expect(posts[29].like_count).toBe(300);
      expect(posts[29].comments_count).toBe(30);
    });

    it("should maintain chronological order", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 75);

      // Les timestamps devraient être en ordre décroissant (plus récent d'abord)
      for (let i = 0; i < posts.length - 1; i++) {
        const currentTime = new Date(posts[i].timestamp);
        const nextTime = new Date(posts[i + 1].timestamp);

        expect(currentTime.getTime()).toBeGreaterThanOrEqual(
          nextTime.getTime(),
        );
      }
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle zero maxPosts gracefully", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 0);

      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBe(0);
    });

    it("should handle very small maxPosts (1)", async () => {
      const accountId = "ig_account_456";
      const token = "test_long_lived_token_12345";

      const posts = await instagram.getInstagramPosts(accountId, token, 1);

      expect(posts.length).toBe(1);
      expect(posts[0].id).toBe("post_1");
    });
  });
});
