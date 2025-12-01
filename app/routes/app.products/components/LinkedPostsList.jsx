import { Form } from "react-router";

export function LinkedPostsList({ linkedPosts, onUnlink }) {
  if (linkedPosts.length === 0) {
    return (
      <s-section>
        <s-text variant="bodySm" style={{ color: "#6d7175" }}>
          Aucun post lié pour le moment
        </s-text>
      </s-section>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
      }}
    >
      {linkedPosts.map((link) => (
        <div
          key={link.id}
          style={{
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: "12px", padding: "12px" }}>
            <img
              src={link.post.mediaUrl}
              alt="Post Instagram"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
            <div style={{ flex: 1 }}>
              <s-text variant="bodySm" style={{ fontWeight: "500" }}>
                @{link.post.ownerUsername || link.post.username}
              </s-text>
              <s-text
                variant="bodySm"
                style={{ color: "#6d7175", marginTop: "4px" }}
              >
                {link.post.caption?.substring(0, 60)}...
              </s-text>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #e1e3e5",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {link.productImageUrl && (
              <img
                src={link.productImageUrl}
                alt={link.productTitle}
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <s-text variant="bodySm" style={{ fontWeight: "500" }}>
                {link.productTitle}
              </s-text>
              <s-text variant="bodySm" style={{ color: "#6d7175" }}>
                {link.sales?.length || 0} vente(s)
              </s-text>
            </div>
            <Form method="post" style={{ margin: 0 }}>
              <input type="hidden" name="action" value="unlink" />
              <input type="hidden" name="linkId" value={link.id} />
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
                Délier
              </button>
            </Form>
          </div>
        </div>
      ))}
    </div>
  );
}
