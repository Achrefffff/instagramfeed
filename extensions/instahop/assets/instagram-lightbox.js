window.instagramPosts = [];
window.productTags = {};
window.currentIndex = 0;
window.currentCarouselIndex = 0;
window.previousFocusElement = null;
window.keyboardHandler = null;

window.initInstagramLightbox = function (posts, tags) {
  window.instagramPosts = posts;
  window.productTags = tags || {};
};

window.openLightbox = function (index) {
  window.currentIndex = index;
  window.currentCarouselIndex = 0;
  updateLightbox();

  const lightbox = document.getElementById("instagram-lightbox");
  if (lightbox) {
    window.previousFocusElement = document.activeElement;
    lightbox.style.display = "block";
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeButton = document.getElementById("lightbox-close");
    if (closeButton) closeButton.focus();

    if (!window.keyboardHandler) {
      window.keyboardHandler = handleLightboxKeyboard;
      document.addEventListener("keydown", window.keyboardHandler);
    }
  }
};

window.closeLightbox = function () {
  const lightbox = document.getElementById("instagram-lightbox");
  if (lightbox) {
    lightbox.style.display = "none";
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "auto";

    const video = document.getElementById("lightbox-video");
    if (video) video.pause();

    if (window.previousFocusElement) {
      window.previousFocusElement.focus();
    }

    if (window.keyboardHandler) {
      document.removeEventListener("keydown", window.keyboardHandler);
      window.keyboardHandler = null;
    }
  }
};

function handleLightboxKeyboard(e) {
  const lightbox = document.getElementById("instagram-lightbox");
  if (!lightbox || lightbox.style.display !== "block") return;

  switch (e.key) {
    case "Escape":
      e.preventDefault();
      window.closeLightbox();
      break;
    case "ArrowLeft":
      e.preventDefault();
      window.navigatePost(-1);
      break;
    case "ArrowRight":
      e.preventDefault();
      window.navigatePost(1);
      break;
  }
}

window.navigatePost = function (direction) {
  window.currentIndex =
    (window.currentIndex + direction + window.instagramPosts.length) %
    window.instagramPosts.length;
  window.currentCarouselIndex = 0;
  updateLightbox();
  announceToScreenReader(
    `Post ${window.currentIndex + 1} de ${window.instagramPosts.length}`,
  );
};

window.navigateCarousel = function (direction) {
  const post = window.instagramPosts[window.currentIndex];
  if (!post.carouselImages) return;

  const images = JSON.parse(post.carouselImages);
  window.currentCarouselIndex =
    (window.currentCarouselIndex + direction + images.length) % images.length;
  updateLightbox();
  announceToScreenReader(
    `Image ${window.currentCarouselIndex + 1} de ${images.length}`,
  );
};

window.scrollCarousel = function (direction) {
  const carousel = document.querySelector(".instagram-carousel");
  if (!carousel) return;

  const cardWidth =
    carousel.querySelector(".instagram-post")?.offsetWidth || 300;
  const gap = parseInt(getComputedStyle(carousel).gap) || 0;
  carousel.scrollBy({
    left: direction * (cardWidth + gap),
    behavior: "smooth",
  });
};

function announceToScreenReader(message) {
  const announcement = document.getElementById("lightbox-announcement");
  if (announcement) {
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.textContent = message;
  }
}

function updateLightbox() {
  const post = window.instagramPosts[window.currentIndex];
  const image = document.getElementById("lightbox-image");
  const video = document.getElementById("lightbox-video");
  const caption = document.getElementById("lightbox-caption");
  const link = document.getElementById("lightbox-link");
  const stats = document.getElementById("lightbox-stats");
  const hashtags = document.getElementById("lightbox-hashtags");
  const username = document.getElementById("lightbox-username");
  const carouselPrev = document.getElementById("carousel-prev");
  const carouselNext = document.getElementById("carousel-next");
  const carouselDots = document.getElementById("carousel-dots");

  let mediaUrl = post.mediaUrl;
  let showCarouselNav = false;
  let isVideo = post.mediaType === "VIDEO";
  let currentMedia = null;

  if (post.carouselImages) {
    try {
      const items = JSON.parse(post.carouselImages);
      if (items.length > 1) {
        currentMedia = items[window.currentCarouselIndex];
        mediaUrl = currentMedia.url || currentMedia;
        isVideo = currentMedia.type === "VIDEO";
        showCarouselNav = true;

        if (carouselDots) {
          carouselDots.innerHTML = "";
          carouselDots.style.display = "flex";
          for (let i = 0; i < items.length; i++) {
            const dot = document.createElement("div");
            dot.style.width = "6px";
            dot.style.height = "6px";
            dot.style.borderRadius = "50%";
            dot.style.backgroundColor =
              i === window.currentCarouselIndex
                ? "white"
                : "rgba(255,255,255,0.5)";
            dot.style.transition = "background-color 0.2s";
            dot.setAttribute("role", "presentation");
            dot.setAttribute("aria-label", `Slide ${i + 1}`);
            carouselDots.appendChild(dot);
          }
        }
      } else if (items.length === 1) {
        currentMedia = items[0];
        mediaUrl = currentMedia.url || currentMedia;
        isVideo = currentMedia.type === "VIDEO";
      }
    } catch (e) {
      // Silently fail if JSON parse fails
    }
  }

  if (isVideo) {
    if (image) image.style.display = "none";
    if (video) {
      video.src = mediaUrl;
      video.style.display = "block";
      video.setAttribute("aria-label", post.caption || "Post video");
      video.play().catch(() => {});
    }
  } else {
    if (video) {
      video.pause();
      video.style.display = "none";
    }
    if (image) {
      image.src = mediaUrl;
      image.style.display = "block";
      image.setAttribute("alt", post.caption || "Instagram post image");
    }
  }

  if (caption) {
    caption.textContent = post.caption || "";
    caption.setAttribute("role", "text");
  }

  if (link) {
    link.href = post.permalink;
    link.setAttribute("aria-label", "View on Instagram");
  }

  if (username) {
    username.textContent =
      "@" + (post.ownerUsername || post.username || "Unknown user");
  }

  if (carouselPrev) {
    carouselPrev.style.display = showCarouselNav ? "flex" : "none";
    carouselPrev.setAttribute(
      "aria-hidden",
      showCarouselNav ? "false" : "true",
    );
  }

  if (carouselNext) {
    carouselNext.style.display = showCarouselNav ? "flex" : "none";
    carouselNext.setAttribute(
      "aria-hidden",
      showCarouselNav ? "false" : "true",
    );
  }

  if (carouselDots && !showCarouselNav) {
    carouselDots.style.display = "none";
  }

  let statsHTML = [];

  if (post.likeCount && post.likeCount > 0) {
    statsHTML.push(
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg><span>' +
        (post.likeCount || 0).toLocaleString() +
        "</span>",
    );
  }

  if (post.commentsCount && post.commentsCount > 0) {
    statsHTML.push(
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg><span>' +
        (post.commentsCount || 0).toLocaleString() +
        "</span>",
    );
  }

  if (post.reach && post.reach > 0) {
    statsHTML.push(
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg><span>' +
        (post.reach || 0).toLocaleString() +
        " reach</span>",
    );
  }

  if (post.saved && post.saved > 0) {
    statsHTML.push(
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg><span>' +
        (post.saved || 0).toLocaleString() +
        " saved</span>",
    );
  }

  if (stats) {
    stats.innerHTML = statsHTML.join(
      '<span style="margin: 0 8px; opacity: 0.5;">•</span>',
    );
  }

  if (hashtags) {
    hashtags.textContent =
      post.hashtags && post.hashtags !== "00" ? post.hashtags : "";
  }

  const productsContainer = document.getElementById("lightbox-products");
  if (productsContainer) {
    const taggedProducts = window.productTags[post.id];
    if (taggedProducts && taggedProducts.length > 0) {
      let productsHTML =
        '<h4 style="margin: 16px 0 12px 0; font-size: 14px; font-weight: 600; color: #262626;">Produits associés</h4>';
      productsHTML += '<div class="tagged-products-list" role="list">';

      taggedProducts.forEach((product, idx) => {
        const price =
          product.price && product.currency
            ? `${product.price} ${product.currency}`
            : "Prix non disponible";
        productsHTML += `<div class="tagged-product-item" role="listitem">
          ${product.image ? `<img src="${product.image}" alt="${product.title}" class="product-image">` : ""}
          <div class="product-info">
            <p class="product-title">${product.title}</p>
            <p class="product-price">${price}</p>
          </div>
          <a href="/products/${product.handle}" target="_blank" rel="noopener noreferrer" class="product-link" aria-label="View ${product.title} product">Voir</a>
        </div>`;
      });

      productsHTML += "</div>";
      productsContainer.innerHTML = productsHTML;
      productsContainer.setAttribute(
        "aria-label",
        `${taggedProducts.length} associated products`,
      );
    } else {
      productsContainer.innerHTML = "";
    }
  }
}

document.addEventListener("click", function (e) {
  const lightbox = document.getElementById("instagram-lightbox");
  if (lightbox && lightbox.style.display === "block") {
    if (
      e.target.id === "instagram-lightbox" ||
      e.target.classList.contains("lightbox-image-container")
    ) {
      window.closeLightbox();
    }
  }
});
