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

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "600px",
        maxHeight: "80vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e1e3e5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
              {t("productTag.modalTitle")}
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
          </div>
        </div>
        
        <div style={{ padding: "16px", flex: 1, overflow: "auto" }}>
          <input
            type="text"
            placeholder={t("productTag.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #c9cccf",
              borderRadius: "6px",
              marginBottom: "16px"
            }}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              Chargement...
            </div>
          ) : (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6d7175" }}>
                  {searchQuery ? t("productTag.noProductsSearch") : t("productTag.noProductsStore")}
                </div>
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
                          <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                            {product.title}
                          </div>
                          
                          {product.priceRangeV2?.minVariantPrice && (
                            <div style={{ fontSize: "14px", color: "#6d7175" }}>
                              {product.priceRangeV2.minVariantPrice.amount} {product.priceRangeV2.minVariantPrice.currencyCode}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div style={{ padding: "16px", borderTop: "1px solid #e1e3e5", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "8px 16px",
              border: "1px solid #c9cccf",
              borderRadius: "6px",
              background: "white",
              cursor: "pointer"
            }}
          >
            {t("productTag.cancel")}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              background: "#005bd3",
              color: "white",
              cursor: "pointer"
            }}
          >
            {saving ? t("productTag.saving") : t("productTag.saveButton", { count: selectedProducts.size, plural: selectedProducts.size > 1 ? 's' : '' })}
          </button>
        </div>
      </div>
    </div>
  );
}