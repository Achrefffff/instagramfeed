# 📸 Hop - Instagram Feed pour Shopify

Application Shopify permettant de connecter et synchroniser plusieurs comptes Instagram Business pour afficher leurs posts directement dans l'admin Shopify.

## 🎯 Fonctionnalités

### Gestion Multi-Comptes
-  Connexion de **plusieurs comptes Instagram Business** par boutique
-  Authentification OAuth sécurisée via Facebook
-  Gestion individuelle de chaque compte (déconnexion sélective)
-  Déconnexion globale de tous les comptes

### Synchronisation des Posts
-  Récupération automatique des posts Instagram (images, vidéos, carrousels)
-  Sauvegarde en base de données pour historique
-  Mise à jour automatique à chaque chargement
- Statistiques d'engagement (likes, commentaires)

### Interface Utilisateur
-  Interface moderne avec Shopify Polaris Web Components
-  Filtrage des posts par compte Instagram
-  Affichage responsive en grille
-  Liens directs vers les posts Instagram
-  Chargement optimisé avec lazy loading

## 🛠️ Technologies

- **Framework** : React Router 7
- **Backend** : Node.js
- **Base de données** : SQLite avec Prisma ORM
- **UI** : Shopify Polaris Web Components
- **API** : Facebook Graph API v18.0
- **Authentification** : Shopify App Bridge + OAuth 2.0






## Structure du Projet

```
hop/
├── app/
│   ├── routes/
│   │   ├── app._index/              # Page principale
│   │   │   ├── components/          # Composants UI
│   │   │   │   ├── ConfiguredState.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── WelcomeSection.jsx
│   │   │   │   └── index.js
│   │   │   └── route.jsx
│   │   ├── api.instagram.connect/   # Initiation OAuth
│   │   ├── auth.instagram.callback/ # Callback OAuth
│   │   └── auth.instagram.success/  # Page de succès
│   ├── services/
│   │   └── instagram.server.js      # Service API Instagram
│   ├── db.server.js                 # Configuration Prisma
│   └── shopify.server.js            # Configuration Shopify
├── prisma/
│   ├── schema.prisma                # Schéma de base de données
│   └── migrations/                  # Migrations
├── .env                             # Variables d'environnement
├── shopify.app.toml                 # Configuration Shopify
└── package.json
```

## 🗄️ Schéma de Base de Données

### InstagramConfig
Stocke les configurations des comptes Instagram connectés.

```prisma
model InstagramConfig {
  id          String   @id @default(cuid())
  shop        String
  accessToken String
  username    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([shop, username])
  @@index([shop, isActive])
}
```

### InstagramPost
Stocke les posts Instagram synchronisés.

```prisma
model InstagramPost {
  id        String   @id
  shop      String
  mediaUrl  String
  permalink String
  caption   String?
  timestamp DateTime
  mediaType String
  createdAt DateTime @default(now())

  @@index([shop, timestamp])
}
```

## 🔐 Permissions Instagram Requises

L'application demande les permissions suivantes :

- `instagram_basic` - Accès de base au profil
- `pages_show_list` - Liste des pages Facebook
- `pages_read_engagement` - Lecture des statistiques
- `business_management` - Gestion du compte business
- `instagram_manage_comments` - Gestion des commentaires
- `instagram_manage_insights` - Accès aux insights

## 📊 Données Récupérées

Pour chaque post Instagram :

-  ID unique
-  Légende/caption
-  URL du média (image/vidéo)
-  Lien permanent vers Instagram
-  Date de publication
-  Type de média (IMAGE, VIDEO, CAROUSEL_ALBUM)
-  Nombre de likes
-  Nombre de commentaires







## 📄 Licence

Propriétaire : Achraf CHOUIKH


