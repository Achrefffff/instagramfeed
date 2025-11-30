# Documentation i18n - Implémentation

## Vue d'ensemble

L'application supporte 4 langues : Anglais, Français, Allemand, Espagnol

## Fichiers créés

### Configuration
- `app/i18n.js` - Configuration i18next
- `app/components/LanguageSwitcher.jsx` - Sélecteur de langue

### Traductions
```
app/locales/
├── en/common.json (🇬🇧 Anglais)
├── fr/common.json (🇫🇷 Français)
├── de/common.json (🇩🇪 Allemand)
└── es/common.json (🇪🇸 Español)
```

## Utilisation

### Dans un composant

```jsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t("app.title")}</h1>
      <button>{t("app.connect")}</button>
    </div>
  );
}
```

### Avec interpolation

```jsx
// Traduction: "{{count}} posts saved successfully!"
<p>{t("messages.saveSuccess", { count: 5 })}</p>
// Résultat: "5 posts saved successfully!"
```

### Avec variables

```jsx
// Traduction: "No posts found for @{{username}}"
<p>{t("messages.noPostsForAccount", { username: "john" })}</p>
// Résultat: "No posts found for @john"
```

## Clés de traduction disponibles

### app.*
- `app.title` - Titre de l'app
- `app.connect` - Bouton connecter
- `app.addAccount` - Ajouter compte
- `app.disconnect` - Déconnecter
- `app.disconnectAll` - Déconnecter tout
- `app.save` - Sauvegarder
- `app.saving` - Sauvegarde...

### stats.*
- `stats.posts` - Posts
- `stats.accounts` - Comptes
- `stats.likes` - Likes
- `stats.comments` - Commentaires
- `stats.reach` - Portée

### filters.*
- `filters.all` - Tous
- `filters.published` - Publiés
- `filters.tagged` - Tagués
- `filters.allAccounts` - Tous les comptes
- `filters.filterByAccount` - Filtrer par compte

### messages.*
- `messages.noPostsFound` - Aucun post trouvé
- `messages.noAccountConnected` - Aucun compte connecté
- `messages.connectedAccounts` - Comptes connectés
- `messages.saveSuccess` - Posts sauvegardés (avec count)
- `messages.tooManyAttempts` - Trop de tentatives
- `messages.tooManySaves` - Trop de sauvegardes
- `messages.tooManyDisconnects` - Trop de déconnexions
- `messages.networkError` - Erreur réseau (avec message)
- `messages.noPostsForAccount` - Aucun post pour compte (avec username)

### empty.*
- `empty.title` - Comment ça marche ?
- `empty.step1Title` - Étape 1 titre
- `empty.step1Desc` - Étape 1 description
- `empty.step2Title` - Étape 2 titre
- `empty.step2Desc` - Étape 2 description
- `empty.step3Title` - Étape 3 titre
- `empty.step3Desc` - Étape 3 description
- `empty.info` - Info générale
- `empty.warning` - Avertissement

### post.*
- `post.tagged` - Badge tagué
- `post.noCaption` - Pas de légende
- `post.viewOnInstagram` - Voir sur Instagram

### aria.*
- `aria.filterPosts` - Label filtrage (avec type)
- `aria.disconnectAccount` - Label déconnexion (avec username)
- `aria.postCheckbox` - Label checkbox post (avec username, caption)
- `aria.postImage` - Label image (avec caption)
- `aria.postVideo` - Label vidéo (avec username)
- `aria.viewPost` - Label lien (avec username)
- `aria.connectButton` - Label bouton connexion
- `aria.stat` - Label statistique (avec label, value)

## Changement de langue

### Automatique
- Détecte la langue du navigateur au premier chargement
- Sauvegarde dans localStorage
- Persiste entre les sessions

### Manuel
Le sélecteur de langue est affiché en haut à droite de l'app :
```jsx
<LanguageSwitcher />
```

### Programmatique
```jsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { i18n } = useTranslation();
  
  // Changer la langue
  i18n.changeLanguage("fr");
  
  // Langue actuelle
  console.log(i18n.language); // "fr"
}
```

## Intégration dans les composants existants

### ✅ Déjà intégré
- `app/routes/app._index/route.jsx` - Titre + sélecteur de langue

### 🔄 À intégrer manuellement
Pour intégrer i18n dans vos composants :

1. **Importer useTranslation**
```jsx
import { useTranslation } from "react-i18next";
```

2. **Utiliser dans le composant**
```jsx
function MyComponent() {
  const { t } = useTranslation();
  
  return <button>{t("app.connect")}</button>;
}
```

3. **Remplacer les textes en dur**
```jsx
// Avant
<button>Connecter Instagram</button>

// Après
<button>{t("app.connect")}</button>
```

## Exemple complet : ConfiguredState

```jsx
import { useTranslation } from "react-i18next";

export function ConfiguredState({ posts, accounts, shop }) {
  const { t } = useTranslation();
  
  return (
    <>
      <h1>{t("app.title")}</h1>
      
      {/* Filtres */}
      <button>{t("filters.all")}</button>
      <button>{t("filters.published")}</button>
      <button>{t("filters.tagged")}</button>
      
      {/* Actions */}
      <button>{t("app.addAccount")}</button>
      <button>{t("app.disconnectAll")}</button>
      
      {/* Messages */}
      {posts.length === 0 && (
        <p>{t("messages.noPostsFound")}</p>
      )}
      
      {/* Succès avec interpolation */}
      <p>{t("messages.saveSuccess", { count: selectedPosts.size })}</p>
    </>
  );
}
```

## Ajouter une nouvelle traduction

1. **Ajouter la clé dans tous les fichiers de langue**

`app/locales/en/common.json` :
```json
{
  "mySection": {
    "myKey": "My text in English"
  }
}
```

`app/locales/fr/common.json` :
```json
{
  "mySection": {
    "myKey": "Mon texte en français"
  }
}
```

2. **Utiliser dans le composant**
```jsx
<p>{t("mySection.myKey")}</p>
```

## Ajouter une nouvelle langue

1. **Créer le fichier de traduction**
```bash
mkdir app/locales/it
# Créer app/locales/it/common.json
```

2. **Ajouter dans i18n.js**
```jsx
import itCommon from "./locales/it/common.json";

i18n.init({
  resources: {
    // ...
    it: { common: itCommon },
  },
});
```

3. **Ajouter dans LanguageSwitcher**
```jsx
<option value="it">🇮🇹 Italiano</option>
```

## Tests

### Tester le changement de langue
```jsx
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

test("changes language", async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  await i18n.changeLanguage("fr");
  expect(screen.getByText("Flux Instagram")).toBeInTheDocument();
});
```

## Bonnes pratiques

### ✅ À faire
- Utiliser des clés descriptives (`app.connect` pas `btn1`)
- Grouper par section (`app.*`, `stats.*`)
- Utiliser l'interpolation pour les variables
- Tester toutes les langues

### ❌ À éviter
- Texte en dur dans les composants
- Clés trop génériques (`text1`, `label`)
- Oublier une langue dans les traductions
- Interpolation dans les clés (utiliser les variables)

## Fallback

Si une traduction manque :
1. Utilise la langue de fallback (anglais)
2. Affiche la clé si pas de fallback
3. Log un warning en console (dev)

```jsx
// Si "newKey" n'existe qu'en anglais
t("newKey") // Affiche la version anglaise même si langue = "fr"
```

## Performance

### Lazy loading des langues (futur)
```jsx
i18n.init({
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
  },
});
```

### Bundle size
- Toutes les langues : ~15KB
- Une langue : ~4KB
- i18next : ~10KB

**Total** : ~25KB (minifié + gzippé)

---

**Dernière mise à jour** : 2024
**Version** : 1.0.0
**Langues** : 4 (EN, FR, DE, ES)
