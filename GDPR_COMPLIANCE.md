# GDPR Compliance Documentation

## Vue d'ensemble

Cette application respecte le RGPD (Règlement Général sur la Protection des Données) en implémentant les 3 webhooks obligatoires de Shopify.

## Webhooks implémentés

### Webhooks de nettoyage des données

#### `app/uninstalled` ⚡ IMMÉDIAT
**Fichier**: `app/routes/webhooks.app.uninstalled.jsx`

**Déclenchement**: Immédiatement lors de la désinstallation de l'app

**Action**: Suppression immédiate de toutes les données :
1. ✅ Suppression des posts Instagram (`InstagramPost`)
2. ✅ Suppression des configurations Instagram (`InstagramConfig`)
3. ✅ Suppression des sessions Shopify (`Session`)

**Avantage**: Nettoyage immédiat sans attendre 48h

---

### Webhooks GDPR obligatoires

#### 1. `customers/data_request` 
**Fichier**: `app/routes/webhooks.customers.data_request.jsx`

**Déclenchement**: Quand un client demande l'accès à ses données personnelles

**Action**: 
- Retourne un message indiquant qu'aucune donnée client n'est stockée
- L'app ne stocke que des données Instagram du marchand, pas de données clients finaux

**Délai de réponse**: Immédiat (webhook synchrone)

---

### 2. `customers/redact`
**Fichier**: `app/routes/webhooks.customers.redact.jsx`

**Déclenchement**: Quand un propriétaire de boutique demande la suppression des données d'un client

**Action**:
- Retourne un message indiquant qu'aucune donnée client n'est à supprimer
- L'app ne collecte pas de données personnelles des clients finaux

**Délai de réponse**: 30 jours maximum (mais traité immédiatement)

---

#### 3. `shop/redact` ⚠️ CRITIQUE (Backup)
**Fichier**: `app/routes/webhooks.shop.redact.jsx`

**Déclenchement**: 48 heures après la désinstallation de l'app par le marchand

**Action**: Suppression complète de toutes les données du marchand (backup si app/uninstalled a échoué) :
1. ✅ Suppression des images de carrousels (`CarouselImage`)
2. ✅ Suppression des posts Instagram (`InstagramPost`)
3. ✅ Suppression des configurations Instagram (`InstagramConfig`)
4. ✅ Suppression des sessions Shopify (`Session`)

**Délai de réponse**: Immédiat (webhook synchrone)

**Rôle**: Filet de sécurité pour garantir la suppression même si le webhook app/uninstalled a échoué

**Données supprimées**:
- Tokens d'accès Instagram
- Posts Instagram (images, vidéos, carrousels)
- Statistiques (likes, commentaires, reach)
- Hashtags et légendes
- Configurations de comptes

---

## Configuration

Les webhooks sont configurés dans `shopify.app.toml` :

```toml
# Webhook de nettoyage immédiat
[[webhooks.subscriptions]]
topics = [ "app/uninstalled" ]
uri = "/webhooks/app/uninstalled"

# Webhooks GDPR obligatoires
[[webhooks.subscriptions]]
compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]
uri = "/webhooks"
```

---

## Données stockées

### Données du marchand (supprimées lors de shop/redact)
- ✅ Tokens d'accès Instagram (chiffrés)
- ✅ Username Instagram
- ✅ Posts Instagram (media_url, caption, timestamp)
- ✅ Statistiques (likes, comments, reach, impressions)
- ✅ Images de carrousels
- ✅ Sessions Shopify

### Données clients (NON stockées)
- ❌ Aucune donnée personnelle des clients finaux
- ❌ Aucune commande
- ❌ Aucun email ou téléphone de client

---

## Conformité RGPD

✅ **Droit à l'oubli**: Implémenté via `shop/redact` (48h) + `app/uninstalled` (immédiat)
✅ **Droit d'accès**: Implémenté via `customers/data_request`
✅ **Suppression des données**: 
  - Immédiate via `app/uninstalled`
  - Backup via `shop/redact` (48h après désinstallation)
✅ **Transparence**: Documentation claire des données stockées
✅ **Sécurité**: Tokens chiffrés, accès restreint
✅ **Double sécurité**: 2 webhooks de nettoyage pour garantir la suppression

---

## Test des webhooks

### En développement
```bash
# Tester app/uninstalled (nettoyage immédiat)
curl -X POST http://localhost:3000/webhooks/app/uninstalled \
  -H "Content-Type: application/json" \
  -d '{"shop_domain":"test-shop.myshopify.com"}'

# Tester shop/redact (backup GDPR)
curl -X POST http://localhost:3000/webhooks/shop/redact \
  -H "Content-Type: application/json" \
  -d '{"shop_domain":"test-shop.myshopify.com","shop_id":123456}'
```

### En production
Les webhooks sont automatiquement déclenchés par Shopify selon les événements.

---

## Logs et monitoring

Tous les webhooks GDPR sont loggés dans la console :
- Date et heure de réception
- Shop concerné
- Action effectuée
- Résultat (succès/erreur)

---

## Contact GDPR

Pour toute question relative à la protection des données :
- Email: [votre-email@example.com]
- Privacy Policy: [URL de votre politique de confidentialité]

---

## Dernière mise à jour
Date: 2024
Version: 1.0.0


Name
context7
Transport

stdio
Command
C:\Users\dorra\AppData\Roaming\npm\context7-mcp.cmd
