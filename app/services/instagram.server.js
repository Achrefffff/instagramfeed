const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET || !REDIRECT_URI) {
  throw new Error(
    'Missing required Instagram environment variables: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI'
  );
}

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;
const OAUTH_SCOPES = [
  'instagram_basic',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
  'instagram_manage_comments',
  'instagram_manage_insights',
].join(',');

class InstagramAPIError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'InstagramAPIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new InstagramAPIError(
        data.error?.message || 'Instagram API request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof InstagramAPIError) {
      throw error;
    }
    throw new InstagramAPIError(
      `Network error: ${error.message}`,
      500,
      null
    );
  }
}

export const instagram = {
  getAuthUrl(state) {
    if (!state) {
      throw new Error('State parameter is required for OAuth');
    }

    const params = new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      redirect_uri: REDIRECT_URI,
      scope: OAUTH_SCOPES,
      response_type: 'code',
      state,
    });
    
    return `https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth?${params.toString()}`;
  },

  async exchangeCodeForToken(code) {
    if (!code) {
      throw new Error('Authorization code is required');
    }

    const params = new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    });

    const data = await fetchWithErrorHandling(
      `${FACEBOOK_GRAPH_URL}/oauth/access_token?${params.toString()}`
    );

    if (!data.access_token) {
      throw new InstagramAPIError('No access token in response', 500, data);
    }
    
    return this.getLongLivedToken(data.access_token);
  },

  async getLongLivedToken(shortLivedToken) {
    if (!shortLivedToken) {
      throw new Error('Short-lived token is required');
    }

    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    });

    return fetchWithErrorHandling(
      `${FACEBOOK_GRAPH_URL}/oauth/access_token?${params.toString()}`
    );
  },

  async getInstagramAccounts(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const fields = 'id,name,instagram_business_account';
    const url = `${FACEBOOK_GRAPH_URL}/me/accounts?fields=${fields}&access_token=${accessToken}`;
    
    const data = await fetchWithErrorHandling(url);
    return data.data || [];
  },

  async getInstagramBusinessAccount(pageId, accessToken) {
    if (!pageId || !accessToken) {
      throw new Error('Page ID and access token are required');
    }

    const url = `${FACEBOOK_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);
    
    return data.instagram_business_account?.id;
  },

  async getInstagramUsername(instagramAccountId, accessToken) {
    if (!instagramAccountId || !accessToken) {
      throw new Error('Instagram account ID and access token are required');
    }

    try {
      const url = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}?fields=username&access_token=${accessToken}`;
      const data = await fetchWithErrorHandling(url);
      return data.username || null;
    } catch (error) {
      return null;
    }
  },

  async getInstagramPosts(instagramAccountId, accessToken) {
    if (!instagramAccountId || !accessToken) {
      throw new Error('Instagram account ID and access token are required');
    }

    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'thumbnail_url',
      'permalink',
      'timestamp',
      'like_count',
      'comments_count',
    ].join(',');

    const url = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}/media?fields=${fields}&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);
    
    return data.data || [];
  },

  async getPostComments(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error('Media ID and access token are required');
    }

    const fields = 'id,text,username,timestamp';
    const url = `${FACEBOOK_GRAPH_URL}/${mediaId}/comments?fields=${fields}&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);
    
    return data.data || [];
  },

  async getPostInsights(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error('Media ID and access token are required');
    }

    const metrics = 'reach,saved';
    const url = `${FACEBOOK_GRAPH_URL}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;
    
    try {
      const data = await fetchWithErrorHandling(url);
      
      const insights = {};
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(metric => {
          insights[metric.name] = metric.values?.[0]?.value || 0;
        });
      }
      
      return {
        impressions: null,
        reach: insights.reach || 0,
        saved: insights.saved || 0,
      };
    } catch (error) {
      return {
        impressions: null,
        reach: null,
        saved: null,
      };
    }
  },

  async getTaggedPosts(instagramAccountId, accessToken) {
    if (!instagramAccountId || !accessToken) {
      throw new Error('Instagram account ID and access token are required');
    }

    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'permalink',
      'timestamp',
      'like_count',
      'comments_count',
      'username',
    ].join(',');

    const url = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}/tags?fields=${fields}&access_token=${accessToken}`;
    
    try {
      const data = await fetchWithErrorHandling(url);
      return data.data || [];
    } catch (error) {
      return [];
    }
  },

  async getMediaOwnerUsername(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error('Media ID and access token are required');
    }

    try {
      const url = `${FACEBOOK_GRAPH_URL}/${mediaId}?fields=username&access_token=${accessToken}`;
      const data = await fetchWithErrorHandling(url);
      return data.username || null;
    } catch (error) {
      return null;
    }
  },

  extractHashtags(caption) {
    console.log('Caption reçu:', caption);
    if (!caption) {
      console.log('Caption vide ou null');
      return null;
    }
    
    const hashtagRegex = /#[\wÀ-ſ]+/g;
    const hashtags = caption.match(hashtagRegex);
    console.log('Hashtags extraits:', hashtags);
    
    return hashtags ? hashtags.join(',') : null;
  },

  async getCarouselChildren(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error('Media ID and access token are required');
    }

    try {
      const fields = 'id,media_type,media_url';
      const url = `${FACEBOOK_GRAPH_URL}/${mediaId}/children?fields=${fields}&access_token=${accessToken}`;
      const data = await fetchWithErrorHandling(url);
      return data.data || [];
    } catch (error) {
      return [];
    }
  },

};

export { InstagramAPIError };
