import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export function EmptyState({ shop }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
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
          {t('empty.info')}
        </s-text>
      </s-banner>

      <s-section>
        <s-stack direction="block" gap="large">
          <s-text variant="headingLg">{t('empty.title')}</s-text>
          
          <s-inline-grid columns="3" gap="base">
            <s-card>
              <s-stack direction="block" gap="tight">
                <s-text variant="headingSm">{t('empty.step1Title')}</s-text>
                <s-text variant="bodySm" tone="subdued">
                  {t('empty.step1Desc')}
                </s-text>
              </s-stack>
            </s-card>

            <s-card>
              <s-stack direction="block" gap="tight">
                <s-text variant="headingSm">{t('empty.step2Title')}</s-text>
                <s-text variant="bodySm" tone="subdued">
                  {t('empty.step2Desc')}
                </s-text>
              </s-stack>
            </s-card>

            <s-card>
              <s-stack direction="block" gap="tight">
                <s-text variant="headingSm">{t('empty.step3Title')}</s-text>
                <s-text variant="bodySm" tone="subdued">
                  {t('empty.step3Desc')}
                </s-text>
              </s-stack>
            </s-card>
          </s-inline-grid>

          <s-banner tone="warning">
            <s-text variant="bodySm">
              {t('empty.warning')}
            </s-text>
          </s-banner>

          <div onClick={handleConnect}>
            <s-button variant="primary" aria-label={t('aria.connectButton')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/instagram-logo.png" alt="" role="presentation" style={{ width: '16px', height: '16px' }} />
                {t('app.connect')}
              </div>
            </s-button>
          </div>
        </s-stack>
      </s-section>
    </s-stack>
  );
}
