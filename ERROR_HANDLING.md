# Documentation de Gestion des Erreurs

## Vue d'ensemble

L'application implémente un système de gestion des erreurs centralisé et structuré selon les bonnes pratiques Shopify.

## Architecture

### 1. Système de Logging (`app/utils/logger.server.js`)

**Niveaux de log**:
- `ERROR` - Erreurs critiques nécessitant une attention immédiate
- `WARN` - Avertissements sur des situations anormales
- `INFO` - Informations sur les opérations importantes
- `DEBUG` - Détails de débogage (développement uniquement)

**Format structuré JSON**:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "error": "Connection timeout",
  "stack": "...",
  "shop": "ma-boutique.myshopify.com"
}
```

**Utilisation**:
```javascript
import { logger } from "~/utils/logger.server";

logger.error("Message d'erreur", error, { shop, userId });
logger.warn("Avertissement", { context });
logger.info("Opération réussie", { duration: 150 });
logger.debug("Détails de débogage", { data });
```

---

### 2. Classes d'Erreurs Personnalisées (`app/utils/errors.server.js`)

#### `ValidationError`
Erreurs de validation des données utilisateur

**Utilisation**:
```javascript
throw new ValidationError("Données invalides", [
  { field: "email", message: "Email requis" }
]);
```

#### `InstagramAPIError`
Erreurs liées aux appels API Instagram/Facebook

**Utilisation**:
```javascript
throw new InstagramAPIError("Token expiré", 401);
```

#### `DatabaseError`
Erreurs de base de données Prisma

**Utilisation**:
```javascript
throw new DatabaseError("Échec de l'insertion", prismaError);
```

---

### 3. Gestionnaire d'Erreurs Centralisé

**Fonction**: `handleError(error, context)`

**Avantages**:
- ✅ Logging automatique avec contexte
- ✅ Réponses HTTP appropriées
- ✅ Messages d'erreur localisés
- ✅ Masquage des détails sensibles

**Exemple**:
```javascript
try {
  // Code métier
} catch (error) {
  return handleError(error, { shop, action: "save-posts" });
}
```

---

## Implémentation par Route

### Routes API

#### `api.instagram.save-selection`
**Erreurs gérées**:
- ✅ ValidationError - Données de sélection invalides
- ✅ DatabaseError - Échec de lecture/écriture
- ✅ GraphQL errors - Erreurs metafields Shopify

**Logging**:
- INFO: Succès de sauvegarde avec durée
- WARN: Aucun post trouvé
- ERROR: Erreurs GraphQL et base de données

---

#### `auth.instagram.callback`
**Erreurs gérées**:
- ✅ ValidationError - Paramètres OAuth invalides
- ✅ InstagramAPIError - Échec API Instagram/Facebook
- ✅ DatabaseError - Échec de sauvegarde config

**Logging**:
- INFO: Configuration sauvegardée avec succès
- WARN: Aucune page Facebook trouvée
- ERROR: Échec OAuth, API, ou base de données

---

#### `app._index` (loader & action)
**Erreurs gérées**:
- ✅ DatabaseError - Échec de lecture/écriture
- ✅ Instagram API errors - Échec de synchronisation
- ✅ Auth errors - Désactivation automatique du compte

**Logging**:
- INFO: Déconnexion de compte réussie
- WARN: Compte introuvable, action invalide
- ERROR: Échec de synchronisation Instagram

---

### Webhooks GDPR

#### `webhooks.shop.redact`
**Erreurs gérées**:
- ✅ Validation du shop_domain
- ✅ Erreurs de suppression en cascade

**Logging**:
- INFO: Requête reçue et suppression réussie
- WARN: shop_domain invalide
- ERROR: Échec de suppression

---

#### `webhooks.customers.data_request`
**Erreurs gérées**:
- ✅ Validation du shop_domain
- ✅ Accès sécurisé aux données customer

**Logging**:
- INFO: Requête reçue
- WARN: shop_domain invalide

---

#### `webhooks.customers.redact`
**Erreurs gérées**:
- ✅ Validation du shop_domain
- ✅ Accès sécurisé aux données customer

**Logging**:
- INFO: Requête reçue
- WARN: shop_domain invalide

---

## Error Boundaries (Shopify App Bridge)

Toutes les routes utilisent les boundaries Shopify pour gérer les erreurs OAuth et App Bridge:

```javascript
import { boundary } from "@shopify/shopify-app-react-router/server";

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

**Avantages**:
- ✅ Redirection OAuth hors iframe
- ✅ Headers App Bridge corrects
- ✅ Gestion des erreurs d'authentification

---

## Bonnes Pratiques Appliquées

### 1. Logging Structuré
✅ Format JSON pour parsing automatique
✅ Contexte enrichi (shop, action, durée)
✅ Niveaux de log appropriés
✅ Logs de debug uniquement en développement

### 2. Gestion des Erreurs
✅ Classes d'erreurs typées
✅ Messages localisés en français
✅ Codes HTTP appropriés (400, 404, 500)
✅ Masquage des détails sensibles (tokens, stacks)

### 3. Monitoring
✅ Logs de performance (durée des opérations)
✅ Logs d'audit (connexion/déconnexion)
✅ Logs de sécurité (tentatives invalides)

### 4. Résilience
✅ Try-catch sur toutes les opérations I/O
✅ Désactivation automatique des comptes en erreur
✅ Gestion des erreurs asynchrones
✅ Fallback sur erreurs non gérées

---

## Codes d'Erreur HTTP

| Code | Type | Utilisation |
|------|------|-------------|
| 400 | Bad Request | Validation échouée, paramètres invalides |
| 404 | Not Found | Ressource introuvable |
| 500 | Internal Server Error | Erreur serveur, base de données, API externe |

---

## Exemples de Logs

### Succès
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Posts selection saved successfully",
  "shop": "ma-boutique.myshopify.com",
  "postsCount": 5,
  "duration": 150
}
```

### Avertissement
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "WARN",
  "message": "No posts found for selection",
  "shop": "ma-boutique.myshopify.com",
  "selectedPostIds": [1, 2, 3]
}
```

### Erreur
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "ERROR",
  "message": "Failed to fetch Instagram posts",
  "error": "Token expired",
  "stack": "Error: Token expired\n    at ...",
  "configId": "abc123",
  "username": "mon_compte"
}
```

---

## Monitoring en Production

### Recommandations
- [ ] Intégrer un service de monitoring (Sentry, LogRocket)
- [ ] Configurer des alertes sur les erreurs critiques
- [ ] Analyser les logs pour détecter les patterns
- [ ] Monitorer les taux d'erreur par route
- [ ] Suivre les performances (durées d'exécution)

### Variables d'environnement
```env
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=https://...
```

---

## Tests

### Test du système de logging
```javascript
import { logger } from "~/utils/logger.server";

// Test de chaque niveau
logger.error("Test error", new Error("Test"), { test: true });
logger.warn("Test warning", { test: true });
logger.info("Test info", { test: true });
logger.debug("Test debug", { test: true }); // Uniquement en dev
```

### Test du gestionnaire d'erreurs
```javascript
import { handleError, ValidationError } from "~/utils/errors.server";

const error = new ValidationError("Test", [{ field: "test" }]);
const response = handleError(error, { test: true });
// Vérifie status 400 et message d'erreur
```

---

## Conformité Shopify

✅ **Error Boundaries**: Implémentés sur toutes les routes
✅ **Logging structuré**: Format JSON parsable
✅ **Codes HTTP**: Standards respectés
✅ **Messages localisés**: Français pour l'utilisateur
✅ **Sécurité**: Pas de données sensibles dans les logs
✅ **Performance**: Logs de durée d'exécution

---

## Dernière mise à jour
Date: 2024
Version: 1.0.0
