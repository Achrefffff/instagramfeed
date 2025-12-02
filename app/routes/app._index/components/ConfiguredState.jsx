import { Form, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useToast } from "../../../hooks/useToast";
import { StatsOverview } from "./StatsOverview";
import { Toast } from "./Toast";
import { ProductTagButton } from "./ProductTagButton";
import { ProductSelectorModal } from "./ProductSelectorModal";
import { useTranslation } from "react-i18next";

export function ConfiguredState({
  posts = [],
  accountsCount = 0,
  accounts = [],
  shop,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [postType, setPostType] = useState("all");
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [taggedProducts, setTaggedProducts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const { toast, showToast, dismissToast } = useToast();

  // Charger les produits étiquetés au démarrage
  useEffect(() => {
    const loadTaggedProducts = async () => {
      try {
        const response = await fetch("/api/product-tagging?action=tagged");
        if (response.ok) {
          const data = await response.json();
          setTaggedProducts(data.taggedProducts || {});
        }
      } catch (error) {
        console.error("Failed to load tagged products:", error);
      }
    };
    loadTaggedProducts();
  }, []);

  const handleProductTag = async (postId) => {
    setCurrentPostId(postId);
    setModalOpen(true);
  };

  const handleSaveProductTags = async (postId, selectedProductIds) => {
    try {
      // Si aucun produit sélectionné, effacer les étiquettes
      if (!selectedProductIds || selectedProductIds.length === 0) {
        return handleClearProductTags(postId);
      }
      
      const response = await fetch("/api/product-tagging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tag",
          postId,
          productIds: selectedProductIds,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTaggedProducts(prev => ({
          ...prev,
          [postId]: result.taggedProducts || []
        }));
        
        if (window.shopify?.toast) {
          window.shopify.toast.show(result.message || "Produits étiquetés avec succès");
        } else {
          showToast(result.message || "Produits étiquetés avec succès");
        }
      } else {
        if (window.shopify?.toast) {
          window.shopify.toast.show(result.error || "Erreur lors de l'étiquetage", { isError: true });
        } else {
          showToast(result.error || "Erreur lors de l'étiquetage", true);
        }
      }
    } catch (error) {
      if (window.shopify?.toast) {
        window.shopify.toast.show("Erreur réseau lors de l'étiquetage", { isError: true });
      } else {
        showToast("Erreur réseau lors de l'étiquetage", true);
      }
      console.error("Failed to save product tags:", error);
    }
  };

  const handleClearProductTags = async (postId) => {
    try {
      const response = await fetch("/api/product-tagging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear",
          postId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTaggedProducts(prev => {
          const newState = { ...prev };
          delete newState[postId];
          return newState;
        });
        
        if (window.shopify?.toast) {
          window.shopify.toast.show("Produits désétiquetés avec succès");
        } else {
          showToast("Produits désétiquetés avec succès");
        }
      } else {
        if (window.shopify?.toast) {
          window.shopify.toast.show(result.error || "Erreur lors du désétiquetage", { isError: true });
        } else {
          showToast(result.error || "Erreur lors du désétiquetage", true);
        }
      }
    } catch (error) {
      if (window.shopify?.toast) {
        window.shopify.toast.show("Erreur réseau lors du désétiquetage", { isError: true });
      } else {
        showToast("Erreur réseau lors du désétiquetage", true);
      }
      console.error("Failed to clear product tags:", error);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentPostId(null);
  };


  const Stat = ({ label, value }) => (
    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
  const togglePostSelection = (postId) => {
    setSelectedPosts((prev) => {
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
      const response = await fetch("/api/instagram/save-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedPostIds: Array.from(selectedPosts) }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(t("messages.saveSuccess", { count: result.postsCount }));
      } else {
        showToast(
          result.error || t("messages.networkError", { message: "Unknown" }),
          true,
        );
      }
    } catch (error) {
      showToast(t("messages.networkError", { message: error.message }), true);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPosts = posts
    .filter(
      (post) =>
        selectedAccount === "all" || post.accountUsername === selectedAccount,
    )
    .filter((post) => {
      if (postType === "all") return true;
      if (postType === "published") return !post.isTagged;
      if (postType === "tagged") return post.isTagged;
      return true;
    });

  if (posts.length === 0) {
    return (
      <s-section heading="Vos comptes Instagram">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            {accountsCount > 0
              ? t("messages.noPostsFound")
              : t("messages.noAccountConnected")}
          </s-paragraph>

          {accounts.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <s-text variant="headingSm">
                {t("messages.connectedAccounts")}
              </s-text>
              <s-stack
                direction="block"
                gap="tight"
                style={{ marginTop: "8px" }}
              >
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      border: "1px solid #e1e3e5",
                      borderRadius: "6px",
                    }}
                  >
                    <s-text variant="bodySm">@{account.username}</s-text>
                    <Form method="post" style={{ margin: 0 }}>
                      <input type="hidden" name="action" value="disconnect" />
                      <input
                        type="hidden"
                        name="accountId"
                        value={account.id}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#fff",
                          border: "1px solid #c9cccf",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "#bf0711",
                        }}
                      >
                        {t("app.disconnect")}
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
      <Toast
        message={toast?.message}
        isError={toast?.isError}
        onDismiss={dismissToast}
      />

      <div style={{ marginBottom: "16px" }}>
        <StatsOverview posts={posts} accountsCount={accountsCount} />
      </div>

      <s-section heading={t("app.title")}>
        <s-stack direction="block" gap="base">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      backgroundColor: "#f6f6f7",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <span>@{account.username}</span>
                    <Form
                      method="post"
                      style={{ margin: 0, display: "inline" }}
                    >
                      <input type="hidden" name="action" value="disconnect" />
                      <input
                        type="hidden"
                        name="accountId"
                        value={account.id}
                      />
                      <button
                        type="submit"
                        aria-label={`Déconnecter le compte @${account.username}`}
                        style={{
                          padding: "2px 6px",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: "1",
                          color: "#bf0711",
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
                  aria-label={t("filters.filterByAccount")}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #c9cccf",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="all">{t("filters.allAccounts")}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.username}>
                      @{account.username}
                    </option>
                  ))}
                </select>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  backgroundColor: "#f6f6f7",
                  padding: "4px",
                  borderRadius: "8px",
                }}
              >
                {["all", "published", "tagged"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPostType(type)}
                    aria-label={t("aria.filterPosts", {
                      type: t(`filters.${type}`),
                    })}
                    aria-pressed={postType === type}
                    style={{
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      backgroundColor:
                        postType === type ? "#fff" : "transparent",
                      color: postType === type ? "#202223" : "#6d7175",
                      boxShadow:
                        postType === type
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {t(`filters.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {selectedPosts.size > 0 && (
                <>
                  <div onClick={saveSelection}>
                    <s-button variant="primary" disabled={isSaving}>
                      {isSaving
                        ? t("app.saving")
                        : `${t("app.save")} (${selectedPosts.size})`}
                    </s-button>
                  </div>

                </>
              )}

              <div
                onClick={() => {
                  const popup = window.open(
                    `/api/instagram/connect?shop=${encodeURIComponent(shop)}`,
                    "instagram-auth",
                    "width=600,height=700",
                  );

                  if (!popup) {
                    alert(
                      "Veuillez autoriser les popups pour connecter Instagram",
                    );
                    return;
                  }

                  const checkPopup = setInterval(() => {
                    if (popup.closed) {
                      clearInterval(checkPopup);
                      navigate("/app", { replace: true });
                    }
                  }, 300);
                }}
              >
                <s-button>{t("app.addAccount")}</s-button>
              </div>

              <Form method="post">
                <input type="hidden" name="action" value="disconnect_all" />
                <s-button type="submit" tone="critical">
                  {t("app.disconnectAll")}
                </s-button>
              </Form>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredPosts.map((post, index) => {
              const isSelected = selectedPosts.has(post.id);
              const isAboveFold = index < 3;
              return (
                <div
                  key={`${post.configId}-${post.id}`}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={t("aria.postCheckbox", {
                    username: post.ownerUsername || post.accountUsername,
                    caption: post.caption
                      ? post.caption.substring(0, 50)
                      : t("post.noCaption"),
                  })}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePostSelection(post.id);
                    }
                  }}
                  style={{
                    border: isSelected
                      ? "2px solid #005bd3"
                      : "1px solid #e1e3e5",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    position: "relative",
                    cursor: "pointer",
                  }}
                  onClick={() => togglePostSelection(post.id)}
                >
                  {post.mediaType === "IMAGE" ||
                  post.mediaType === "CAROUSEL_ALBUM" ? (
                    <img
                      src={post.mediaUrl}
                      alt={
                        post.caption
                          ? t("aria.postImage", {
                              caption: post.caption.substring(0, 100),
                            })
                          : t("aria.postCheckbox", {
                              username:
                                post.ownerUsername || post.accountUsername,
                              caption: "",
                            })
                      }
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        display: "block",
                      }}
                      loading={isAboveFold ? "eager" : "lazy"}
                      decoding="async"
                      fetchpriority={isAboveFold ? "high" : "auto"}
                    />
                  ) : post.mediaType === "VIDEO" ? (
                    <video
                      src={post.mediaUrl}
                      aria-label={t("aria.postVideo", {
                        username: post.ownerUsername || post.accountUsername,
                      })}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                      }}
                      controls
                      preload="metadata"
                    />
                  ) : null}

                  <div style={{ padding: "12px" }}>
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        backgroundColor: isSelected ? "#005bd3" : "#fff",
                        border: isSelected ? "none" : "2px solid #c9cccf",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        color: "#fff",
                        fontWeight: "bold",
                        zIndex: 10,
                      }}
                    >
                      {isSelected && "✓"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <s-text
                          variant="bodySm"
                          style={{ color: "#6d7175", fontWeight: "500" }}
                        >
                          @{post.ownerUsername || post.accountUsername}
                        </s-text>
                        {post.isTagged && (
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                              borderRadius: "4px",
                              fontWeight: "600",
                            }}
                          >
                            {t("post.tagged")}
                          </span>
                        )}
                      </div>
                      <s-text variant="bodySm" style={{ color: "#8c9196" }}>
                        {new Date(post.timestamp).toLocaleDateString("fr-FR")}
                      </s-text>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "8px",
                        fontSize: "11px",
                        color: "#6d7175",
                      }}
                    >
                      {post.likeCount > 0 && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            style={{ width: "14px", height: "14px" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                            />
                          </svg>
                          {post.likeCount}
                        </span>
                      )}
                      {post.commentsCount > 0 && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            style={{ width: "14px", height: "14px" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                            />
                          </svg>
                          {post.commentsCount}
                        </span>
                      )}
                      {post.impressions > 0 && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            style={{ width: "14px", height: "14px" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                            />
                          </svg>
                          {post.impressions.toLocaleString()}
                        </span>
                      )}
                      {post.reach > 0 && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            style={{ width: "14px", height: "14px" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                          {post.reach.toLocaleString()}
                        </span>
                      )}
                      {post.saved > 0 && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            style={{ width: "14px", height: "14px" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                            />
                          </svg>
                          {post.saved}
                        </span>
                      )}
                    </div>

                    {post.hashtags && post.hashtags !== "00" && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#005bd3",
                          marginBottom: "8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.hashtags}
                      </div>
                    )}

                    <p
                      style={{
                        fontSize: "13px",
                        color: "#202223",
                        margin: "0 0 8px 0",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.caption || t("post.noCaption")}
                    </p>

                    <div style={{ marginBottom: "12px" }}>
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("aria.viewPost", {
                          username: post.ownerUsername || post.accountUsername,
                        })}
                        style={{
                          fontSize: "12px",
                          color: "#005bd3",
                          textDecoration: "none",
                          fontWeight: "500",
                        }}
                      >
                        {t("post.viewOnInstagram")}
                      </a>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px" }}>
                      <ProductTagButton
                        postId={post.id}
                        onTagClick={handleProductTag}
                        taggedProductsCount={taggedProducts[post.id]?.length || 0}
                      />
                      
                      {taggedProducts[post.id]?.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearProductTags(post.id);
                          }}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#fff",
                            border: "1px solid #bf0711",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: "#bf0711",
                            fontWeight: "500",
                          }}
                          title={t("productTag.clearTags")}
                        >
                          {t("productTag.clear")}
                        </button>
                      )}
                    </div>
                    
                    {taggedProducts[post.id]?.length > 0 && (
                      <div style={{
                        marginTop: "8px",
                        fontSize: "11px",
                        color: "#6d7175",
                        fontStyle: "italic"
                      }}>
                        {t("productTag.taggedWith")}: {taggedProducts[post.id].map(p => p.title || p.id).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPosts.length === 0 && selectedAccount !== "all" && (
            <s-text
              variant="bodySm"
              style={{ textAlign: "center", color: "#6d7175", padding: "32px" }}
            >
              {t("messages.noPostsForAccount", { username: selectedAccount })}
            </s-text>
          )}
        </s-stack>
      </s-section>

      <ProductSelectorModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProductTags}
        postId={currentPostId}
        currentlyTaggedProducts={currentPostId ? (taggedProducts[currentPostId]?.map(p => typeof p === 'string' ? p : p.id) || []) : []}
      />
    </>
  );
}
