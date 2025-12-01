import { useState, useEffect, useCallback } from "react";
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
    <s-modal 
      id={`product-modal-${postId}`}
      heading={t("productTag.modalTitle")}
      size="large"
    >
      <s-text-field
        label={t("productTag.searchLabel")}
        value={searchQuery}
        placeholder={t("productTag.searchPlaceholder")}
        onInput={(e) => setSearchQuery(e.target.value)}
      />

      {loading ? (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          padding: "40px" 
        }}>
          <s-spinner size="large" />
        </div>
      ) : (
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredProducts.length === 0 ? (
            <s-empty-state heading={t("productTag.noProducts")}>
              <s-text>
                {searchQuery 
                  ? t("productTag.noProductsSearch")
                  : t("productTag.noProductsStore")
                }
              </s-text>
            </s-empty-state>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredProducts.map((product) => {
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
                    <input
                      type="checkbox"
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
                    
                    <div style={{ flex: 1 }}>
                      <s-text variant="bodyMd" style={{ fontWeight: "600", display: "block" }}>
                        {product.title}
                      </s-text>
                      
                      {product.priceRangeV2?.minVariantPrice && (
                        <s-text variant="bodySm" style={{ color: "#6d7175" }}>
                          {product.priceRangeV2.minVariantPrice.amount} {product.priceRangeV2.minVariantPrice.currencyCode}
                        </s-text>
                      )}
                      
                      <s-badge status={product.status === 'ACTIVE' ? 'success' : 'attention'}>
                        {product.status === 'ACTIVE' ? t("productTag.active") : t("productTag.inactive")}
                      </s-badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <s-button 
        slot="secondary-actions" 
        commandFor={`product-modal-${postId}`}
        command="--hide"
        disabled={saving}
      >
        {t("productTag.cancel")}
      </s-button>
      
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? t("productTag.saving") : t("productTag.saveButton", { count: selectedProducts.size, plural: selectedProducts.size > 1 ? 's' : '' })}
      </s-button>
    </s-modal>
  );
}