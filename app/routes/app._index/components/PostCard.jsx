import {
  Card,
  Box,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Icon,
  Text,
} from "@shopify/polaris";
import { HeartIcon, ChatIcon, ViewIcon } from "@shopify/polaris-icons";
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
    <div
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
        borderRadius: "8px",
        border: isSelected ? "2px solid #005bd3" : "1px solid #e0e0e0",
        boxShadow: isSelected
          ? "0 0 0 2px rgba(0, 91, 211, 0.1)"
          : "0 1px 3px rgba(0,0,0,0.1)",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      <Card roundedAbove="sm" padding="0">
        <BlockStack gap="0">
          {/* Media Container - Square Aspect Ratio */}
          <Box
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "100%",
              backgroundColor: "#f5f5f5",
              overflow: "hidden",
            }}
          >
            {/* Image/Video */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            >
              {post.mediaType === "VIDEO" ||
              post.mediaType === "CAROUSEL_ALBUM" ? (
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
                  {/* Video/Carousel Indicator */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      color: "#fff",
                      fontSize: "32px",
                      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
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
            </div>

            {/* Custom Checkbox Overlay */}
            <Box
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(post.id);
              }}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                backgroundColor: isSelected ? "#005bd3" : "#fff",
                border: "2px solid #005bd3",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                cursor: "pointer",
              }}
            >
              {isSelected && (
                <svg
                  width="14"
                  height="14"
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
          </Box>

          {/* Card Content */}
          <Box padding="400">
            <BlockStack gap="300">
              {/* Header: Username, Date, Selected Badge */}
              <InlineStack align="space-between" blockAlign="start" gap="200">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    @{post.ownerUsername || post.accountUsername}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </Text>
                </BlockStack>
                {isSelected && (
                  <Badge tone="info" progress="complete">
                    ✓
                  </Badge>
                )}
              </InlineStack>

              {/* Stats */}
              {(post.likes ||
                post.comments ||
                post.impressions ||
                post.saved) && (
                <InlineStack gap="200" wrap blockAlign="center">
                  {post.likes && (
                    <InlineStack gap="50" blockAlign="center">
                      <Icon source={HeartIcon} tone="base" />
                      <Text as="span" variant="bodySm">
                        {post.likes}
                      </Text>
                    </InlineStack>
                  )}
                  {post.comments && (
                    <InlineStack gap="50" blockAlign="center">
                      <Icon source={ChatIcon} tone="base" />
                      <Text as="span" variant="bodySm">
                        {post.comments}
                      </Text>
                    </InlineStack>
                  )}
                  {post.impressions && (
                    <InlineStack gap="50" blockAlign="center">
                      <Icon source={ViewIcon} tone="base" />
                      <Text as="span" variant="bodySm">
                        {post.impressions}
                      </Text>
                    </InlineStack>
                  )}
                  {post.saved && (
                    <Text as="span" variant="bodySm">
                      💾 {post.saved}
                    </Text>
                  )}
                </InlineStack>
              )}

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

              {/* Caption - Max 3 lines */}
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

              {/* Link to Instagram */}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("post.viewOnInstagram")} →
                </a>
              </Box>

              {/* Action Buttons */}
              <InlineStack gap="200" wrap>
                <Button
                  size="slim"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductTag(post.id);
                  }}
                  accessibilityLabel={t("productTag.button")}
                >
                  {t("productTag.button")}
                  {taggedCount > 0 && ` (${taggedCount})`}
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
                    accessibilityLabel={t("productTag.clear")}
                  >
                    {t("productTag.clear")}
                  </Button>
                )}
              </InlineStack>

              {/* Tagged Products */}
              {taggedCount > 0 && (
                <Box
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    borderLeft: "3px solid #005bd3",
                  }}
                >
                  <Text as="p" variant="bodySm" tone="subdued">
                    <strong>{t("productTag.taggedWith")}:</strong>{" "}
                    {taggedProducts[post.id]
                      .map((p) => p.title || p.id)
                      .join(", ")}
                  </Text>
                </Box>
              )}
            </BlockStack>
          </Box>
        </BlockStack>
      </Card>
    </div>
  );
}
