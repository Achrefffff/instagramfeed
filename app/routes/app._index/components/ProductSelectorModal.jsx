import { useState, useEffect, useCallback } from "react";
import { Modal, TextField, Spinner, EmptyState, Checkbox, Badge, Text } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export function ProductSelectorModal({ 
  isOpen, 
  onClose, 
  onSave, 
  postId,
  currentlyTaggedProducts = [] 
}) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set(currentlyTaggedProducts));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      setSelectedProducts(new Set(currentlyTaggedProducts));
    }
  }, [isOpen, currentlyTaggedProducts]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/product-tagging?action=products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = useCallback((productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleSave = async () => {
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

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t("productTag.modalTitle")}
      primaryAction={{
        content: saving ? t("productTag.saving") : t("productTag.saveButton", { count: selectedProducts.size, plural: selectedProducts.size > 1 ? 's' : '' }),
        onAction: handleSave,
        disabled: saving,
      }}
      secondaryActions={[
        {
          content: t("productTag.cancel"),
          onAction: onClose,
          disabled: saving,
        },
      ]}
      size="large"
    >
      <Modal.Section>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TextField
            label={t("productTag.searchLabel")}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("productTag.searchPlaceholder")}
            clearButton
            onClearButtonClick={() => setSearchQuery("")}
          />

          {loading ? (
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              padding: "40px" 
            }}>
              <Spinner accessibilityLabel={t("productTag.loading")} size="large" />
            </div>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredProducts.length === 0 ? (
                  <EmptyState
                    heading={t("productTag.noProducts")}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      {searchQuery 
                        ? t("productTag.noProductsSearch")
                        : t("productTag.noProductsStore")
                      }
                    </p>
                  </EmptyState>
                ) : (
                  filteredProducts.map((product) => {
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductToggle(product.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          border: isSelected ? "2px solid #005bd3" : "1px solid #e1e3e5",
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#f0f8ff" : "#fff",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleProductToggle(product.id)}
                        />
                        
                        {product.featuredImage?.url && (
                          <img
                            src={product.featuredImage.url}
                            alt={product.featuredImage.altText || product.title}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                          />
                        )}
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                          <Text variant="bodyMd" fontWeight="semibold">
                            {product.title}
                          </Text>
                          
                          {product.priceRangeV2?.minVariantPrice && (
                            <Text variant="bodySm" color="subdued">
                              {product.priceRangeV2.minVariantPrice.amount} {product.priceRangeV2.minVariantPrice.currencyCode}
                            </Text>
                          )}
                          
                          <Badge status={product.status === 'ACTIVE' ? 'success' : 'attention'}>
                            {product.status === 'ACTIVE' ? t("productTag.active") : t("productTag.inactive")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </Modal.Section>
    </Modal>
  );
}