import {
  Card,
  BlockStack,
  InlineStack,
  Checkbox,
  Thumbnail,
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

  // Helper to render media using Polaris Thumbnail for images
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

    // For carousel and images use Thumbnail for consistent sizing
    return (
      <Thumbnail
        source={post.mediaUrl}
        alt={post.caption || "Instagram post"}
        size="large"
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

        <div style={{ width: "100%", minHeight: 220 }}>{renderMedia()}</div>

        {taggedCount > 0 && (
          <Badge status="info">
            {t("productTag.taggedWith")} {taggedCount}
          </Badge>
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
              {t("productTag.tag")}
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
