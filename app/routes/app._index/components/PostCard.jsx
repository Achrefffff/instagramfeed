import {
  Card,
  Box,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Text,
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

  // SVG icons as components
  const LikeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      style={{ width: "14px", height: "14px" }}
    >
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );

  const CommentIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      style={{ width: "14px", height: "14px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
      />
    </svg>
  );

  const ReachIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      style={{ width: "14px", height: "14px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );

  const SaveIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      style={{ width: "14px", height: "14px" }}
    >
      <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  );

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
        boxShadow: isSelected
          ? "0 0 0 2px rgba(0, 91, 211, 0.1)"
          : "0 1px 3px rgba(0, 0, 0, 0.08)",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: "320px",
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
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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

        {/* Media Container - Videos et images */}
        <Box
          style={{
            width: "100%",
            height: "280px",
            backgroundColor: "#f5f5f5",
            overflow: "hidden",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
        >
          {post.mediaType === "VIDEO" ? (
            <>
              <video
                src={post.mediaUrl}
                poster={post.mediaUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                preload="metadata"
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#fff",
                  fontSize: "40px",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  pointerEvents: "none",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: "1",
                }}
              >
                ▶
              </div>
            </>
          ) : post.mediaType === "CAROUSEL_ALBUM" ? (
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
                  fontSize: "28px",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  pointerEvents: "none",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ≋
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

      {/* Content - Scrollable if needed */}
      <BlockStack
        gap="300"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px",
        }}
      >
        {/* Username & Date */}
        <Box>
          <Text as="p" variant="bodySm" fontWeight="semibold">
            {post.ownerUsername || post.accountUsername}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            {new Date(post.timestamp).toLocaleDateString()}
          </Text>
        </Box>

        {/* Selected Badge */}
        {isSelected && (
          <Badge tone="info" progress="complete">
            ✓ {t("post.selected")}
          </Badge>
        )}

        {/* Stats - Grid 2x2 */}
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            padding: "12px",
            backgroundColor: "#f9f9f9",
            borderRadius: "6px",
          }}
        >
          {post.likes && (
            <InlineStack gap="100" blockAlign="center">
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#e1306c",
                }}
              >
                <LikeIcon />
              </Box>
              <Box>
                <Text as="span" variant="bodySm" tone="subdued">
                  Likes
                </Text>
                <br />
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  {post.likes}
                </Text>
              </Box>
            </InlineStack>
          )}
          {post.comments && (
            <InlineStack gap="100" blockAlign="center">
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#405de6",
                }}
              >
                <CommentIcon />
              </Box>
              <Box>
                <Text as="span" variant="bodySm" tone="subdued">
                  Com.
                </Text>
                <br />
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  {post.comments}
                </Text>
              </Box>
            </InlineStack>
          )}
          {post.impressions && (
            <InlineStack gap="100" blockAlign="center">
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#5b51d8",
                }}
              >
                <ReachIcon />
              </Box>
              <Box>
                <Text as="span" variant="bodySm" tone="subdued">
                  Reach
                </Text>
                <br />
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  {post.impressions}
                </Text>
              </Box>
            </InlineStack>
          )}
          {post.saved && (
            <InlineStack gap="100" blockAlign="center">
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#c13584",
                }}
              >
                <SaveIcon />
              </Box>
              <Box>
                <Text as="span" variant="bodySm" tone="subdued">
                  Saves
                </Text>
                <br />
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  {post.saved}
                </Text>
              </Box>
            </InlineStack>
          )}
        </Box>

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
              fontSize: "11px",
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
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: "12px",
            color: "#202223",
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
            {t("post.viewOnInstagram")} →
          </a>
        </Box>

        {/* Tagged Products Display - Styled box */}
        {taggedCount > 0 && (
          <Box
            style={{
              padding: "10px 12px",
              backgroundColor: "#e8f0f7",
              borderLeft: "3px solid #005bd3",
              borderRadius: "4px",
            }}
          >
            <Text as="p" variant="bodySm" fontWeight="semibold" tone="info">
              {taggedCount} {t("productTag.taggedWith")}
            </Text>
            <Text
              as="p"
              variant="bodySm"
              style={{
                fontSize: "11px",
                color: "#6d7175",
                marginTop: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {taggedProducts[post.id].map((p) => p.title || p.id).join(", ")}
            </Text>
          </Box>
        )}

        {/* Actions - Pushed to bottom */}
        <Box style={{ marginTop: "auto" }}>
          <InlineStack gap="200">
            <Button
              size="slim"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                onProductTag(post.id);
              }}
              accessibilityLabel={t("productTag.tag")}
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
                accessibilityLabel={t("productTag.clear")}
              >
                {t("productTag.clear")}
              </Button>
            )}
          </InlineStack>
        </Box>
      </BlockStack>
    </Card>
  );
}
