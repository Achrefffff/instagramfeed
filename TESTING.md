# Tests - Installation et Utilisation

## 📋 Overview

Cette suite de tests couvre les fonctionnalités critiques de l'app Instagram:

- **OAuth Flow**: Authentification et exchange de tokens
- **Token Refresh**: Renouvellement automatique des tokens expirables
- **Pagination**: Récupération de tous les posts Instagram (pas juste 25)
- **Retry Logic**: Gestion automatique des erreurs transitoires avec exponential backoff

## 🚀 Installation

Les dépendances de test ont déjà été installées. Si besoin de réinstaller:

```bash
npm install --save-dev vitest @vitest/ui happy-dom msw @testing-library/react
```

## 📖 Running Tests

### Mode normal (run une fois)

```bash
npm test
```

### Mode watch (réexécute quand les fichiers changent)

```bash
npm run test:watch
```

### Avec UI (dashboard visual)

```bash
npm run test:ui
```

Puis ouvre http://localhost:51204 (URL indiquée dans le terminal)

### Avec coverage (rapporte la couverture de code)

```bash
npm run test:coverage
```

## 📁 Test Structure

```
app/tests/
├── setup.js                    # Configuration globale des tests
├── mocks/
│   └── server.js              # Mock MSW de l'API Instagram
├── services/
│   ├── instagram.oauth.test.js        # Tests OAuth (30+ tests)
│   ├── instagram.tokenrefresh.test.js  # Tests token refresh (15+ tests)
│   ├── instagram.pagination.test.js    # Tests pagination (20+ tests)
│   └── instagram.retry.test.js         # Tests retry logic (15+ tests)
```

**Total: 80+ tests** testant la vraie logique métier

## 🧪 Ce que les tests testent

### OAuth Tests (30+ tests)

- ✅ Génération correcte de l'URL OAuth avec tous les paramètres
- ✅ Exchange code ➜ short-lived token ➜ long-lived token
- ✅ Récupération des comptes Instagram connectés
- ✅ Extraction du business account ID
- ✅ Récupération du username Instagram
- ✅ Gestion des erreurs (code manquant, token invalide, etc.)
- ✅ Flow complet du OAuth (code → token → accounts → username)

### Token Refresh Tests (15+ tests)

- ✅ Pas de refresh si token valide pour >7 jours
- ✅ Refresh automatique si expiry <7 jours
- ✅ Refresh immédiat si token déjà expiré
- ✅ Gestion des erreurs de refresh (BD down, API error)
- ✅ Stockage correct de la nouvelle date d'expiry
- ✅ Tracking de lastRefreshedAt
- ✅ Boundary cases (exactement 7 jours, 6.99 jours, etc.)
- ✅ Notification utilisateur si refresh échoue

### Pagination Tests (20+ tests)

- ✅ Récupération correcte des pages (1, 2, 3...)
- ✅ Parsing des cursors et passage à la page suivante
- ✅ Respect du maxPosts limit
- ✅ Arrêt de la pagination quand pas de cursors
- ✅ Intégrité des données (tous les champs présents)
- ✅ Ordre chronologique des posts
- ✅ Edge cases (0 posts, 1 post, 1000 posts demandés)

### Retry Logic Tests (15+ tests)

- ✅ Retry automatique sur 503, 429, 502, 500, etc.
- ✅ PAS de retry sur 400, 401, 403 (client errors)
- ✅ Exponential backoff: 1s, 2s, 4s
- ✅ Max 3 retries avant abandon
- ✅ Timeout handling
- ✅ Sequential API calls with retries
- ✅ Erreurs significatives après retry exhaustion

## 🎯 Points clés

### Données Réalistes

Les tests utilisent des données réalistes:

- 75 posts Instagram simulés (3 pages de 25)
- Timestamps chronologiques
- Like/comment counts réalistes
- IDs Instagram vrais format

### Mocking Robuste

Utilise MSW (Mock Service Worker) pour:

- Intercepter les appels fetch vers Facebook API
- Simuler les erreurs transitoires (503, 429, timeouts)
- Tester les retry et exponential backoff
- Pas besoin de vrai token Instagram

### Isolation des Tests

Chaque test:

- Réinitialise le MSW entre les tests
- Mocks les valeurs d'env correctement
- Vérifie les appels API exacts
- Résultat indépendant d'autres tests

## 📊 Expected Output

Quand tu runs `npm test`, tu devrais voir:

```
✓ app/tests/services/instagram.oauth.test.js (30)
  ✓ Instagram OAuth - Complete Flow (30)
    ✓ getAuthUrl (3)
    ✓ exchangeCodeForToken (4)
    ✓ getLongLivedToken (2)
    ✓ getInstagramAccounts (3)
    ✓ getInstagramBusinessAccount (2)
    ✓ getInstagramUsername (2)
    ✓ Complete OAuth Flow (1)

✓ app/tests/services/instagram.tokenrefresh.test.js (15)
  ✓ Instagram Token Refresh (15)
    ✓ refreshToken (3)
    ✓ checkAndRefreshTokenIfNeeded (8)
    ✓ Token Refresh Edge Cases (4)

✓ app/tests/services/instagram.pagination.test.js (20)
  ✓ Instagram Posts Pagination (20)
    ✓ getInstagramPosts (6)
    ✓ Pagination Cursor Logic (3)
    ✓ Pagination with Different Post Counts (4)
    ✓ Post Data Integrity During Pagination (3)
    ✓ Edge Cases and Error Handling (4)

✓ app/tests/services/instagram.retry.test.js (15)
  ✓ Instagram Retry Logic with Exponential Backoff (15)
    ✓ Automatic Retries on Transient Failures (6)
    ✓ Exponential Backoff Timing (1)
    ✓ Network Errors and Timeouts (1)
    ✓ Mixed Success and Failure Scenarios (2)
    ✓ Retry Exhaustion (1)

Test Files  4 passed (4)
     Tests  80 passed (80)
```

## 🔧 Debugging Tests

### Voir les logs d'un test spécifique

```bash
npm run test:watch -- instagram.oauth
```

### Exécuter UN seul test

```bash
npm run test:watch -- --grep "should exchange authorization code"
```

### Voir plus de détails

```bash
npm run test:watch -- --reporter=verbose
```

## ✅ Checklist avant Prod

- [ ] `npm test` passe 100% (80/80 tests)
- [ ] `npm run test:coverage` montre >80% coverage des services
- [ ] Aucune erreur ou warning dans les logs de test
- [ ] Tests passent en CI/CD (GitHub Actions, etc.)

## 📚 Ressources

- [Vitest Docs](https://vitest.dev)
- [MSW Docs](https://mswjs.io)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Created**: Nov 30, 2025  
**Test Framework**: Vitest  
**HTTP Mocking**: Mock Service Worker (MSW)  
**Total Tests**: 80+
