import { Form } from "react-router";
import { useState } from "react";

export function ConfiguredState({ posts = [], accountsCount = 0, accounts = [] }) {
  const [selectedAccount, setSelectedAccount] = useState('all');
  
  // Filtrer les posts selon le compte sélectionné
  const filteredPosts = selectedAccount === 'all' 
    ? posts 
    : posts.filter(post => post.accountUsername === selectedAccount);

  if (posts.length === 0) {
    return (
      <s-section heading="Vos comptes Instagram">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            {accountsCount > 0 
              ? "Aucun post Instagram trouvé. Publiez du contenu sur Instagram pour le voir apparaître ici."
              : "Aucun compte Instagram connecté."
            }
          </s-paragraph>
          
          {accounts.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <s-text variant="headingSm">Comptes connectés :</s-text>
              <s-stack direction="block" gap="tight" style={{ marginTop: '8px' }}>
                {accounts.map((account) => (
                  <div key={account.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    border: '1px solid #e1e3e5',
                    borderRadius: '6px'
                  }}>
                    <s-text variant="bodySm">@{account.username}</s-text>
                    <Form method="post" style={{ margin: 0 }}>
                      <input type="hidden" name="action" value="disconnect" />
                      <input type="hidden" name="accountId" value={account.id} />
                      <button 
                        type="submit" 
                        style={{ 
                          padding: '4px 8px', 
                          backgroundColor: '#fff', 
                          border: '1px solid #c9cccf', 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          fontSize: '12px',
                          color: '#bf0711'
                        }}
                      >
                        Déconnecter
                      </button>
                    </Form>
                  </div>
                ))}
              </s-stack>
            </div>
          )}
        </s-stack>
      </s-section>
    );
  }

  return (
    <s-section heading="Vos posts Instagram">
      <s-stack direction="block" gap="base">
        {/* En-tête avec statistiques et filtres */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <s-text variant="bodySm">
              {accountsCount} compte{accountsCount > 1 ? 's' : ''} • {filteredPosts.length} post{filteredPosts.length > 1 ? 's' : ''}
            </s-text>
            
            {accountsCount > 1 && (
              <select 
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #c9cccf',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="all">Tous les comptes</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.username}>
                    @{account.username}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <Form method="post">
            <input type="hidden" name="action" value="disconnect_all" />
            <button 
              type="submit" 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#fff', 
                border: '1px solid #c9cccf', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#bf0711'
              }}
            >
              Déconnecter tout
            </button>
          </Form>
        </div>

        {/* Grille des posts */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '16px' 
        }}>
          {filteredPosts.map((post) => (
            <div key={`${post.configId}-${post.id}`} style={{ 
              border: '1px solid #e1e3e5', 
              borderRadius: '8px', 
              overflow: 'hidden',
              backgroundColor: '#fff'
            }}>
              {/* Média */}
              {post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM' ? (
                <img 
                  src={post.media_url} 
                  alt={post.caption || 'Instagram post'} 
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    objectFit: 'cover',
                    display: 'block'
                  }} 
                  loading="lazy"
                />
              ) : post.media_type === 'VIDEO' ? (
                <video 
                  src={post.media_url} 
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    objectFit: 'cover' 
                  }} 
                  controls 
                  preload="metadata"
                />
              ) : null}
              
              {/* Contenu */}
              <div style={{ padding: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <s-text variant="bodySm" style={{ color: '#6d7175', fontWeight: '500' }}>
                    @{post.accountUsername}
                  </s-text>
                  <s-text variant="bodySm" style={{ color: '#8c9196' }}>
                    {new Date(post.timestamp).toLocaleDateString('fr-FR')}
                  </s-text>
                </div>
                
                {(post.like_count !== undefined || post.comments_count !== undefined) && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: '#6d7175'
                  }}>
                    {post.like_count !== undefined && (
                      <span>❤️ {post.like_count} j'aime{post.like_count > 1 ? 's' : ''}</span>
                    )}
                    {post.comments_count !== undefined && (
                      <span>💬 {post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
                
                <p style={{ 
                  fontSize: '13px', 
                  color: '#202223', 
                  margin: '0 0 8px 0', 
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {post.caption || 'Pas de légende'}
                </p>
                
                <a 
                  href={post.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    fontSize: '12px', 
                    color: '#005bd3', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Voir sur Instagram →
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {filteredPosts.length === 0 && selectedAccount !== 'all' && (
          <s-text variant="bodySm" style={{ textAlign: 'center', color: '#6d7175', padding: '32px' }}>
            Aucun post trouvé pour @{selectedAccount}
          </s-text>
        )}
      </s-stack>
    </s-section>
  );
}
