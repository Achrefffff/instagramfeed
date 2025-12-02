import { Form, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useToast } from "../../../hooks/useToast";
import { StatsOverview } from "./StatsOverview";
import { Toast } from "./Toast";
import { ProductSelectorModal } from "./ProductSelectorModal";
import { PostCard } from "./PostCard";
import { InlineGrid } from "@shopify/polaris";
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
        setTaggedProducts((prev) => ({
          ...prev,
          [postId]: result.taggedProducts || [],
        }));

        if (window.shopify?.toast) {
          window.shopify.toast.show(
            result.message || "Produits étiquetés avec succès",
          );
        } else {
          showToast(result.message || "Produits étiquetés avec succès");
        }
      } else {
        if (window.shopify?.toast) {
          window.shopify.toast.show(
            result.error || "Erreur lors de l'étiquetage",
            { isError: true },
          );
        } else {
          showToast(result.error || "Erreur lors de l'étiquetage", true);
        }
      }
    } catch (error) {
      if (window.shopify?.toast) {
        window.shopify.toast.show("Erreur réseau lors de l'étiquetage", {
          isError: true,
        });
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
        setTaggedProducts((prev) => {
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
          window.shopify.toast.show(
            result.error || "Erreur lors du désétiquetage",
            { isError: true },
          );
        } else {
          showToast(result.error || "Erreur lors du désétiquetage", true);
        }
      }
    } catch (error) {
      if (window.shopify?.toast) {
        window.shopify.toast.show("Erreur réseau lors du désétiquetage", {
          isError: true,
        });
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

          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }} gap="400">
            {filteredPosts.map((post) => {
              const isSelected = selectedPosts.has(post.id);
              return (
                <PostCard
                  key={`${post.configId}-${post.id}`}
                  post={post}
                  isSelected={isSelected}
                  onToggleSelection={togglePostSelection}
                  onProductTag={handleProductTag}
                  taggedProducts={taggedProducts}
                  onClearTags={handleClearProductTags}
                />
              );
            })}
          </InlineGrid>

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
        currentlyTaggedProducts={
          currentPostId
            ? taggedProducts[currentPostId]?.map((p) =>
                typeof p === "string" ? p : p.id,
              ) || []
            : []
        }
      />
    </>
  );
}
