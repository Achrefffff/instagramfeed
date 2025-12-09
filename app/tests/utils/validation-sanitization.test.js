import { describe, it, expect } from "vitest";
import { 
  validateAndSanitizeInstagramPost, 
  sanitizeCaption,
  sanitizeHtml 
} from "../../utils/validation.server";

describe("Validation + HTML Sanitization", () => {
  describe("sanitizeHtml", () => {
    it("should remove script tags", () => {
      const malicious = 'Hello <script>alert("xss")</script> world!';
      const clean = sanitizeHtml(malicious);
      
      expect(clean).not.toContain("<script>");
      expect(clean).toContain("&lt;script&gt;"); // HTML escaped
      expect(clean).toContain("alert"); // Content preserved but escaped
      expect(clean).toContain("Hello");
      expect(clean).toContain("world!");
    });

    it("should escape HTML entities", () => {
      const html = 'Price: <b>$50</b> & "free" shipping';
      const clean = sanitizeHtml(html);
      
      expect(clean).toContain("&lt;b&gt;");
      expect(clean).toContain("&amp;");
      expect(clean).toContain("&quot;");
    });

    it("should preserve emojis and unicode", () => {
      const caption = "Amazing sunset! 🌅 #beautiful";
      const clean = sanitizeHtml(caption);
      
      expect(clean).toContain("🌅");
      expect(clean).toContain("#beautiful");
    });
  });

  describe("validateAndSanitizeInstagramPost", () => {
    const validPost = {
      id: "12345",
      caption: "Test post with <script>alert('xss')</script>",
      mediaUrl: "https://instagram.com/image.jpg",
      permalink: "https://instagram.com/p/abc123",
      publishedAt: new Date(),
      mediaType: "IMAGE",
      likeCount: 42,
      commentsCount: 5,
      isTagged: false,
      ownerUsername: "testuser",
      configId: "config123",
      shop: "test.myshopify.com"
    };

    it("should validate and sanitize valid post", () => {
      const result = validateAndSanitizeInstagramPost(validPost);
      
      expect(result.success).toBe(true);
      expect(result.data.caption).not.toContain("<script>");
      expect(result.data.mediaUrl).toBe(validPost.mediaUrl);
    });

    it("should reject post with invalid URL", () => {
      const invalidPost = {
        ...validPost,
        mediaUrl: "not-a-valid-url"
      };
      
      const result = validateAndSanitizeInstagramPost(invalidPost);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "mediaUrl" })
      );
    });

    it("should handle missing required fields", () => {
      const incompletePost = {
        caption: "Test",
        // Missing id, mediaUrl, etc.
      };
      
      const result = validateAndSanitizeInstagramPost(incompletePost);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});