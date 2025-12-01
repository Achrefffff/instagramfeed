# Liaison Posts Instagram → Produits Shopify + Tracking Ventes

## 📋 Vue d'ensemble

Cette fonctionnalité permet de lier des posts Instagram à des produits Shopify et de tracker automatiquement les ventes générées par ces posts.

## 🏗️ Architecture

### Structure modulaire
```
app/routes/app.products/
├── route.jsx                    # Loader + Action
├── components/
│   ├── ProductSelector.jsx      # Sélection de produits
│   ├── LinkedPostsList.jsx      # Liste des liaisons
│   ├── SalesStats.jsx           # Statistiques de ventes
│   └── index.js                 # Exports centralisés
```

### Services
- `app/services/shopify-products.server.js` - Interaction avec l'API GraphQL Shopify

### Base de données (Prisma)
- **ProductLink** - Liaison post ↔ produit
- **SaleTracking** - Tracking des ventes

### Webhooks
- `webhooks.orders.create.jsx` - Tracking automatique des ventes

## 🚀 Utilisation

### 1. Lier un post à un produit
1. Sélectionner un ou plusieurs posts dans la page principale
2. Cliquer sur "Lier aux produits (X)"
3. Rechercher et sélectionner un produit
4. Cliquer sur "Lier ce produit"

### 2. Voir les statistiques
- Posts liés
- Produits liés
- Ventes totales
- Revenu total

### 3. Délier un post
- Cliquer sur "Délier" dans la liste des posts liés

## 🔧 Configuration

### Scopes Shopify requis
- `write_products` - Gestion des produits
- `read_orders` - Lecture des commandes

### Webhook configuré
- `orders/create` → `/webhooks/orders/create`

## 📊 Tracking des ventes

Le webhook `orders/create` :
1. Reçoit la commande
2. Vérifie si les produits sont liés à des posts
3. Enregistre la vente dans `SaleTracking`
4. Associe la vente au `ProductLink`

## 🎯 Bonnes pratiques

- Architecture modulaire (< 100 lignes par fichier)
- Composants à responsabilité unique
- Exports centralisés via `index.js`
- Gestion d'erreurs avec logger
- GraphQL pour l'API Shopify
- Prisma pour la base de données

## 🔄 Prochaines étapes

- [ ] Analytics avancées par post
- [ ] Export des données de ventes
- [ ] Notifications de ventes
- [ ] Recommandations de produits basées sur les performances
