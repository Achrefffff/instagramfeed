# Déploiement sur Render.com (GRATUIT)

## 🎯 Configuration : Render.com + Neon + Domaine

**Coût total : ~10€/an** (seulement le domaine)

---

## 📋 Prérequis

- ✅ Compte GitHub avec ton repo
- ✅ Compte Render.com (gratuit)
- ✅ Base de données Neon (✅ tu l'as déjà)
- ✅ Domaine acheté (Namecheap, ~10€/an)

---

## 🚀 Étape 1 : Préparer ton app

### 1.1 Vérifier package.json

Assure-toi d'avoir ces scripts :

```json
{
  "scripts": {
    "build": "shopify app build",
    "start": "shopify app start",
    "deploy": "shopify app deploy"
  }
}
```

### 1.2 Créer render.yaml (optionnel)

```yaml
services:
  - type: web
    name: hop-shopify-app
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: SHOPIFY_API_KEY
        sync: false
      - key: SHOPIFY_API_SECRET
        sync: false
      - key: INSTAGRAM_APP_ID
        sync: false
      - key: INSTAGRAM_APP_SECRET
        sync: false
```

---

## 🌐 Étape 2 : Déployer sur Render.com

### 2.1 Créer le service

1. Va sur https://render.com
2. Clique sur **"New +"** → **"Web Service"**
3. Connecte ton repo GitHub
4. Sélectionne ton repo `appshopify/hop`

### 2.2 Configuration du service

**Name** : `hop-shopify-app`

**Environment** : `Node`

**Region** : `Frankfurt` (Europe) ou `Oregon` (US)

**Branch** : `main`

**Build Command** :
```bash
npm ci && npm run build
```

**Start Command** :
```bash
npm start
```

**Plan** : **Free** ✅

### 2.3 Variables d'environnement

Ajoute ces variables dans Render :

```env
NODE_ENV=production

# Shopify
SHOPIFY_API_KEY=ton_api_key
SHOPIFY_API_SECRET=ton_api_secret
SHOPIFY_APP_URL=https://ton-domaine.com

# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:npg_2Y1TvBqAurnG@ep-billowing-frog-ahxjl0ic-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Instagram
INSTAGRAM_APP_ID=857704303426737
INSTAGRAM_APP_SECRET=2a07a34792fe1801d6130d20ec0b83fd
INSTAGRAM_REDIRECT_URI=https://ton-domaine.com/auth/instagram/callback
```

### 2.4 Déployer

Clique sur **"Create Web Service"**

Render va :
1. Cloner ton repo
2. Installer les dépendances
3. Build l'app
4. Démarrer le serveur

⏱️ Attends 5-10 minutes pour le premier déploiement.

---

## 🌐 Étape 3 : Configurer le domaine

### 3.1 Obtenir l'URL Render

Après déploiement, tu auras une URL comme :
```
https://hop-shopify-app.onrender.com
```

### 3.2 Acheter un domaine

Va sur **Namecheap** et achète un domaine (~10€/an) :
- Exemple : `hop-instagram.com`

### 3.3 Configurer DNS sur Namecheap

Dans Namecheap → Ton domaine → Advanced DNS :

**Ajoute un CNAME record :**
```
Type: CNAME Record
Host: @
Value: hop-shopify-app.onrender.com
TTL: Automatic
```

**Ajoute un CNAME pour www :**
```
Type: CNAME Record
Host: www
Value: hop-shopify-app.onrender.com
TTL: Automatic
```

### 3.4 Ajouter le domaine dans Render

Dans Render → Ton service → Settings → Custom Domain :

1. Clique sur **"Add Custom Domain"**
2. Entre ton domaine : `hop-instagram.com`
3. Render va automatiquement configurer HTTPS (Let's Encrypt)

⏱️ Attends 10-30 minutes pour la propagation DNS.

---

## 🔧 Étape 4 : Mettre à jour la configuration Shopify

### 4.1 Mettre à jour shopify.app.toml

```toml
application_url = "https://hop-instagram.com"

[auth]
redirect_urls = [
  "https://hop-instagram.com/auth/callback"
]
```

### 4.2 Mettre à jour les variables d'environnement

Dans Render → Environment :

```env
SHOPIFY_APP_URL=https://hop-instagram.com
INSTAGRAM_REDIRECT_URI=https://hop-instagram.com/auth/instagram/callback
```

### 4.3 Redéployer

Render redéploie automatiquement à chaque commit Git.

Ou manuellement : **Manual Deploy** → **Deploy latest commit**

### 4.4 Déployer la config Shopify

```bash
shopify app config use  # Sélectionne ton app de production
shopify app deploy      # Déploie les extensions
```

---

## ✅ Étape 5 : Tester

### 5.1 Vérifier l'app

1. Va sur `https://hop-instagram.com`
2. Vérifie que l'app charge correctement
3. Teste la connexion Instagram
4. Vérifie les webhooks

### 5.2 Tester sur une boutique

1. Installe l'app sur une boutique de développement
2. Teste toutes les fonctionnalités
3. Vérifie les logs dans Render

---

## ⚠️ Limitations du plan gratuit

### Sleep après 15 minutes d'inactivité
- L'app "dort" après 15min sans requête
- Redémarre en ~30 secondes à la prochaine requête
- **Acceptable pour tests, pas idéal pour production**

### Upgrade vers plan payant (7$/mois)
Pour éviter le sleep :
1. Render → Ton service → Settings
2. Change le plan vers **Starter** (7$/mois)
3. L'app reste active 24/7

---

## 🔄 Déploiement automatique

Render redéploie automatiquement à chaque push sur GitHub :

```bash
git add .
git commit -m "Update app"
git push origin main
```

Render détecte le push et redéploie automatiquement.

---

## 📊 Monitoring

### Logs en temps réel

Render → Ton service → Logs

Tu verras tous les logs de ton app en temps réel.

### Métriques

Render → Ton service → Metrics

- CPU usage
- Memory usage
- Request count
- Response time

---

## 💰 Coût total

| Service | Plan | Coût |
|---------|------|------|
| **Render.com** | Free (avec sleep) | 0€ |
| **Neon PostgreSQL** | Free (0.5GB) | 0€ |
| **Domaine Namecheap** | Standard | ~10€/an |
| **Total** | | **~10€/an** |

### Upgrade production (optionnel)

| Service | Plan | Coût |
|---------|------|------|
| **Render.com** | Starter (sans sleep) | 7$/mois (~84€/an) |
| **Neon PostgreSQL** | Free | 0€ |
| **Domaine** | Standard | ~10€/an |
| **Total** | | **~94€/an** |

---

## 🎯 Résumé

✅ **Gratuit** : Render.com + Neon + Domaine = ~10€/an
✅ **Facile** : Déploiement Git automatique
✅ **HTTPS** : Certificat SSL automatique
✅ **Remix** : Support natif
⚠️ **Sleep** : Après 15min d'inactivité (OK pour tests)

**Pour production sans sleep : 7$/mois (Render Starter)**

---

## 📚 Ressources

- **Render Docs** : https://render.com/docs
- **Neon Docs** : https://neon.tech/docs
- **Namecheap** : https://www.namecheap.com
