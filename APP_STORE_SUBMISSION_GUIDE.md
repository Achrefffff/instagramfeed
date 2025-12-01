# Guide de Publication sur le Shopify App Store

## 📋 Vue d'ensemble

Pour publier ton app sur le Shopify App Store, tu dois :
1. ✅ **Héberger ton app toi-même** (Shopify n'héberge PAS les apps)
2. ✅ Avoir un **domaine personnalisé** avec HTTPS
3. ✅ Avoir une **base de données en production**
4. ✅ Soumettre ton app pour révision

---

## 🏗️ 1. HÉBERGEMENT (OBLIGATOIRE)

### ⚠️ Important
**Shopify ne fournit PAS d'hébergement pour les apps**. Tu dois héberger ton app sur ta propre infrastructure.

### Options d'hébergement recommandées

#### Option 1 : **Render.com** ⭐ (Recommandé pour tester)
- ✅ Plan gratuit permanent (750h/mois)
- ✅ HTTPS automatique
- ✅ Déploiement Git facile
- ⚠️ L'app "dort" après 15min d'inactivité (redémarre en ~30s)

**Coût** : Gratuit ou 7$/mois (sans sleep)

```bash
# Déploiement
1. Connecte ton repo GitHub sur render.com
2. Sélectionne "Web Service"
3. Configure les variables d'environnement
4. Déploie automatiquement
```

#### Option 2 : **Fly.io**
- ✅ 5$ de crédit gratuit/mois (carte bancaire requise)
- ✅ Support PostgreSQL intégré
- ✅ Déploiement facile avec Shopify CLI
- ✅ HTTPS automatique

**Coût** : ~10-15$/mois pour une petite app

```bash
# Installation
npm install -g flyctl
fly auth login

# Déploiement
fly launch
fly deploy
```

#### Option 3 : **Railway.app** ⭐ (Meilleur rapport qualité/prix)
- ✅ Interface simple
- ✅ PostgreSQL inclus
- ✅ HTTPS automatique
- ✅ Déploiement Git

**Coût** : ~5$/mois

#### Option 4 : **Heroku**
- ✅ Bien documenté
- ✅ Add-ons PostgreSQL
- ✅ HTTPS automatique

**Coût** : ~7$/mois (Eco Dynos)

#### Option 5 : **DigitalOcean / AWS / Azure**
- ✅ Plus de contrôle
- ❌ Configuration plus complexe
- ❌ Tu dois gérer HTTPS toi-même

**Coût** : ~10-20$/mois

---

## 🌐 2. DOMAINE (OBLIGATOIRE)

### Pourquoi un domaine ?
- ✅ **Obligatoire** pour le Shopify App Store
- ✅ URLs Cloudflare Tunnel ne sont PAS acceptées
- ✅ HTTPS requis (certificat SSL)

### Où acheter un domaine ?
- **Namecheap** : ~10$/an
- **Google Domains** : ~12$/an
- **OVH** : ~8€/an
- **Cloudflare** : ~10$/an

### Configuration DNS
Une fois ton app hébergée, configure ton domaine :

```
Type: A
Name: @
Value: [IP de ton serveur]

Type: CNAME
Name: www
Value: ton-domaine.com
```

Ou si tu utilises Fly.io/Railway :
```
Type: CNAME
Name: @
Value: ton-app.fly.dev
```

---

## 💾 3. BASE DE DONNÉES (OBLIGATOIRE)

### Tu utilises déjà PostgreSQL (Neon) ✅

Ton `.env` actuel :
```env
DATABASE_URL=postgresql://neondb_owner:npg_...@ep-billowing-frog-ahxjl0ic-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**C'est parfait !** Neon est gratuit jusqu'à 0.5GB et convient pour la production.

### Alternatives si besoin :
- **Neon** (actuel) : Gratuit jusqu'à 0.5GB ✅
- **Supabase** : Gratuit jusqu'à 500MB
- **Railway PostgreSQL** : ~5$/mois
- **Heroku Postgres** : ~5$/mois

---

## 📝 4. CHECKLIST AVANT SOUMISSION

### Configuration technique

- [ ] **App hébergée** sur un serveur avec domaine personnalisé
- [ ] **HTTPS activé** (certificat SSL valide)
- [ ] **Base de données** en production (✅ tu as déjà Neon)
- [ ] **Variables d'environnement** configurées en production
- [ ] **Webhooks GDPR** fonctionnels (✅ tu les as déjà)

### Configuration dans `shopify.app.toml`

```toml
application_url = "https://ton-domaine.com"

[auth]
redirect_urls = [
  "https://ton-domaine.com/auth/callback"
]
```

### Variables d'environnement production

```env
# Shopify
SHOPIFY_API_KEY=ton_api_key
SHOPIFY_API_SECRET=ton_api_secret
SHOPIFY_APP_URL=https://ton-domaine.com

# Database
DATABASE_URL=postgresql://...

# Instagram
INSTAGRAM_APP_ID=857704303426737
INSTAGRAM_APP_SECRET=2a07a34792fe1801d6130d20ec0b83fd
INSTAGRAM_REDIRECT_URI=https://ton-domaine.com/auth/instagram/callback
```

---

## 🚀 5. DÉPLOIEMENT

### Étape 1 : Build de production

```bash
npm ci
npm run build
```

### Étape 2 : Déployer l'app web

**Exemple avec Fly.io :**
```bash
fly launch
fly deploy
```

**Exemple avec Railway :**
1. Connecte ton repo GitHub
2. Railway détecte automatiquement Remix
3. Configure les variables d'environnement
4. Déploie automatiquement

### Étape 3 : Déployer la configuration Shopify

```bash
shopify app config use  # Sélectionne ton app de production
shopify app deploy      # Déploie les extensions et config
```

---

## 📤 6. SOUMISSION AU SHOPIFY APP STORE

### Prérequis

1. **Compte Shopify Partner** : https://partners.shopify.com
2. **App créée** dans le Partner Dashboard
3. **App testée** sur au moins 1 boutique de développement
4. **Documentation** prête (Privacy Policy, Support URL)

### Documents requis

- [ ] **Privacy Policy** (Politique de confidentialité)
- [ ] **Support URL** (Email ou page de support)
- [ ] **Description de l'app** (EN + FR recommandé)
- [ ] **Screenshots** (au moins 3-5 captures d'écran)
- [ ] **Logo de l'app** (512x512px minimum)
- [ ] **Vidéo démo** (optionnel mais recommandé)

### Processus de soumission

1. **Partner Dashboard** → Ton app → "Distribution"
2. Sélectionne **"Public distribution"**
3. Remplis le **App listing** :
   - Nom de l'app
   - Description courte (80 caractères max)
   - Description longue
   - Catégorie (ex: "Marketing", "Social Media")
   - Prix (Gratuit ou payant)
   - Screenshots
   - Logo
4. Ajoute les **URLs** :
   - Privacy Policy URL
   - Support URL
5. **Soumettre pour révision**

### Délai de révision
- ⏱️ **5-10 jours ouvrables** en moyenne
- Shopify teste ton app manuellement
- Ils vérifient la sécurité, performance, UX

---

## ✅ 7. CHECKLIST FINALE

### Avant de soumettre

- [ ] App hébergée sur un domaine personnalisé avec HTTPS
- [ ] Base de données en production (Neon ✅)
- [ ] Webhooks GDPR testés et fonctionnels
- [ ] App testée sur plusieurs boutiques de développement
- [ ] Aucune erreur dans les logs
- [ ] Performance acceptable (temps de chargement < 3s)
- [ ] Privacy Policy rédigée et hébergée
- [ ] Page de support créée
- [ ] Screenshots de qualité préparés
- [ ] Logo de l'app créé (512x512px)
- [ ] Description de l'app rédigée (EN + FR)

### Après soumission

- [ ] Répondre rapidement aux questions de Shopify
- [ ] Corriger les problèmes signalés
- [ ] Tester les modifications demandées
- [ ] Resoummettre si nécessaire

---

## 💰 8. COÛTS ESTIMÉS

### Minimum pour démarrer

| Service | Coût mensuel | Coût annuel |
|---------|--------------|-------------|
| **Domaine** | ~1€ | ~10€ |
| **Hébergement** (Fly.io/Railway) | ~5-10€ | ~60-120€ |
| **Base de données** (Neon gratuit) | 0€ | 0€ |
| **Total** | **~6-11€/mois** | **~70-130€/an** |

### Recommandation

**Pour tester gratuitement :**
- **Render.com** (gratuit avec sleep)
- **Domaine Namecheap** (~10$/an)
- **Neon PostgreSQL** (gratuit) ✅

**Total : ~10€/an**

**Pour production :**
- **Railway.app** (5$/mois) ⭐ Meilleur rapport qualité/prix
- **Domaine Namecheap** (~10$/an)
- **Neon PostgreSQL** (gratuit) ✅

**Total : ~70€/an**

---

## 🎯 9. PROCHAINES ÉTAPES

### Maintenant (avant soumission)

1. ✅ Acheter un domaine (~10€/an)
2. ✅ Choisir un hébergeur (Railway/Fly.io)
3. ✅ Déployer ton app en production
4. ✅ Configurer le domaine
5. ✅ Tester l'app en production
6. ✅ Rédiger Privacy Policy
7. ✅ Préparer screenshots et description

### Après déploiement

1. ✅ Créer le listing dans Partner Dashboard
2. ✅ Soumettre pour révision
3. ⏱️ Attendre 5-10 jours
4. ✅ Corriger si nécessaire
5. 🎉 Publication !

---

## 📚 Ressources utiles

- **Shopify App Store Requirements** : https://shopify.dev/docs/apps/launch
- **Deployment Guide** : https://shopify.dev/docs/apps/deployment
- **Partner Dashboard** : https://partners.shopify.com
- **Fly.io Docs** : https://fly.io/docs/
- **Railway Docs** : https://docs.railway.app/

---

## ❓ Questions fréquentes

### Q : Shopify héberge-t-il mon app ?
**R : Non**, tu dois héberger ton app toi-même.

### Q : Puis-je utiliser Cloudflare Tunnel ?
**R : Non**, tu dois avoir un domaine personnalisé.

### Q : Dois-je acheter le domaine avant de soumettre ?
**R : Oui**, ton app doit être en production avec un domaine valide.

### Q : Combien coûte l'hébergement ?
**R : ~5-10€/mois** pour une petite app.

### Q : Puis-je commencer gratuitement ?
**R : Oui**, avec Render.com (gratuit permanent) + Neon (gratuit) + domaine (~10€/an).

### Q : Fly.io est-il gratuit ?
**R : Non**, Fly.io offre 5$ de crédit/mois (carte bancaire requise), puis ~10-15$/mois. Utilise plutôt Render.com (gratuit) ou Railway.app (5$/mois).

---

**Besoin d'aide ?** Demande-moi pour :
- Configurer le déploiement sur Fly.io/Railway
- Rédiger ta Privacy Policy
- Préparer ton listing App Store
