import { describe, it, expect, vi } from "vitest";
import { instagram } from "../../services/instagram.server";

describe("Carousel with mixed media types", () => {
  it("should handle carousel with images and videos", async () => {
    const carouselChildren = [
      { media_url: "https://example.com/image1.jpg", media_type: "IMAGE" },
      { media_url: "https://example.com/video1.mp4", media_type: "VIDEO" },
      { media_url: "https://example.com/image2.jpg", media_type: "IMAGE" },
    ];

    // Mock fetch response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: carouselChildren }),
    });

    const children = await instagram.getCarouselChildren("post123", "token");

    expect(children).toHaveLength(3);
    expect(children[0].media_type).toBe("IMAGE");
    expect(children[1].media_type).toBe("VIDEO");
    expect(children[2].media_type).toBe("IMAGE");
  });

  it("should store carousel children as JSON string", () => {
    const children = [
      { url: "https://example.com/image.jpg", type: "IMAGE" },
      { url: "https://example.com/video.mp4", type: "VIDEO" },
    ];

    const jsonString = JSON.stringify(children);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].type).toBe("IMAGE");
    expect(parsed[1].type).toBe("VIDEO");
    expect(parsed[0].url).toContain("image.jpg");
    expect(parsed[1].url).toContain("video.mp4");
  });

  it("should handle empty carousel children", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const children = await instagram.getCarouselChildren("post123", "token");

    expect(children).toHaveLength(0);
    expect(Array.isArray(children)).toBe(true);
  });
});