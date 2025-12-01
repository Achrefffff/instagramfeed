import { useState } from "react";

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
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation(); // Empêche la sélection du post
    onTagClick(postId);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        backgroundColor: isHovered ? "#f0f0f0" : "#fff",
        border: "1px solid #c9cccf",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "500",
        color: "#202223",
        transition: "all 0.2s ease",
        width: "100%",
        justifyContent: "center",
      }}
      title={`Étiqueter des produits${taggedProductsCount > 0 ? ` (${taggedProductsCount} produit${taggedProductsCount > 1 ? 's' : ''} lié${taggedProductsCount > 1 ? 's' : ''})` : ''}`}
    >
      <TagIcon />
      <span>
        Étiqueter
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
    </button>
  );
}