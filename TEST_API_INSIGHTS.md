# Test API instagram_manage_insights

## Comment effectuer le test obligatoire

Meta exige que vous fassiez au moins 1 appel API utilisant `instagram_manage_insights` avant de soumettre l'App Review.

---

## Méthode 1 : Via votre application (RECOMMANDÉ)

### Étapes :

1. **Lancez votre app en mode développement**
   ```bash
   npm run dev
   ```

2. **Connectez votre compte Instagram de test**
   - Allez sur votre app Shopify
   - Cliquez "Connecter Instagram"
   - Autorisez les permissions

3. **L'app va automatiquement appeler l'API insights**
   - Votre code dans `instagram.server.js` appelle déjà `getPostInsights()`
   - Cela compte comme un appel API test ✅

4. **Attendez 24 heures**
   - Meta met jusqu'à 24h pour enregistrer l'appel
   - Revenez sur la page App Review pour vérifier

---

## Méthode 2 : Via Graph API Explorer (Alternative)

Si vous voulez tester manuellement :

### Étapes :

1. **Allez sur Graph API Explorer**
   https://developers.facebook.com/tools/explorer/

2. **Sélectionnez votre app** (SocialFlux - 857704303426737)

3. **Générez un User Access Token** avec les permissions :
   - instagram_basic
   - instagram_manage_insights
   - pages_show_list
   - pages_read_engagement

4. **Récupérez votre Instagram Business Account ID**
   ```
   GET /me/accounts?fields=instagram_business_account
   ```

5. **Récupérez un post ID**
   ```
   GET /{instagram-account-id}/media?fields=id
   ```

6. **Appelez l'API insights** (C'EST LE TEST OBLIGATOIRE)
   ```
   GET /{media-id}/insights?metric=impressions,reach,saved
   ```

7. **Vérifiez la réponse**
   ```json
   {
     "data": [
       {
         "name": "impressions",
         "period": "lifetime",
         "values": [{"value": 150}]
       },
       {
         "name": "reach",
         "period": "lifetime",
         "values": [{"value": 120}]
       },
       {
         "name": "saved",
         "period": "lifetime",
         "values": [{"value": 5}]
       }
     ]
   }
   ```

---

## Vérification

Après avoir fait l'appel API :

1. **Attendez 24 heures maximum**
2. **Retournez sur Meta App Dashboard** > App Review
3. **Vérifiez que ça affiche :**
   ```
   instagram_manage_insights
   1 appel(s) d'API sur 1 nécessaire(s) ✅
   ```

---

## Code de test rapide (si besoin)

Si vous voulez tester rapidement, créez un fichier `test-insights.js` :

```javascript
const INSTAGRAM_APP_ID = "857704303426737";
const ACCESS_TOKEN = "VOTRE_ACCESS_TOKEN_DE_TEST";
const MEDIA_ID = "VOTRE_MEDIA_ID";

async function testInsights() {
  const url = `https://graph.facebook.com/v18.0/${MEDIA_ID}/insights?metric=impressions,reach,saved&access_token=${ACCESS_TOKEN}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log("✅ Test API insights réussi !");
  console.log(JSON.stringify(data, null, 2));
}

testInsights();
```

Exécutez :
```bash
node test-insights.js
```

---

## Troubleshooting

### "0 appel(s) d'API sur 1 nécessaire(s)"

**Solutions :**
1. Attendez 24 heures - Meta met du temps à enregistrer
2. Vérifiez que vous utilisez le bon Access Token (avec instagram_manage_insights)
3. Refaites l'appel API
4. Vérifiez que l'appel a réussi (pas d'erreur 403/400)

### "Permission denied"

**Solution :**
- Vérifiez que votre Access Token inclut `instagram_manage_insights`
- Régénérez un token avec toutes les permissions

---

## Important

⚠️ **Vous DEVEZ faire ce test AVANT de soumettre l'App Review**

Sans cet appel API test, Meta rejettera automatiquement votre demande.
