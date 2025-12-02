import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  TextField,
  Spinner,
  Banner,
  Card,
  Checkbox,
  Text,
  Box,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";

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
  const activatorRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      const taggedIds = currentlyTaggedProducts.map((id) => String(id));
      setSelectedProducts(new Set(taggedIds));
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t("productTag.modalTitle")}
      size="large"
      primaryAction={{
        content: t("productTag.saveButton", {
          count: selectedProducts.size,
          plural: selectedProducts.size > 1 ? "s" : "",
        }),
        onAction: handleSave,
        loading: saving,
        disabled: saving,
      }}
      secondaryActions={[
        {
          content: t("productTag.cancel"),
          onAction: onClose,
          disabled: saving,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="medium">
          <TextField
            type="text"
            label={t("productTag.searchPlaceholder")}
            placeholder={t("productTag.searchPlaceholder")}
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            clearButton
            onClearButtonClick={() => setSearchQuery("")}
            autoComplete="off"
          />

          {loading && (
            <Box display="flex" justifyContent="center" padding="large">
              <Spinner accessibilityLabel={t("app.loading")} />
            </Box>
          )}

          {!loading && filteredProducts.length === 0 && (
            <Banner tone="info">
              <Text as="p">
                {searchQuery
                  ? t("productTag.noProductsSearch")
                  : t("productTag.noProductsStore")}
              </Text>
            </Banner>
          )}

          {!loading && filteredProducts.length > 0 && (
            <BlockStack gap="small">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.has(String(product.id));
                return (
                  <Card
                    key={product.id}
                    onClick={() => handleProductToggle(product.id)}
                    style={{
                      cursor: "pointer",
                      border: isSelected
                        ? "2px solid #005bd3"
                        : "1px solid #e1e3e5",
                      backgroundColor: isSelected ? "#f0f8ff" : "#fff",
                      padding: "12px",
                    }}
                  >
                    <InlineStack gap="medium" align="center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleProductToggle(product.id)}
                        ariaLabel={`Select ${product.title}`}
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

                      <Box style={{ flex: 1 }}>
                        <Text as="h3" variant="bodySm" fontWeight="semibold">
                          {product.title}
                        </Text>
                        {product.priceRangeV2?.minVariantPrice && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {product.priceRangeV2.minVariantPrice.amount}{" "}
                            {product.priceRangeV2.minVariantPrice.currencyCode}
                          </Text>
                        )}
                      </Box>
                    </InlineStack>
                  </Card>
                );
              })}
            </BlockStack>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
