import { useEffect } from 'react';

export function EmptyState({ shop }) {
  const handleConnect = () => {
    // Ouvrir dans une nouvelle fenêtre pour éviter les problèmes d'iframe
    const popup = window.open(
      `/api/instagram/connect?shop=${encodeURIComponent(shop)}`, 
      'instagram-auth', 
      'width=600,height=700'
    );
    
    // Vérifier si la popup est fermée toutes les secondes
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        // Recharger la page pour voir si la connexion a réussi
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <s-section heading="Commencer">
      <s-stack direction="block" gap="base">
        <s-paragraph>
          Pour commencer, vous devez connecter votre compte Instagram.
        </s-paragraph>
        <s-button onClick={handleConnect} variant="primary">
          Connecter Instagram
        </s-button>
      </s-stack>
    </s-section>
  );
}
