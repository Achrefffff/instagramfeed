export function SalesStats({ stats }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
      }}
    >
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f6f6f7",
          borderRadius: "8px",
        }}
      >
        <s-text variant="bodySm" style={{ color: "#6d7175" }}>
          Posts liés
        </s-text>
        <s-text
          variant="headingLg"
          style={{ marginTop: "8px", fontWeight: "600" }}
        >
          {stats.totalLinkedPosts}
        </s-text>
      </div>

      <div
        style={{
          padding: "16px",
          backgroundColor: "#f6f6f7",
          borderRadius: "8px",
        }}
      >
        <s-text variant="bodySm" style={{ color: "#6d7175" }}>
          Produits liés
        </s-text>
        <s-text
          variant="headingLg"
          style={{ marginTop: "8px", fontWeight: "600" }}
        >
          {stats.totalLinkedProducts}
        </s-text>
      </div>

      <div
        style={{
          padding: "16px",
          backgroundColor: "#f6f6f7",
          borderRadius: "8px",
        }}
      >
        <s-text variant="bodySm" style={{ color: "#6d7175" }}>
          Ventes totales
        </s-text>
        <s-text
          variant="headingLg"
          style={{ marginTop: "8px", fontWeight: "600" }}
        >
          {stats.totalSales}
        </s-text>
      </div>

      <div
        style={{
          padding: "16px",
          backgroundColor: "#f6f6f7",
          borderRadius: "8px",
        }}
      >
        <s-text variant="bodySm" style={{ color: "#6d7175" }}>
          Revenu total
        </s-text>
        <s-text
          variant="headingLg"
          style={{ marginTop: "8px", fontWeight: "600" }}
        >
          {stats.totalRevenue} {stats.currency}
        </s-text>
      </div>
    </div>
  );
}
