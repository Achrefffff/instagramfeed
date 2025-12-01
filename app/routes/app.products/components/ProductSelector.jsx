import { useState } from "react";

export function ProductSelector({ products, onLink, isLoading }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <input
        type="text"
        placeholder="Rechercher un produit..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          padding: "8px 12px",
          border: "1px solid #c9cccf",
          borderRadius: "6px",
          fontSize: "14px",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            style={{
              border:
                selectedProduct?.id === product.id
                  ? "2px solid #005bd3"
                  : "1px solid #e1e3e5",
              borderRadius: "8px",
              padding: "12px",
              cursor: "pointer",
              backgroundColor: "#fff",
            }}
          >
            {product.featuredImage?.url && (
              <img
                src={product.featuredImage.url}
                alt={product.title}
                style={{
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              />
            )}
            <s-text variant="bodySm" style={{ fontWeight: "500" }}>
              {product.title}
            </s-text>
            <s-text variant="bodySm" style={{ color: "#6d7175" }}>
              {product.priceRangeV2?.minVariantPrice?.amount}{" "}
              {product.priceRangeV2?.minVariantPrice?.currencyCode}
            </s-text>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div onClick={() => onLink(selectedProduct)}>
          <s-button variant="primary" disabled={isLoading}>
            {isLoading ? "Liaison..." : "Lier ce produit"}
          </s-button>
        </div>
      )}
    </div>
  );
}
