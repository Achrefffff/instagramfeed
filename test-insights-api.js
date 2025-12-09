// Test direct de l'API Insights
import 'dotenv/config';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const ACCESS_TOKEN ="EAAdPNxdsCtwBQGviRmHE2ULgYF4CGzQKwSZCWG1uCZCm1U62Kpdc0H9mAj1GkNSRWNnuej4uOZAktZBG9vFtQjP9f0h6bxf0IZAw8erMcNZAYU48FdZCM7sbO9156kdDtRCPFZCptxzV0ZC1hg5qPyWMtBiZA8SiwwBVxnzB9YnO8ZBxZC087TFe6X8PCu1Ms0WSQJN1n2KP69vtksMQvHwgGwq9k1mPIMpdvX5LCTW1A9PZBs0Si0mlFwS8jNVlxhqQlLCU3wsBdSvYR9LNGeUDbZB8SngaeZAImWiyfg36ycPGyEZD"; // Remplacez par votre token
const MEDIA_ID = "18071794952057439"; // Un de vos posts

async function testInsights() {
  console.log('🔍 Test de l\'API Insights...\n');
  
  // Note: impressions n'est plus supporté depuis API v22.0
  const url = `https://graph.facebook.com/v18.0/${MEDIA_ID}/insights?metric=reach,saved&access_token=${ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Erreur API:');
      console.log(JSON.stringify(data.error, null, 2));
      
      if (data.error.code === 190) {
        console.log('\n⚠️ Token invalide ou expiré');
      } else if (data.error.code === 10) {
        console.log('\n⚠️ Permission instagram_manage_insights manquante');
      }
    } else {
      console.log('✅ API Insights fonctionne !');
      console.log('\nDonnées reçues:');
      console.log(JSON.stringify(data, null, 2));
      
      // Afficher les valeurs
      data.data.forEach(metric => {
        console.log(`\n${metric.name}: ${metric.values[0].value}`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

// Exécution du test
testInsights();
