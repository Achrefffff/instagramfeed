# Instructions Copilot - HOP (Flux Instagram pour Shopify)

## Vue d'ensemble de l'architecture

**HOP** est une application Shopify permettant aux commerçants de connecter plusieurs comptes Instagram Business pour afficher les posts directement dans l'admin Shopify. Stack technologique clé : React Router 7, Node.js, Prisma ORM avec PostgreSQL, API Facebook Graph v18.0.

### Flux de données principal

1. **Flux d'authentification** : Shopify → OAuth → API Instagram/Facebook Graph
2. **Synchronisation des données** : Charger configs de la BD → Récupérer posts via API Instagram → Stocker dans Prisma → Afficher dans l'UI
3. **Cycle de vie du token** : Les tokens longs terme expirent en ~60 jours → Auto-refresh 7 jours avant expiration

### Composants critiques

- **`app/shopify.server.js`** : Initialisation de l'app Shopify (stockage de session, version API October25)
- **`app/services/instagram.server.js`** : Tous les appels API Instagram/Facebook avec logique de retry
- **`prisma/schema.prisma`** : Deux modèles principaux : `InstagramConfig` (credentials), `InstagramPost` (données synchronisées)
- **`app/routes/app._index/route.jsx`** : Loader UI principal (549 lignes) - orchestre la récupération et l'état des posts

## Workflows développeur critiques

### Développement

```
npm run dev              # Démarrer le serveur dev Shopify (HMR activé)
npm run test            # Exécuter la suite vitest (100+ tests avec mocking MSW)
npm run typecheck       # Vérification TypeScript complète + codegen React Router
npm run build           # Build production (Vite)
```

### Base de données

```
npm run prisma migrate dev     # Créer/appliquer les migrations
npm run prisma studio         # Interface graphique pour l'inspection de la BD
npm run setup                 # Production : générer + déployer les migrations
```

**Pattern clé** : Les migrations vont dans `prisma/migrations/` avec des fichiers SQL. Toujours mettre à jour `schema.prisma` en premier, puis générer la migration.

### Tests

- **Setup** : `app/tests/setup.js` initialise MSW (Mock Service Worker) pour le mocking d'API
- **Config** : `vitest.config.js` - environnement Node, inclut la couverture pour `app/services/**` et `app/utils/**`
- **Fichiers de test** : Localisés dans `app/tests/` en miroir de la structure production (ex: `instagram.oauth.test.js`)

## Conventions spécifiques au projet

### Gestion des erreurs

Utiliser les classes d'erreurs personnalisées de `app/utils/errors.server.js` :

```javascript
import {
  ValidationError,
  InstagramAPIError,
  DatabaseError,
  handleError,
} from "../../utils/errors.server";

// Lancer des erreurs
throw new InstagramAPIError("Rate limited", 429);

// Dans les loaders/actions
return handleError(error, { shop: "...", action: "fetch_posts" });
```

### Validation

Toujours utiliser les schémas Zod de `app/utils/validation.server.js` avant de traiter les entrées non fiables :

```javascript
import {
  saveSelectionSchema,
  validateData,
} from "../../utils/validation.server";

const result = validateData(saveSelectionSchema, formData);
if (!result.success)
  return handleError(new ValidationError("Invalid", result.errors));
```

### Logging

Utiliser le logging JSON structuré de `app/utils/logger.server.js` :

```javascript
import { logger } from "../../utils/logger.server";

logger.info("Post fetch started", { shop, count: posts.length });
logger.warn("Token refresh failed", { error: err.message });
logger.error("Database connection lost", originalError, { context });
```

**Désactivé en dev** (affiche une sortie formatée), **JSON en production**.

### Rate Limiting

Les appels API sont protégés via `app/utils/rateLimit.server.js` (en mémoire, nettoyage 1 heure) :

```javascript
import { checkRateLimit, RATE_LIMITS } from "../../utils/rateLimit.server";

const limit = checkRateLimit(
  `connect:${shop}`,
  RATE_LIMITS.CONNECT_ATTEMPTS,
  3600000,
);
if (!limit.allowed)
  return data({ error: "Too many attempts" }, { status: 429 });
```

**Désactivé en NODE_ENV=development**.

### Internationalisation

i18n est configurée pour **en, fr, de, es** via `app/i18n.js` (détection navigateur + cache localStorage). Ajouter les traductions dans `app/locales/{lang}/common.json` puis utiliser `useTranslation()` dans les composants.

## Patterns critiques et points d'intégration

### Logique de retry Instagram API

**Fichier** : `app/services/instagram.server.js` (fonction retryWithBackoff)

Tous les appels API s'enroulent dans un retry avec **exponential backoff** (3 tentatives : délais 1s, 2s, 4s). Non-retryable : erreurs 4xx sauf 429 (rate limit). C'est **essentiel** pour la stabilité en production.

```javascript
async function retryWithBackoff(
  fn,
  maxRetries = 3,
  initialDelayMs = 1000,
  backoffMultiplier = 2,
) {
  // Exponential backoff avec gestion des 429
}
```

### Cycle de vie du rafraîchissement de token

**Fichier** : `app/services/instagram.server.js` (fonction checkAndRefreshTokenIfNeeded)

Les tokens longs terme Instagram expirent en ~60 jours. L'app les rafraîchit automatiquement 7 jours avant l'expiration :

1. Vérifier `tokenExpiresAt` dans la BD
2. Si dans les 7 jours, appeler Facebook Graph pour rafraîchir
3. Mettre à jour `accessToken` et `lastRefreshedAt` dans Prisma
4. Enregistrer les avertissements si le refresh échoue mais continuer (dégradation gracieuse)

### Gestion de la pagination

**Fichier** : `app/services/instagram.server.js` (fonction getInstagramPosts)

L'API Instagram Graph retourne 25 posts par page avec pagination basée sur curseurs. L'app **boucle jusqu'à pas de curseur suivant** (jusqu'à 500 posts). Chaque fetch de post obtient aussi les insights (impressions, portée, enregistrés) et les enfants du carrousel via Promise.all() parallèle.

### Pattern de synchronisation des données

**Loader principal** (`app._index/route.jsx`) :

1. Charger tous les enregistrements `InstagramConfig` actifs pour la boutique
2. Pour chaque config : récupérer les posts, rafraîchir le token si nécessaire, sauvegarder en BD
3. Grouper par compte, gérer séparément les posts taggés vs publiés
4. Retourner l'état UI combiné avec les drapeaux d'erreur/avertissement

**Insight clé** : La synchronisation se fait à chaque chargement de page (pas de tâche en arrière-plan). Le cache via React Router prévient les doubles récupérations.

### Architecture multi-comptes

- **`InstagramConfig`** stocke une config par compte (shop + username unique)
- **`InstagramPost`** a des champs `username` + `ownerUsername` pour tracker quel compte possède le post
- L'UI filtre les posts par compte Instagram sélectionné via des dropdowns dans les composants

## Fichiers importants à connaître

| Fichier                             | Objectif                                                |
| ----------------------------------- | ------------------------------------------------------- |
| `shopify.server.js`                 | Config et authentification Shopify                      |
| `services/instagram.server.js`      | Toute la logique API Instagram (488 lignes)             |
| `services/productTagging.server.js` | Tagging de produits Shopify via metafields (530 lignes) |
| `routes/app._index/route.jsx`       | Loader et état de la page principale (549 lignes)       |
| `utils/errors.server.js`            | Classes d'erreurs et gestionnaire centralisé            |
| `utils/logger.server.js`            | Logging structuré                                       |
| `utils/rateLimit.server.js`         | Middleware de rate limiting                             |
| `utils/validation.server.js`        | Schémas de validation Zod                               |
| `prisma/schema.prisma`              | Modèles de BD (Session, InstagramConfig, InstagramPost) |
| `vitest.config.js`                  | Config des tests et chemins de couverture               |
| `i18n.js`                           | Initialisation i18next                                  |

## Extension Shopify Theme - instahop

L'app inclut une extension theme (`extensions/instahop/`) qui affiche les posts Instagram dans les vitrines Shopify.

### Structure de l'extension

- **Type** : Extension theme (type: "theme")
- **Blocs Liquid** : `blocks/instagram-feed.liquid` (253 lignes) - bloc réutilisable pour afficher les posts
- **Assets** : `assets/instagram-lightbox.{css,js}` - lightbox pour visualiser les posts en détail
- **Locales** : `locales/en.default.json` - traductions pour l'interface du bloc
- **Snippets** : `snippets/stars.liquid` - composants réutilisables

### Bloc Instagram Feed (Liquid)

Le bloc `instagram-feed.liquid` affiche les posts sauvegardés dans les metafields shop :

- Récupère les posts via `shop.metafields.custom.instagram_selected_posts.value`
- Récupère les tags produit via `shop.metafields.custom.instagram_product_tags.value`
- Supporte deux layouts : **carousel** (défilement) et **grille** (affichage standard)
- Gère les vidéos avec thumbnail preview
- Détecte les carrousels Instagram et affiche les images enfants
- Lazy loading activé sur toutes les images

### Données stockées en metafields

Les posts sélectionnés depuis l'admin Shopify sont stockés comme metafields shop pour être accessibles au theme :

- `shop.metafields.custom.instagram_selected_posts` - Array de posts avec mediaUrl, mediaType, caption, etc.
- `shop.metafields.custom.instagram_product_tags` - Mapping posts → produits Shopify pour l'e-commerce

### Intégration avec l'admin

- L'action `api.product-tagging` (route) synchronise les tags produit avec les metafields
- L'action `api.instagram.save-selection` (route) sauvegarde les posts sélectionnés en metafields
- Ces données remontent automatiquement au theme via l'API Shopify

## Lors de l'ajout de fonctionnalités

1. **Nouveaux appels API ?** Ajouter à `instagram.server.js` avec logique de retry
2. **Nouvelle entrée utilisateur ?** Créer schéma Zod dans `validation.server.js` + valider tôt
3. **Nouveau modèle de BD ?** Mettre à jour `schema.prisma`, générer migration, exécuter `prisma migrate dev`
4. **Nouveau type d'erreur ?** Ajouter classe à `errors.server.js`, gérer dans les routes
5. **Nouvelle route/action ?** Ajouter fichier dans `app/routes/` (routage filesystem), envelopper dans `authenticate.admin()` si protégée
6. **Tests ?** Créer `.test.js` dans `app/tests/services/` ou `app/tests/utils/`, utiliser MSW pour le mocking HTTP

## Considérations pour la production

- **Fuite mémoire Prisma corrigée** : Le pattern singleton est correct (voir `app/db.server.js`)
- **Pas d'erreurs silencieuses** : Tous les catch blocs enregistrent via logger (pas de catch vides)
- **Expiration du token** : Le refresh automatique gère le cycle de vie de 60 jours avec buffer de 7 jours
- **Dégradation gracieuse** : Les défaillances d'insights des posts n'arrêtent pas la synchro principale ; enregistrées comme avertissements
- **Rate limiting** : Protéger le flux OAuth (3 tentatives/heure) et autres endpoints sensibles
- **Webhooks GDPR** : `webhooks.shop.redact` et `webhooks.customers.redact` suppriment les données utilisateur à la demande

---

## Référence rapide : Tâches courantes

**Déboguer un appel API défaillant** : Vérifier `app/services/instagram.server.js` pour la fonction, vérifier que la logique de retry se déclenche, consulter les logs pour l'erreur exacte. Chercher 429 (rate limit) vs 401 (token expiré).

**Ajouter un nouveau champ Instagram Graph** : Mettre à jour le paramètre `fields` dans l'appel API, mettre à jour le modèle Prisma si stocké, ajouter au composant UI.

**Enquêter sur un problème de performance** : Vérifier `app/routes/app._index/route.jsx` pour les fetchs parallèles via Promise.all(), chercher les requêtes N+1 dans Prisma.

**Tracer un rapport utilisateur** : Utiliser shop + username pour trouver l'enregistrement `InstagramConfig`, vérifier la date d'expiration du token, voir si les posts n'ont pas pu se synchroniser (chercher dans `InstagramPost` pour cet utilisateur).
