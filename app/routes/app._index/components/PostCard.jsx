import {
  Card,
  Box,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Text,
  Icon,
} from "@shopify/polaris";
import {
  HeartIcon,
  ChatIcon,
  EyeIcon,
  BookmarkIcon,
} from "@shopify/polaris-icons";
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

  const handleCardClick = () => {
    onToggleSelection(post.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleSelection(post.id);
    }
  };

  const taggedCount = taggedProducts[post.id]?.length || 0;

  return (
    <Card
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="checkbox"
      aria-checked={isSelected}
      aria-label={t("aria.selectPost", {
        username: post.ownerUsername || post.accountUsername,
        date: new Date(post.timestamp).toLocaleDateString(),
      })}
      style={{
        cursor: "pointer",
        position: "relative",
        border: isSelected ? "2px solid #005bd3" : "1px solid #e0e0e0",
        boxShadow: isSelected ? "0 0 0 2px rgba(0, 91, 211, 0.1)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      <Box style={{ position: "relative" }}>
        {/* Custom Checkbox */}
        <Box
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "20px",
            height: "20px",
            backgroundColor: isSelected ? "#005bd3" : "#fff",
            border: "2px solid #005bd3",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          {isSelected && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: "#fff" }}
            >
              <path
                d="M10 3L4.5 9L2 6.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </Box>

        {/* Media */}
        <Box
          style={{
            width: "100%",
            height: "200px",
            backgroundColor: "#f5f5f5",
            overflow: "hidden",
            marginBottom: "12px",
          }}
        >
          {post.mediaType === "VIDEO" || post.mediaType === "CAROUSEL_ALBUM" ? (
            <>
              <img
                src={post.mediaUrl}
                alt={post.caption || "Instagram post"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                loading="lazy"
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#fff",
                  fontSize: "24px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  pointerEvents: "none",
                }}
              >
                {post.mediaType === "VIDEO" ? "▶" : "≋"}
              </div>
            </>
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption || "Instagram post"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              loading="lazy"
            />
          )}
        </Box>
      </Box>

      <BlockStack gap="300">
        {/* Username & Date */}
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="p" variant="bodySm" fontWeight="semibold">
              {post.ownerUsername || post.accountUsername}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {new Date(post.timestamp).toLocaleDateString()}
            </Text>
          </BlockStack>
          {isSelected && (
            <Badge tone="info" progress="complete">
              ✓ {t("post.selected")}
            </Badge>
          )}
        </InlineStack>

        {/* Stats */}
        <InlineStack gap="300" wrap={false}>
          {post.likes && (
            <InlineStack gap="100" blockAlign="center">
              <Icon source={HeartIcon} tone="base" />
              <Text as="span" variant="bodySm">
                {post.likes}
              </Text>
            </InlineStack>
          )}
          {post.comments && (
            <InlineStack gap="100" blockAlign="center">
              <Icon source={ChatIcon} tone="base" />
              <Text as="span" variant="bodySm">
                {post.comments}
              </Text>
            </InlineStack>
          )}
          {post.impressions && (
            <InlineStack gap="100" blockAlign="center">
              <Icon source={EyeIcon} tone="base" />
              <Text as="span" variant="bodySm">
                {post.impressions}
              </Text>
            </InlineStack>
          )}
          {post.saved && (
            <InlineStack gap="100" blockAlign="center">
              <Icon source={BookmarkIcon} tone="base" />
              <Text as="span" variant="bodySm">
                {post.saved}
              </Text>
            </InlineStack>
          )}
        </InlineStack>

        {/* Hashtags */}
        {post.hashtags && post.hashtags !== "00" && (
          <Text
            as="p"
            variant="bodySm"
            tone="info"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {post.hashtags}
          </Text>
        )}

        {/* Caption */}
        <Text
          as="p"
          variant="bodySm"
          style={{
            lineHeight: "1.4",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.caption || t("post.noCaption")}
        </Text>

        {/* View on Instagram Link */}
        <Box>
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("aria.viewPost", {
              username: post.ownerUsername || post.accountUsername,
            })}
            style={{
              fontSize: "12px",
              color: "#005bd3",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            {t("post.viewOnInstagram")}
          </a>
        </Box>

        {/* Actions */}
        <InlineStack gap="200">
          <Button
            size="slim"
            onClick={(e) => {
              e.stopPropagation();
              onProductTag(post.id);
            }}
            accessibilityLabel={t("productTag.tagProducts")}
          >
            {t("productTag.tag")} {taggedCount > 0 && `(${taggedCount})`}
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
              accessibilityLabel={t("productTag.clearTags")}
            >
              {t("productTag.clear")}
            </Button>
          )}
        </InlineStack>

        {/* Tagged Products Display */}
        {taggedCount > 0 && (
          <Box
            style={{
              padding: "8px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            <Text as="p" variant="bodySm" tone="subdued">
              <strong>{t("productTag.taggedWith")}:</strong>{" "}
              {taggedProducts[post.id].map((p) => p.title || p.id).join(", ")}
            </Text>
          </Box>
        )}
      </BlockStack>
    </Card>
  );
}
