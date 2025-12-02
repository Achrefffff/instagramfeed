import {
  Card,
  BlockStack,
  InlineStack,
  Checkbox,
  Button,
  Badge,
  Text,
  Box,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export function PostCard({
  post,
  isSelected,
  onToggleSelection,
  onProductTag,
  taggedProducts,
  onClearTags,
}) {
  const { t } = useTranslation();

  const handleCardClick = (e) => {
    // Clicking the card toggles selection; child buttons stop propagation
    onToggleSelection(post.id);
  };

  const taggedCount = taggedProducts?.[post.id]?.length || 0;

  // Helper to render media using consistent sizing
  const renderMedia = () => {
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
        />
      );
    }

    // For carousel and images use img with full height
    return (
      <img
        src={post.mediaUrl}
        alt={post.caption || "Instagram post"}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        loading="lazy"
      />
    );
  };

  return (
    <Card sectioned onClick={handleCardClick}>
      <BlockStack gap="300">
        <InlineStack alignment="space-between" blockAlign="center">
          <Box>
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {post.ownerUsername || post.accountUsername}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {new Date(post.timestamp).toLocaleDateString()}
            </Text>
          </Box>

          <Checkbox
            checked={isSelected}
            label=""
            onChange={() => onToggleSelection(post.id)}
            aria-label={t("aria.selectPost", {
              username: post.ownerUsername || post.accountUsername,
            })}
          />
        </InlineStack>

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

        {taggedCount > 0 && (
          <Box>
            <Badge status="info">
              {taggedCount} {t("productTag.taggedWith")}
            </Badge>
            <Text
              as="p"
              variant="bodySm"
              tone="subdued"
              style={{ marginTop: "6px" }}
            >
              {taggedProducts[post.id]
                ?.map((p) => p.title || p.id)
                .join(", ") || ""}
            </Text>
          </Box>
        )}

        <Text as="p" variant="bodySm">
          {post.caption || t("post.noCaption")}
        </Text>

        <InlineStack gap="200" alignment="space-between" blockAlign="center">
          <a href={post.permalink} target="_blank" rel="noopener noreferrer">
            {t("post.viewOnInstagram")} →
          </a>

          <InlineStack gap="200">
            <Button
              size="slim"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                onProductTag(post.id);
              }}
            >
              {t("productTag.button")}
            </Button>

            {taggedCount > 0 && (
              <Button
                size="slim"
                variant="secondary"
                tone="critical"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearTags(post.id);
                }}
              >
                {t("productTag.clear")}
              </Button>
            )}
          </InlineStack>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
