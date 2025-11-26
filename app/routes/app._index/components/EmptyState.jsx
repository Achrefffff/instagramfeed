import { useNavigate } from 'react-router';

export function EmptyState({ shop }) {
  const navigate = useNavigate();
  
  const handleConnect = () => {
    const popup = window.open(
      `/api/instagram/connect?shop=${encodeURIComponent(shop)}`, 
      'instagram-auth', 
      'width=600,height=700'
    );
    
    if (!popup) {
      alert('Veuillez autoriser les popups pour connecter Instagram');
      return;
    }
    
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        navigate('/app', { replace: true });
      }
    }, 300);
  };

  return (
    <s-stack direction="block" gap="large">
      <s-banner tone="info">
        <s-text variant="bodyMd">
          Transformez vos posts Instagram en contenu engageant pour votre boutique. Synchronisation automatique et affichage personnalisable.
        </s-text>
      </s-banner>

      <s-section>
        <s-stack direction="block" gap="large">
          <s-text variant="headingLg">Comment ça marche ?</s-text>
          
          <s-inline-grid columns="3" gap="base">
            <s-card>
              <s-stack direction="block" gap="tight">
                <s-text variant="headingSm">1. Connectez Instagram</s-text>
                <s-text variant="bodySm" tone="subdued">
                  Liez votre compte Instagram Business en un clic
                </s-text>
              </s-stack>
            </s-card>

            <s-card>
              <s-stack direction="block" gap="tight">
                <s-text variant="headingSm">2. Sélectionnez vos posts</s-text>
                <s-text variant="bodySm" tone="subdued">
                  Choisissez les posts à afficher sur votre boutique
                </s-text>
              </s-stack>
            </s-card>

            <s-card>
              <s-stack direction="block" gap="tight">
                <s-text variant="headingSm">3. Publiez sur votre site</s-text>
                <s-text variant="bodySm" tone="subdued">
                  Ajoutez le bloc Instagram Feed à votre thème
                </s-text>
              </s-stack>
            </s-card>
          </s-inline-grid>

          <s-banner tone="warning">
            <s-text variant="bodySm">
              Vous aurez besoin d'un compte Instagram Business connecté à une page Facebook pour utiliser cette application.
            </s-text>
          </s-banner>

          <div onClick={handleConnect}>
            <s-button variant="primary">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/instagram-logo.png" alt="Instagram" style={{ width: '16px', height: '16px' }} />
                Connecter Instagram
              </div>
            </s-button>
          </div>
        </s-stack>
      </s-section>
    </s-stack>
  );
}
