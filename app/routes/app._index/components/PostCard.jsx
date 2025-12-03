import { useTranslation } from "react-i18next";
import { useState } from "react";

export function PostCard({
  post,
  isSelected,
  onToggleSelection,
  onProductTag,
  taggedProducts,
  onClearTags,
}) {
  const { t } = useTranslation();
  const [isClearing, setIsClearing] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const handleCardClick = (e) => {
    onToggleSelection(post.id);
  };

  const handleClearTags = async () => {
    setIsClearing(true);
    try {
      await onClearTags(post.id);
    } finally {
      setIsClearing(false);
    }
  };

  const taggedCount = taggedProducts?.[post.id]?.length || 0;

  const renderMedia = () => {
    if (mediaError) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#6d7175" }}>
          <s-text variant="bodySm">{t("post.mediaUnavailable")}</s-text>
        </div>
      );
    }

    if (post.mediaType === "VIDEO") {
      return (
        <video
          src={post.mediaUrl}
          poster={post.thumbnailUrl || post.mediaUrl}
          controls
          muted
          playsInline
          preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setMediaError(true)}
        />
      );
    }

    return (
      <img
        src={post.mediaUrl}
        alt={post.caption || "Instagram post"}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        loading="lazy"
        onError={() => setMediaError(true)}
      />
    );
  };

  return (
    <div
      onClick={handleCardClick}
      style={{ 
        position: "relative", 
        cursor: "pointer",
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#fff"
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <s-checkbox
          checked={isSelected}
          onChange={() => onToggleSelection(post.id)}
        />
      </div>

      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="tight">
          <s-stack direction="inline" gap="tight" blockAlign="center">
            <s-icon type="profile" />
            <s-text variant="bodyMd" fontWeight="semibold">
              {post.ownerUsername || post.accountUsername}
            </s-text>
          </s-stack>
          <s-text variant="bodySm" tone="subdued">
            {new Date(post.timestamp).toLocaleDateString()}
          </s-text>
        </s-stack>

        <div
          style={{
            width: "100%",
            minHeight: 320,
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderMedia()}
        </div>

        <s-stack direction="inline" gap="large" blockAlign="center">
          {post.likeCount !== undefined && (
            <s-stack direction="inline" gap="tight" blockAlign="center">
              <s-icon type="heart" />
              <s-text variant="bodySm">{post.likeCount}</s-text>
            </s-stack>
          )}

          {post.commentsCount !== undefined && (
            <s-stack direction="inline" gap="tight" blockAlign="center">
              <s-icon type="chat-referral" />
              <s-text variant="bodySm">{post.commentsCount}</s-text>
            </s-stack>
          )}

          {post.reach !== undefined && post.reach !== null && (
            <s-stack direction="inline" gap="tight" blockAlign="center">
              <s-icon type="eye-check-mark" />
              <s-text variant="bodySm">{post.reach}</s-text>
            </s-stack>
          )}

          {post.saved !== undefined && post.saved !== null && (
            <s-stack direction="inline" gap="tight" blockAlign="center">
              <s-icon type="save" />
              <s-text variant="bodySm">{post.saved}</s-text>
            </s-stack>
          )}
        </s-stack>

        {taggedCount > 0 && (
          <s-stack direction="block" gap="tight">
            <s-badge tone="info">
              {taggedCount} {t("productTag.taggedWith")}
            </s-badge>
            <s-text variant="bodySm" tone="subdued">
              {taggedProducts[post.id]
                ?.map((p) => p.title || p.id)
                .join(", ") || ""}
            </s-text>
          </s-stack>
        )}

        {post.caption && (
          <s-text variant="bodySm">
            {post.caption}
          </s-text>
        )}

        <s-stack direction="inline" gap="base" inlineAlign="space-between" blockAlign="center">
          <div onClick={(e) => e.stopPropagation()}>
            <s-link href={post.permalink} target="_blank">
              {t("post.viewOnInstagram")}
            </s-link>
          </div>

          <s-stack direction="inline" gap="base">
            <div onClick={(e) => e.stopPropagation()}>
              <s-button
                size="slim"
                variant="primary"
                onClick={() => onProductTag(post.id)}
              >
                {t("productTag.button")}
              </s-button>
            </div>

            {taggedCount > 0 && (
              <div onClick={(e) => e.stopPropagation()}>
                <s-button
                  size="slim"
                  variant="secondary"
                  tone="critical"
                  disabled={isClearing}
                  onClick={handleClearTags}
                >
                  {isClearing
                    ? `${t("productTag.clear")}...`
                    : t("productTag.clear")}
                </s-button>
              </div>
            )}
          </s-stack>
        </s-stack>
      </s-stack>
    </div>
  );
}
