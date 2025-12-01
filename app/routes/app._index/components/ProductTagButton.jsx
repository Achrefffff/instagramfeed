import { useState } from "react";
import { useTranslation } from "react-i18next";

const TagIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 16 16" 
    fill="currentColor" 
    style={{ width: "14px", height: "14px" }}
  >
    <path 
      fillRule="evenodd" 
      d="M4.5 2A2.5 2.5 0 0 0 2 4.5v2.879a2.5 2.5 0 0 0 .732 1.767l4.5 4.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-4.5-4.5A2.5 2.5 0 0 0 7.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" 
      clipRule="evenodd" 
    />
  </svg>
);

export function ProductTagButton({ postId, onTagClick, taggedProductsCount = 0 }) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    onTagClick(postId);
  };

  return (
    <s-button
      commandFor={`product-modal-${postId}`}
      onClick={handleClick}
      style={{
        width: "100%",
      }}
      title={taggedProductsCount > 0 ? t("productTag.buttonWithCount", { count: taggedProductsCount }) : t("productTag.button")}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        justifyContent: "center",
      }}>
        <TagIcon />
        <span>
          {t("productTag.button")}
          {taggedProductsCount > 0 && (
            <span style={{ 
              marginLeft: "4px", 
              color: "#005bd3",
              fontWeight: "600" 
            }}>
              ({taggedProductsCount})
            </span>
          )}
        </span>
      </div>
    </s-button>
  );
}