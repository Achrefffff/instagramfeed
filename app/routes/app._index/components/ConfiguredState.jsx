import { Form, useNavigate } from "react-router";
import { useState } from "react";

export function ConfiguredState({ posts = [], accountsCount = 0, accounts = [], shop }) {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [likesRange, setLikesRange] = useState('all');
  const [postType, setPostType] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const togglePostSelection = (postId) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const saveSelection = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/instagram/save-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPostIds: Array.from(selectedPosts) }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ ${result.postsCount} posts sauvegardés avec succès !`);
      } else {
        console.error('Erreur serveur:', result);
        alert(`❌ Erreur: ${result.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('❌ Erreur réseau: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
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
            {selectedPosts.size > 0 && (
              <button 
                onClick={saveSelection}
                disabled={isSaving}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#005bd3', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: isSaving ? 'not-allowed' : 'pointer', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#fff',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                {isSaving ? 'Sauvegarde...' : `💾 Sauvegarder (${selectedPosts.size})`}
              </button>
            )}
            
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
          {filteredPosts.map((post) => {
            const isSelected = selectedPosts.has(post.id);
            return (
            <div key={`${post.configId}-${post.id}`} style={{ 
              border: isSelected ? '2px solid #005bd3' : '1px solid #e1e3e5', 
              borderRadius: '8px', 
              overflow: 'hidden',
              backgroundColor: '#fff',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => togglePostSelection(post.id)}
            >
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
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? '#005bd3' : '#fff',
                  border: isSelected ? 'none' : '2px solid #c9cccf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#fff',
                  fontWeight: 'bold',
                  zIndex: 10
                }}>
                  {isSelected && '✓'}
                </div>
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
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      {post.likeCount}
                    </span>
                  )}
                  {post.commentsCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      {post.commentsCount}
                    </span>
                  )}
                  {post.impressions > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                      </svg>
                      {post.impressions.toLocaleString()}
                    </span>
                  )}
                  {post.reach > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      {post.reach.toLocaleString()}
                    </span>
                  )}
                  {post.saved > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                      </svg>
                      {post.saved}
                    </span>
                  )}
                </div>
                
                {post.hashtags && post.hashtags !== '00' && (
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
          );
          })}
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
