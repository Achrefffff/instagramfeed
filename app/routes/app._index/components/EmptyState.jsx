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
        console.log('Popup fermée - rechargement...');
        navigate('/app', { replace: true });
      }
    }, 300);
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
