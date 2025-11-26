import { Form, useNavigate } from "react-router";
import { useState } from "react";
import { useToast } from "../../../hooks/useToast";
import { StatsOverview } from "./StatsOverview";
import { Toast } from "./Toast";

export function ConfiguredState({ posts = [], accountsCount = 0, accounts = [], shop }) {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [postType, setPostType] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

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
        showToast(`${result.postsCount} posts sauvegardés avec succès !`);
      } else {
        showToast(result.error || 'Erreur inconnue', true);
      }
    } catch (error) {
      showToast('Erreur réseau: ' + error.message, true);
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
    <>
      <Toast message={toast?.message} isError={toast?.isError} onDismiss={dismissToast} />
      
      <StatsOverview posts={posts} accountsCount={accountsCount} />
      
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
            
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f6f6f7', padding: '4px', borderRadius: '8px' }}>
              {['all', 'published', 'tagged'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: postType === type ? '#fff' : 'transparent',
                    color: postType === type ? '#202223' : '#6d7175',
                    boxShadow: postType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {type === 'all' ? 'Tous' : type === 'published' ? 'Publiés' : 'Tagués'}
                </button>
              ))}
            </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <s-text variant="bodySm" style={{ color: '#6d7175', fontWeight: '500' }}>
                      @{post.ownerUsername || post.accountUsername}
                    </s-text>
                    {post.isTagged && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        TAGUÉ
                      </span>
                    )}
                  </div>
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                      {post.impressions.toLocaleString()}
                    </span>
                  )}
                  {post.reach > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
    </>
  );
}
