# ✅ Checklist App Review Meta - SocialFlux
## 🎯 FACEBOOK LOGIN FOR BUSINESS - Processus Simplifié

**IMPORTANT:** Avec Facebook Login for Business, vous pouvez demander l'approbation même si :
- ❌ Votre app n'a pas d'interface utilisateur testable
- ❌ Votre app est derrière un intranet privé
- ❌ Les reviewers ne peuvent pas tester directement

**Permissions disponibles sans interface testable :**
- ✅ `instagram_basic`
- ✅ `instagram_manage_comments`

**Pour les autres permissions, vous devrez fournir une démo.**

## 🔴 URGENT - À faire AVANT la soumission

### 1. URL de Production Stable
- [ ] Déployer sur un domaine permanent (pas Cloudflare Tunnel)
- [ ] Utiliser Render.com ou autre hébergeur stable
- [ ] Mettre à jour `INSTAGRAM_REDIRECT_URI` dans .env
- [ ] Mettre à jour l'URL dans Meta App Dashboard

**URL actuelle (temporaire) :**
```
https://ban-truth-resolutions-negotiation.trycloudflare.com
```

**URL de production recommandée :**
```
https://socialflux-production.onrender.com
ou
https://votre-domaine.com
```

### 2. Politique de Confidentialité & CGU
- [ ] Créer une page "Privacy Policy" accessible publiquement
- [ ] Créer une page "Terms of Service"
- [ ] Ajouter les URLs dans Meta App Dashboard > Settings > Basic

**Exemple de contenu minimal :**
```
Privacy Policy URL: https://votre-domaine.com/privacy
Terms of Service URL: https://votre-domaine.com/terms
```

### 3. Vidéos de Démonstration
Enregistrer des vidéos (max 5 min chacune) montrant :

**Vidéo 1 - Connexion Instagram :**
- [ ] Clic sur "Connecter Instagram"
- [ ] Login Facebook/Instagram
- [ ] Autorisation des permissions
- [ ] Redirection vers l'app

**Vidéo 2 - Utilisation des permissions :**
- [ ] Affichage des posts Instagram
- [ ] Synchronisation des données
- [ ] Utilisation de chaque permission demandée

### 4. Configuration Meta App Dashboard

**Settings > Basic :**
- [ ] App Name: SocialFlux
- [ ] App Icon (1024x1024px)
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Domain

**Facebook Login for Business > Settings :**
- [ ] Valid OAuth Redirect URIs configurées
- [ ] URL actuelle : https://ban-truth-resolutions-negotiation.trycloudflare.com/auth/instagram/callback

**Instagram > API Setup with Facebook Login :**
- [ ] Permissions sélectionnées :
  - instagram_basic (REQUIS)
  - pages_show_list (REQUIS)
  - pages_read_engagement
  - instagram_manage_insights
  - instagram_manage_comments

### 5. Informations pour l'App Review

**Use Case Description :**
```
SocialFlux is a Shopify app that helps merchants display their Instagram 
Business posts directly in their Shopify admin. Merchants can:
- Connect their Instagram Business account
- Automatically sync their Instagram posts
- View and manage their Instagram content from Shopify
- Display Instagram feeds on their online store
```

**Step-by-Step Instructions :**
```
1. Merchant installs SocialFlux from Shopify App Store
2. Clicks "Connect Instagram" button
3. Logs in with Facebook/Instagram credentials
4. Authorizes requested permissions
5. Instagram posts are automatically synced
6. Posts are displayed in the Shopify admin dashboard
```

**Permission Justifications (Facebook Login for Business) :**

- **instagram_basic**: Required to access basic profile information and 
  retrieve the Instagram Business account ID. This is the core permission 
  needed to identify and connect the Instagram Business account.

- **pages_show_list**: Required to list Facebook Pages connected to the 
  user's account to find the associated Instagram Business account. 
  Instagram Business accounts must be linked to a Facebook Page.

- **pages_read_engagement**: Required to read engagement metrics (likes, 
  comments) for Instagram posts to display statistics in the merchant's 
  Shopify dashboard.

- **instagram_manage_insights**: Required to access Instagram Insights 
  data (impressions, reach, saves) to provide detailed analytics to merchants.

- **instagram_manage_comments**: Required to allow merchants to view and 
  manage comments on their Instagram posts from within Shopify.

### 6. Test Accounts
- [ ] Créer un compte Instagram Business de test
- [ ] Créer un compte Facebook de test
- [ ] Fournir les credentials dans l'App Review

**Format :**
```
Test Instagram Business Account:
Username: test_socialflux_business
Password: [mot de passe sécurisé]

Test Facebook Account:
Email: test@socialflux.com
Password: [mot de passe sécurisé]
```

### 7. Mode Development vs Live

**En Development Mode (actuel) :**
- ✅ Vous et vos testeurs pouvez utiliser l'app
- ❌ Les autres utilisateurs ne peuvent pas se connecter

**En Live Mode (après App Review) :**
- ✅ Tous les utilisateurs peuvent utiliser l'app
- ✅ Accès complet aux permissions approuvées

## 📝 Soumission de l'App Review

### Étapes :
1. Aller sur https://developers.facebook.com/apps/857704303426737
2. Menu gauche : **Instagram** > **API setup with Instagram login**
3. Section **Complete App Review** > **Go to App Review**
4. Remplir tous les champs requis
5. Upload des vidéos de démonstration
6. Soumettre pour review

### Délai de Review :
- Généralement 3-5 jours ouvrables
- Peut prendre jusqu'à 2 semaines

### Si Rejeté :
- Lire attentivement les raisons du rejet
- Corriger les problèmes mentionnés
- Re-soumettre avec les modifications

## 🚀 Après Approbation

1. [ ] Passer l'app en "Live Mode" dans le dashboard
2. [ ] Tester avec un compte réel (non-développeur)
3. [ ] Monitorer les erreurs et logs
4. [ ] Mettre à jour la documentation

## 📞 Support

Si vous avez des questions pendant le processus :
- Meta Developer Support: https://developers.facebook.com/support/
- Instagram Platform Docs: https://developers.facebook.com/docs/instagram-platform
