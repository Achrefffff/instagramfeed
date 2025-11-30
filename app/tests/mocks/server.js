import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const FACEBOOK_API_VERSION = "v18.0";
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export const handlers = [
  // Mock OAuth access token exchange
  http.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const grantType = url.searchParams.get("grant_type");

    // Échanger le code pour un token
    if (code && code.startsWith("test_code_")) {
      return HttpResponse.json({
        access_token: "test_short_lived_token_" + code.slice(10),
        token_type: "bearer",
        expires_in: 3600,
      });
    }

    // Échanger token court pour token long-lived
    if (grantType === "fb_exchange_token") {
      const fbExchangeToken = url.searchParams.get("fb_exchange_token");

      // Rejeter les tokens invalides
      if (fbExchangeToken && fbExchangeToken.startsWith("completely_invalid")) {
        return HttpResponse.json(
          { error: { message: "Invalid token" } },
          { status: 401 },
        );
      }

      return HttpResponse.json({
        access_token: "test_long_lived_token_12345",
        token_type: "bearer",
        expires_in: 5184000, // ~60 jours
      });
    }

    return HttpResponse.json(
      { error: { message: "Invalid parameters" } },
      { status: 400 },
    );
  }),

  // Mock Instagram accounts endpoint
  http.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, ({ request }) => {
    const token = new URL(request.url).searchParams.get("access_token");
    if (!token) {
      return HttpResponse.json(
        { error: { message: "Missing access token" } },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      data: [
        {
          id: "page_123",
          name: "Test Page",
          instagram_business_account: {
            id: "ig_account_456",
          },
        },
      ],
      paging: {
        cursors: {
          before: "cursor_before",
          after: "cursor_after",
        },
      },
    });
  }),

  // Mock Instagram username endpoint
  http.get(`${FACEBOOK_GRAPH_URL}/:accountId`, ({ params, request }) => {
    const token = new URL(request.url).searchParams.get("access_token");
    const fields = new URL(request.url).searchParams.get("fields");

    if (!token) {
      return HttpResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    if (fields === "username") {
      return HttpResponse.json({
        username: "test_username",
        id: params.accountId,
      });
    }

    return HttpResponse.json({
      instagram_business_account: {
        id: "ig_account_789",
      },
      id: params.accountId,
    });
  }),

  // Mock Instagram media/posts endpoint avec pagination
  http.get(`${FACEBOOK_GRAPH_URL}/:accountId/media`, ({ params, request }) => {
    const token = new URL(request.url).searchParams.get("access_token");
    const afterCursor = new URL(request.url).searchParams.get("after");

    if (!token) {
      return HttpResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    // Simuler 75 posts avec pagination par 25
    let postNumber = afterCursor ? parseInt(afterCursor) : 1;
    const posts = [];

    for (let i = 0; i < 25 && postNumber <= 75; i++, postNumber++) {
      posts.push({
        id: `post_${postNumber}`,
        caption: `Test post ${postNumber}`,
        media_type: "IMAGE",
        media_url: `https://example.com/post${postNumber}.jpg`,
        permalink: `https://instagram.com/p/post${postNumber}`,
        timestamp: new Date(Date.now() - postNumber * 86400000).toISOString(),
        like_count: 10 * postNumber,
        comments_count: postNumber,
      });
    }

    const response = {
      data: posts,
    };

    // Ajouter pagination cursors s'il y a plus de posts
    if (postNumber <= 75) {
      response.paging = {
        cursors: {
          before: String(Math.max(1, postNumber - 50)),
          after: String(postNumber),
        },
      };
    }

    return HttpResponse.json(response);
  }),

  // Mock Instagram insights endpoint
  http.get(`${FACEBOOK_GRAPH_URL}/:mediaId/insights`, ({ request }) => {
    const token = new URL(request.url).searchParams.get("access_token");

    if (!token) {
      return HttpResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      data: [
        {
          name: "reach",
          period: "lifetime",
          values: [{ value: 1500 }],
          title: "Reach",
        },
        {
          name: "saved",
          period: "lifetime",
          values: [{ value: 50 }],
          title: "Saved",
        },
      ],
      id: "post_insights",
    });
  }),

  // Mock carousel children endpoint
  http.get(`${FACEBOOK_GRAPH_URL}/:mediaId/children`, ({ request }) => {
    const token = new URL(request.url).searchParams.get("access_token");

    if (!token) {
      return HttpResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      data: [
        {
          id: "child_1",
          media_type: "IMAGE",
          media_url: "https://example.com/carousel1.jpg",
        },
        {
          id: "child_2",
          media_type: "IMAGE",
          media_url: "https://example.com/carousel2.jpg",
        },
      ],
    });
  }),
];

export const server = setupServer(...handlers);
