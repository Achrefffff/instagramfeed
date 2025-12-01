import { useState, useEffect, useCallback } from "react";

export function ProductSelectorModal({ 
  isOpen, 
  onClose, 
  onSave, 
  postId,
  currentlyTaggedProducts = [] 
}) {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set(currentlyTaggedProducts));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les produits quand la modal s'ouvre
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

  const primaryAction = {
    content: saving ? "Sauvegarde..." : `Étiqueter ${selectedProducts.size} produit${selectedProducts.size > 1 ? 's' : ''}`,
    onAction: handleSave,
    disabled: saving,
  };

  const secondaryActions = [
    {
      content: "Annuler",
      onAction: onClose,
      disabled: saving,
    },
  ];

  return (
    <s-modal
      open={isOpen}
      onClose={onClose}
      title="Sélectionner des produits à étiqueter"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      size="large"
    >
      <s-modal-section>
        <s-stack direction="block" gap="base">
          <s-text-field
            label="Rechercher des produits"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tapez pour rechercher..."
            clearButton
            onClearButtonClick={() => setSearchQuery("")}
          />

          {loading ? (
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              padding: "40px" 
            }}>
              <s-spinner accessibilityLabel="Chargement des produits" size="large" />
            </div>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <s-stack direction="block" gap="tight">
                {filteredProducts.length === 0 ? (
                  <s-empty-state
                    heading="Aucun produit trouvé"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      {searchQuery 
                        ? "Aucun produit ne correspond à votre recherche."
                        : "Vous n'avez pas encore de produits dans votre boutique."
                      }
                    </p>
                  </s-empty-state>
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
                        <s-checkbox
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
                        
                        <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                          <s-text variant="bodyMd" fontWeight="semibold">
                            {product.title}
                          </s-text>
                          
                          {product.priceRangeV2?.minVariantPrice && (
                            <s-text variant="bodySm" color="subdued">
                              {product.priceRangeV2.minVariantPrice.amount} {product.priceRangeV2.minVariantPrice.currencyCode}
                            </s-text>
                          )}
                          
                          <s-badge status={product.status === 'ACTIVE' ? 'success' : 'attention'}>
                            {product.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                          </s-badge>
                        </s-stack>
                      </div>
                    );
                  })
                )}
              </s-stack>
            </div>
          )}
        </s-stack>
      </s-modal-section>
    </s-modal>
  );
}