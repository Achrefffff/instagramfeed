# Documentation Rate Limiting

## Vue d'ensemble

Le rate limiting protège l'application contre les abus en limitant le nombre de requêtes par utilisateur/IP dans un temps donné.

## Pourquoi le Rate Limiting ?

**Protection contre** :
- ❌ Attaques DDoS (Denial of Service)
- ❌ Abus de l'API Instagram
- ❌ Spam de connexions
- ❌ Surcharge du serveur

## Implémentation

**Librairie** : `express-rate-limit`

**Fichier** : `app/utils/rateLimit.server.js`

---

## 3 Niveaux de Rate Limiting

### 1. `apiLimiter` - Général (Modéré)

**Limite** : 100 requêtes / 15 minutes

**Usage** : Routes API générales

**Exemple** :
```javascript
// 100 requêtes max par 15 min
// Si dépassé : 429 "Trop de requêtes"
```

**Headers retournés** :
- `RateLimit-Limit: 100`
- `RateLimit-Remaining: 95`
- `RateLimit-Reset: 1234567890`

---

### 2. `strictLimiter` - Strict (Actions sensibles)

**Limite** : 10 requêtes / 1 heure

**Usage** : Connexion Instagram, OAuth

**Exemple** :
```javascript
// 10 tentatives max par heure
// Si dépassé : 429 "Trop de tentatives, réessayez dans 1 heure"
```

**Protection contre** :
- Tentatives de connexion répétées
- Abus du flow OAuth
- Attaques par force brute

---

### 3. `saveLimiter` - Sauvegarde (Optimisé)

**Limite** : 20 requêtes / 5 minutes

**Usage** : Sauvegarde de posts Instagram

**Particularité** : `skipSuccessfulRequests: true`
- Ne compte QUE les échecs
- Les sauvegardes réussies ne sont pas comptées

**Exemple** :
```javascript
// 20 échecs max par 5 min
// Succès = pas compté
```

---

## Application par Route

### Routes avec `strictLimiter` (10/heure)
- ❌ **Non appliqué** - Remix ne supporte pas les middlewares Express classiques

### Solution Remix

**Problème** : Remix utilise React Router, pas Express directement

**Solution** : Rate limiting au niveau de chaque route avec stockage en mémoire

---

## Alternative pour Remix

### Système de Rate Limiting Manuel

**Fichier** : `app/utils/rateLimit.server.js` (à modifier)

```javascript
// Stockage en mémoire des tentatives
const attempts = new Map();

export function checkRateLimit(key, maxAttempts, windowMs) {
  const now = Date.now();
  const record = attempts.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  
  record.count++;
  attempts.set(key, record);
  
  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }
  
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime,
  };
}
```

---

## Utilisation dans les Routes

### Exemple : `api.instagram.connect`

```javascript
import { checkRateLimit } from "~/utils/rateLimit.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  // Rate limiting : 10 tentatives par heure
  const rateLimit = checkRateLimit(
    `connect:${shop}`,
    10,
    60 * 60 * 1000
  );
  
  if (!rateLimit.allowed) {
    logger.warn("Rate limit exceeded", { shop });
    return data(
      { error: "Trop de tentatives, réessayez dans 1 heure" },
      { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
      }
    );
  }
  
  // Suite du code...
};
```

---

## Bonnes Pratiques

### 1. Clés de Rate Limiting
✅ Utiliser `shop` comme clé (pas l'IP)
✅ Format : `action:shop` (ex: `connect:ma-boutique.myshopify.com`)
✅ Permet un rate limiting par marchand

### 2. Logging
✅ Logger tous les dépassements
✅ Inclure shop, IP, action
✅ Permet de détecter les abus

### 3. Headers HTTP
✅ Retourner `Retry-After` en secondes
✅ Informer l'utilisateur du temps d'attente
✅ Standard HTTP 429

### 4. Messages d'erreur
✅ Messages clairs en français
✅ Indiquer le temps d'attente
✅ Ne pas révéler les limites exactes (sécurité)

---

## Limites Recommandées

| Action | Limite | Fenêtre | Raison |
|--------|--------|---------|--------|
| Connexion Instagram | 10 | 1 heure | Protection OAuth |
| Sauvegarde posts | 20 | 5 minutes | Éviter spam |
| API générale | 100 | 15 minutes | Usage normal |
| Déconnexion compte | 20 | 15 minutes | Éviter abus |

---

## Monitoring

### Logs à surveiller
```json
{
  "level": "WARN",
  "message": "Rate limit exceeded",
  "shop": "ma-boutique.myshopify.com",
  "action": "connect",
  "ip": "192.168.1.1",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Métriques importantes
- Nombre de 429 par jour
- Shops les plus bloqués
- Actions les plus limitées
- Patterns d'abus

---

## Stockage

### En Mémoire (Actuel)
✅ Simple et rapide
❌ Perdu au redémarrage
❌ Ne fonctionne pas en multi-instance

### Redis (Production recommandée)
✅ Persistant
✅ Multi-instance
✅ Performant
❌ Infrastructure supplémentaire

---

## Migration vers Redis (Futur)

```javascript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(key, maxAttempts, windowMs) {
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  
  if (count > maxAttempts) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + (ttl * 1000),
    };
  }
  
  return {
    allowed: true,
    remaining: maxAttempts - count,
    resetTime: Date.now() + windowMs,
  };
}
```

---

## Tests

### Test de dépassement
```bash
# Faire 11 requêtes en 1 heure
for i in {1..11}; do
  curl http://localhost:3000/api/instagram/connect?shop=test.myshopify.com
  echo "Requête $i"
done

# La 11ème devrait retourner 429
```

### Test de reset
```bash
# Attendre 1 heure
sleep 3600

# Devrait fonctionner à nouveau
curl http://localhost:3000/api/instagram/connect?shop=test.myshopify.com
```

---

## Conformité Shopify

✅ **Protection API** : Évite les abus
✅ **Expérience utilisateur** : Messages clairs
✅ **Sécurité** : Protection contre attaques
✅ **Performance** : Évite surcharge serveur

---

## Prochaines Étapes

- [ ] Implémenter `checkRateLimit()` dans chaque route
- [ ] Ajouter les headers `Retry-After`
- [ ] Logger tous les dépassements
- [ ] Monitorer les métriques
- [ ] Migrer vers Redis en production

---

**Dernière mise à jour** : 2024
**Version** : 1.0.0
**Status** : ⚠️ À IMPLÉMENTER
