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
  username = null,
  shop,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
          window.shopify.toast.show(result.message || t("messages.tagSuccess"));
        } else {
          showToast(result.message || t("messages.tagSuccess"));
        }
      } else {
        if (window.shopify?.toast) {
          window.shopify.toast.show(result.error || t("messages.tagError"), {
            isError: true,
          });
        } else {
          showToast(result.error || t("messages.tagError"), true);
        }
      }
    } catch (error) {
      if (window.shopify?.toast) {
        window.shopify.toast.show(t("messages.tagNetworkError"), {
          isError: true,
        });
      } else {
        showToast(t("messages.tagNetworkError"), true);
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
          window.shopify.toast.show(t("messages.untagSuccess"));
        } else {
          showToast(t("messages.untagSuccess"));
        }
      } else {
        if (window.shopify?.toast) {
          window.shopify.toast.show(result.error || t("messages.untagError"), {
            isError: true,
          });
        } else {
          showToast(result.error || t("messages.untagError"), true);
        }
      }
    } catch (error) {
      if (window.shopify?.toast) {
        window.shopify.toast.show(t("messages.untagNetworkError"), {
          isError: true,
        });
      } else {
        showToast(t("messages.untagNetworkError"), true);
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
    if (selectedPosts.size === 0) return;
    
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
        setSelectedPosts(new Set());
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

  const filteredPosts = posts.filter((post) => {
    if (postType === "all") return true;
    if (postType === "published") return !post.isTagged;
    if (postType === "tagged") return post.isTagged;
    return true;
  });

  if (posts.length === 0) {
    return (
      <s-section heading="Votre compte Instagram">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            {username
              ? t("messages.noPostsFound")
              : t("messages.noAccountConnected")}
          </s-paragraph>

          {username && (
            <div style={{ marginTop: "16px" }}>
              <s-text variant="headingSm">
                Compte connecté: @{username}
              </s-text>
              <Form method="post" style={{ marginTop: "8px" }}>
                <input type="hidden" name="action" value="disconnect" />
                <s-button
                  variant="tertiary"
                  tone="critical"
                  type="submit"
                >
                  Déconnecter
                </s-button>
              </Form>
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
        <StatsOverview posts={posts} username={username} />
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
              <div
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
                <span>@{username}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "4px",
                }}
              >
                {["all", "published", "tagged"].map((type) => (
                  <s-button
                    key={type}
                    onClick={() => setPostType(type)}
                    variant={postType === type ? "primary" : "secondary"}
                    aria-label={t("aria.filterPosts", {
                      type: t(`filters.${type}`),
                    })}
                    aria-pressed={postType === type}
                  >
                    {t(`filters.${type}`)}
                  </s-button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {selectedPosts.size > 0 && (
                <div onClick={saveSelection}>
                  <s-button variant="primary" disabled={isSaving} loading={isSaving}>
                    {isSaving
                      ? t("app.saving")
                      : `${t("app.save")} (${selectedPosts.size})`}
                  </s-button>
                </div>
              )}

              <Form method="post">
                <input type="hidden" name="action" value="disconnect" />
                <s-button type="submit" tone="critical">
                  Déconnecter
                </s-button>
              </Form>
            </div>
          </div>

          <InlineGrid columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }} gap="500">
            {filteredPosts.map((post) => {
              const isSelected = selectedPosts.has(post.id);
              return (
                <PostCard
                  key={post.id}
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
