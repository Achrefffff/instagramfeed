/**
 * Service Instagram pour gérer l'API Facebook/Instagram
 * Gère l'authentification OAuth et la récupération des données Instagram
 */

// Validation des variables d'environnement
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET || !REDIRECT_URI) {
  throw new Error(
    'Missing required Instagram environment variables: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI'
  );
}

// Constantes API
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

/**
 * Classe d'erreur personnalisée pour les erreurs Instagram API
 */
class InstagramAPIError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'InstagramAPIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Effectue une requête HTTP avec gestion d'erreurs
 */
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
  /**
   * Génère l'URL d'autorisation OAuth pour Instagram
   * @param {string} state - État de sécurité pour la requête OAuth
   * @returns {string} URL d'autorisation complète
   */
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

  /**
   * Échange le code d'autorisation contre un access token
   * @param {string} code - Code d'autorisation OAuth
   * @returns {Promise<Object>} Token data avec access_token
   */
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
    
    // Échanger le short-lived token contre un long-lived token (60 jours)
    return this.getLongLivedToken(data.access_token);
  },

  /**
   * Obtient un long-lived token (valide 60 jours)
   * @param {string} shortLivedToken - Token de courte durée
   * @returns {Promise<Object>} Token data avec access_token long-lived
   */
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

  /**
   * Récupère les pages Facebook liées avec Instagram Business Account
   * @param {string} accessToken - Token d'accès Facebook
   * @returns {Promise<Array>} Liste des pages avec comptes Instagram
   */
  async getInstagramAccounts(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const fields = 'id,name,instagram_business_account';
    const url = `${FACEBOOK_GRAPH_URL}/me/accounts?fields=${fields}&access_token=${accessToken}`;
    
    const data = await fetchWithErrorHandling(url);
    return data.data || [];
  },

  /**
   * Récupère l'ID du compte Instagram Business pour une page
   * @param {string} pageId - ID de la page Facebook
   * @param {string} accessToken - Token d'accès
   * @returns {Promise<string|undefined>} ID du compte Instagram Business
   */
  async getInstagramBusinessAccount(pageId, accessToken) {
    if (!pageId || !accessToken) {
      throw new Error('Page ID and access token are required');
    }

    const url = `${FACEBOOK_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);
    
    return data.instagram_business_account?.id;
  },

  /**
   * Récupère les posts Instagram avec statistiques
   * @param {string} instagramAccountId - ID du compte Instagram Business
   * @param {string} accessToken - Token d'accès
   * @returns {Promise<Array>} Liste des posts avec métadonnées
   */
  async getInstagramPosts(instagramAccountId, accessToken) {
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
    ].join(',');

    const url = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}/media?fields=${fields}&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);
    
    return data.data || [];
  },

  /**
   * Récupère les commentaires d'un post spécifique
   * @param {string} mediaId - ID du post Instagram
   * @param {string} accessToken - Token d'accès
   * @returns {Promise<Array>} Liste des commentaires
   */
  async getPostComments(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error('Media ID and access token are required');
    }

    const fields = 'id,text,username,timestamp';
    const url = `${FACEBOOK_GRAPH_URL}/${mediaId}/comments?fields=${fields}&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);
    
    return data.data || [];
  },
};

// Export de la classe d'erreur pour utilisation externe
export { InstagramAPIError };
