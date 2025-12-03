import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

const productsCache = { data: null, timestamp: null };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function ProductSelectorModal({
  isOpen,
  onClose,
  onSave,
  postId,
  currentlyTaggedProducts = [],
}) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(
    new Set(currentlyTaggedProducts),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      const taggedIds = currentlyTaggedProducts.map((id) => String(id));
      setSelectedProducts(new Set(taggedIds));
    }
  }, [isOpen, currentlyTaggedProducts]);

  const loadProducts = async () => {
    const now = Date.now();
    if (productsCache.data && (now - productsCache.timestamp) < CACHE_DURATION) {
      setProducts(productsCache.data);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/product-tagging?action=products");
      if (response.ok) {
        const data = await response.json();
        productsCache.data = data.products || [];
        productsCache.timestamp = now;
        setProducts(productsCache.data);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = useCallback((productId) => {
    const id = String(productId);
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSave = async () => {
    if (selectedProducts.size === 0) {
      return;
    }

    setSaving(true);
    try {
      const selectedProductIds = Array.from(selectedProducts);
      await onSave(postId, selectedProductIds);
      onClose();
    } catch (error) {
      console.error("Failed to save product tags:", error);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "800px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}>
        <div onClick={onClose} style={{ cursor: "pointer", position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
          <s-button variant="tertiary">×</s-button>
        </div>
        
        <div style={{ padding: "20px", flex: 1, overflow: "auto" }}>
        <s-text variant="headingLg">{t("productTag.modalTitle")}</s-text>
        
        <div style={{ marginTop: "20px" }}>
          <s-search-field
            label={t("productTag.searchLabel")}
            labelAccessibilityVisibility="exclusive"
            placeholder={t("productTag.searchPlaceholder")}
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>

        <div style={{ marginTop: "20px", flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              <s-spinner size="large" />
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <s-banner tone="info">
              <s-text>
                {searchQuery
                  ? t("productTag.noProductsSearch")
                  : t("productTag.noProductsStore")}
              </s-text>
            </s-banner>
          )}

          {!loading && filteredProducts.length > 0 && (
            <s-stack direction="block" gap="small">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.has(String(product.id));
                return (
                  <s-clickable
                    key={product.id}
                    border={isSelected ? "large" : "base"}
                    borderColor={isSelected ? "strong" : "base"}
                    background={isSelected ? "subdued" : "transparent"}
                    padding="base"
                    borderRadius="base"
                    onClick={() => handleProductToggle(product.id)}
                  >
                    <s-stack direction="inline" gap="base" blockAlign="center">
                      <s-checkbox
                        checked={isSelected}
                        onChange={() => handleProductToggle(product.id)}
                      />

                      {product.featuredMedia?.image?.url && (
                        <img
                          src={product.featuredMedia.image.url}
                          alt={product.title}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      )}

                      <div style={{ flex: 1 }}>
                        <s-text variant="bodySm" fontWeight="semibold">
                          {product.title}
                        </s-text>
                        {product.priceRangeV2?.minVariantPrice && (
                          <s-text variant="bodySm" tone="subdued">
                            {product.priceRangeV2.minVariantPrice.amount}{" "}
                            {product.priceRangeV2.minVariantPrice.currencyCode}
                          </s-text>
                        )}
                      </div>
                    </s-stack>
                  </s-clickable>
                );
              })}
            </s-stack>
          )}
        </div>

        </div>
        
        <div style={{ padding: "20px", borderTop: "1px solid #e1e3e5", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <s-button onClick={onClose} disabled={saving}>
            {t("productTag.cancel")}
          </s-button>
          <s-button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={saving || selectedProducts.size === 0}
          >
            {t("productTag.saveButton", {
              count: selectedProducts.size,
              plural: selectedProducts.size > 1 ? "s" : "",
            })}
          </s-button>
        </div>
      </div>
    </div>
  );
}
