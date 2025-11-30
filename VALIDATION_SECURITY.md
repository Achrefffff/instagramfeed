# Documentation de Validation et Sécurité

## Vue d'ensemble

L'application implémente une validation robuste côté serveur avec Zod pour garantir la sécurité et l'intégrité des données.

## Librairie utilisée

**Zod** - Validation de schémas TypeScript-first avec inférence de types

## Fichier de validation centralisé

**Fichier**: `app/utils/validation.server.js`

### Schémas de validation

#### 1. `saveSelectionSchema`
Valide la sélection de posts Instagram

**Règles**:
- `selectedPostIds` doit être un tableau de nombres entiers positifs
- Minimum 1 post sélectionné
- Maximum 50 posts sélectionnés

**Exemple**:
```javascript
{
  selectedPostIds: [1, 2, 3, 4, 5]
}
```

---

#### 2. `instagramConnectSchema`
Valide les paramètres de connexion Instagram

**Règles**:
- `shop` doit être une chaîne non vide
- Format: `[nom].myshopify.com`
- Regex: `/^[a-zA-Z0-9-]+\.myshopify\.com$/`

**Exemple**:
```javascript
{
  shop: "ma-boutique.myshopify.com"
}
```

---

#### 3. `instagramCallbackSchema`
Valide les paramètres du callback OAuth Instagram

**Règles**:
- `code` requis (string non vide)
- `state` requis (string non vide)
- `error` optionnel
- `error_description` optionnel

**Exemple**:
```javascript
{
  code: "AQD...",
  state: "ma-boutique.myshopify.com-1234567890"
}
```

---

## Fonctions utilitaires

### `validateData(schema, data)`
Valide les données contre un schéma Zod

**Retour**:
```javascript
// Succès
{ success: true, data: validatedData }

// Échec
{ success: false, errors: [{ field: "fieldName", message: "Error message" }] }
```

---

### `sanitizeString(str)`
Nettoie et limite les chaînes de caractères

**Règles**:
- Supprime les espaces en début/fin (trim)
- Limite à 1000 caractères maximum
- Retourne chaîne vide si type invalide

---

### `isValidShopDomain(shop)`
Vérifie le format du domaine Shopify

**Retour**: `true` ou `false`

---

## Implémentation dans les routes

### ✅ Route: `api.instagram.save-selection`
**Validation**: `saveSelectionSchema`

**Protection**:
- Authentification Shopify Admin requise
- Validation du tableau de IDs (1-50 posts, entiers positifs)
- Vérification de l'existence des posts en base

---

### ✅ Route: `api.instagram.connect`
**Validation**: `instagramConnectSchema`

**Protection**:
- Validation du format du shop
- Vérification du domaine myshopify.com
- Regex stricte pour le format

---

### ✅ Route: `auth.instagram.callback`
**Validation**: `instagramCallbackSchema`

**Protection**:
- Validation des paramètres OAuth (code, state)
- Sanitization du username Instagram
- Vérification de l'expiration du state (5 minutes)
- Validation de la longueur du username (max 255 caractères)
- Protection contre les injections

---

### ✅ Route: `app._index` (action)
**Validation**: Manuelle

**Protection**:
- Authentification Shopify Admin requise
- Validation du type d'action (disconnect, disconnect_all)
- Validation de l'accountId (string non vide)
- Vérification de l'appartenance du compte au shop

---

### ✅ Route: `webhooks.shop.redact`
**Validation**: Manuelle + sanitization

**Protection**:
- Validation du shop_domain (string non vide)
- Sanitization du shop_domain
- Suppression sécurisée de toutes les données

---

### ✅ Route: `webhooks.customers.data_request`
**Validation**: Manuelle + sanitization

**Protection**:
- Validation du shop_domain (string non vide)
- Sanitization du shop_domain
- Accès sécurisé aux données customer (optional chaining)

---

### ✅ Route: `webhooks.customers.redact`
**Validation**: Manuelle + sanitization

**Protection**:
- Validation du shop_domain (string non vide)
- Sanitization du shop_domain
- Accès sécurisé aux données customer (optional chaining)

---

## Bonnes pratiques appliquées

### 1. Validation côté serveur systématique
✅ Toutes les entrées utilisateur sont validées
✅ Utilisation de schémas Zod typés
✅ Messages d'erreur clairs et localisés

### 2. Sanitization des données
✅ Nettoyage des chaînes de caractères
✅ Limitation de la longueur des inputs
✅ Validation des formats (regex)

### 3. Sécurité OAuth
✅ Validation du state parameter
✅ Vérification de l'expiration (5 min)
✅ Protection contre CSRF

### 4. Protection base de données
✅ Validation avant insertion
✅ Gestion des erreurs Prisma
✅ Logs sécurisés (pas de tokens en clair)

### 5. Authentification Shopify
✅ `authenticate.admin()` sur toutes les routes API
✅ Vérification de la session
✅ Protection CSRF intégrée

---

## Codes d'erreur HTTP

| Code | Signification | Utilisation |
|------|---------------|-------------|
| 400 | Bad Request | Validation échouée, paramètres invalides |
| 404 | Not Found | Ressource introuvable |
| 500 | Internal Server Error | Erreur serveur, base de données |

---

## Exemples de réponses d'erreur

### Validation échouée
```json
{
  "error": "Au moins un post doit être sélectionné",
  "errors": [
    {
      "field": "selectedPostIds",
      "message": "Au moins un post doit être sélectionné"
    }
  ]
}
```

### Format shop invalide
```json
{
  "error": "Format de shop invalide"
}
```

---

## Tests recommandés

### Test de validation
```javascript
import { validateData, saveSelectionSchema } from "~/utils/validation.server";

// Test valide
const result = validateData(saveSelectionSchema, {
  selectedPostIds: [1, 2, 3]
});
// result.success === true

// Test invalide
const result2 = validateData(saveSelectionSchema, {
  selectedPostIds: []
});
// result2.success === false
```

---

## Conformité Shopify

✅ **Authentification**: Utilisation de `authenticate.admin()`
✅ **Session**: Validation de la session Shopify
✅ **CSRF**: Protection intégrée via Shopify App Bridge
✅ **OAuth**: Flow sécurisé avec state parameter
✅ **Rate Limiting**: Géré par Shopify
✅ **HTTPS**: Obligatoire en production

---

## Améliorations futures possibles

- [ ] Rate limiting personnalisé par route
- [ ] Validation des webhooks avec HMAC
- [ ] Logs d'audit des validations échouées
- [ ] Métriques de sécurité (tentatives d'injection)
- [ ] Tests unitaires automatisés

---

## Dernière mise à jour
Date: 2024
Version: 1.0.0
