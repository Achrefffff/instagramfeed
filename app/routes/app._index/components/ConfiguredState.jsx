import { Form, useNavigate } from "react-router";
import { useState } from "react";

export function ConfiguredState({ posts = [], accountsCount = 0, accounts = [], shop }) {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [likesRange, setLikesRange] = useState('all');
  const [postType, setPostType] = useState('all');
  
  const filteredPosts = posts
    .filter(post => selectedAccount === 'all' || post.accountUsername === selectedAccount)
    .filter(post => {
      if (postType === 'all') return true;
      if (postType === 'published') return !post.isTagged;
      if (postType === 'tagged') return post.isTagged;
      return true;
    })
    .filter(post => {
      if (likesRange === 'all') return true;
      if (likesRange === '0-50') return post.likeCount < 50;
      if (likesRange === '50-100') return post.likeCount >= 50 && post.likeCount < 100;
      if (likesRange === '100-500') return post.likeCount >= 100 && post.likeCount < 500;
      if (likesRange === '500-1000') return post.likeCount >= 500 && post.likeCount < 1000;
      if (likesRange === '1000+') return post.likeCount >= 1000;
      return true;
    });

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
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {accounts.map((account) => (
                <div key={account.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '4px 8px',
                  backgroundColor: '#f6f6f7',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <span>@{account.username}</span>
                  <Form method="post" style={{ margin: 0, display: 'inline' }}>
                    <input type="hidden" name="action" value="disconnect" />
                    <input type="hidden" name="accountId" value={account.id} />
                    <button 
                      type="submit" 
                      style={{ 
                        padding: '2px 6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        lineHeight: '1',
                        color: '#bf0711'
                      }}
                      title="Déconnecter ce compte"
                    >
                      ×
                    </button>
                  </Form>
                </div>
              ))}
            </div>
            
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
            
            <select 
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="all">Tous les posts</option>
              <option value="published">Posts publiés</option>
              <option value="tagged">Posts tagués</option>
            </select>
            
            <select 
              value={likesRange}
              onChange={(e) => setLikesRange(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="all">Tous les likes</option>
              <option value="0-50">0 - 50 likes</option>
              <option value="50-100">50 - 100 likes</option>
              <option value="100-500">100 - 500 likes</option>
              <option value="500-1000">500 - 1000 likes</option>
              <option value="1000+">1000+ likes</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => {
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
              }}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#008060', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#fff'
              }}
            >
              + Ajouter un compte
            </button>
            
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
        </div>

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
              {post.mediaType === 'IMAGE' || post.mediaType === 'CAROUSEL_ALBUM' ? (
                <img 
                  src={post.mediaUrl} 
                  alt={post.caption || 'Instagram post'} 
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    objectFit: 'cover',
                    display: 'block'
                  }} 
                  loading="lazy"
                />
              ) : post.mediaType === 'VIDEO' ? (
                <video 
                  src={post.mediaUrl} 
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    objectFit: 'cover' 
                  }} 
                  controls 
                  preload="metadata"
                />
              ) : null}
              
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
                
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '11px',
                  color: '#6d7175'
                }}>
                  {post.likeCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ❤️ {post.likeCount}
                    </span>
                  )}
                  {post.commentsCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💬 {post.commentsCount}
                    </span>
                  )}
                  {post.impressions && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👁️ {post.impressions.toLocaleString()}
                    </span>
                  )}
                  {post.reach && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📈 {post.reach.toLocaleString()}
                    </span>
                  )}
                  {post.saved && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💾 {post.saved}
                    </span>
                  )}
                </div>
                
                {post.hashtags && (
                  <div style={{ 
                    fontSize: '11px',
                    color: '#005bd3',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {post.hashtags}
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
