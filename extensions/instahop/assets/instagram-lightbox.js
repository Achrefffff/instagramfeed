window.instagramPosts = [];
window.currentIndex = 0;
window.currentCarouselIndex = 0;

window.initInstagramLightbox = function(posts) {
  window.instagramPosts = posts;
};

window.openLightbox = function(index) {
  window.currentIndex = index;
  window.currentCarouselIndex = 0;
  updateLightbox();
  const lightbox = document.getElementById('instagram-lightbox');
  if (lightbox) {
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
};

window.closeLightbox = function() {
  const lightbox = document.getElementById('instagram-lightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

window.navigatePost = function(direction) {
  window.currentIndex = (window.currentIndex + direction + window.instagramPosts.length) % window.instagramPosts.length;
  window.currentCarouselIndex = 0;
  updateLightbox();
};

window.navigateCarousel = function(direction) {
  const post = window.instagramPosts[window.currentIndex];
  if (!post.carouselImages) return;
  
  const images = JSON.parse(post.carouselImages);
  window.currentCarouselIndex = (window.currentCarouselIndex + direction + images.length) % images.length;
  updateLightbox();
};

window.scrollCarousel = function(direction) {
  const carousel = document.querySelector('.instagram-carousel');
  if (!carousel) return;

  const cardWidth = carousel.querySelector('.instagram-post')?.offsetWidth || 300;
  const gap = parseInt(getComputedStyle(carousel).gap) || 0;

  carousel.scrollBy({
    left: direction * (cardWidth + gap),
    behavior: 'smooth'
  });
};

function updateLightbox() {
  const post = window.instagramPosts[window.currentIndex];
  const image = document.getElementById('lightbox-image');
  const video = document.getElementById('lightbox-video');
  const caption = document.getElementById('lightbox-caption');
  const link = document.getElementById('lightbox-link');
  const stats = document.getElementById('lightbox-stats');
  const hashtags = document.getElementById('lightbox-hashtags');
  const username = document.getElementById('lightbox-username');
  const carouselPrev = document.getElementById('carousel-prev');
  const carouselNext = document.getElementById('carousel-next');
  const carouselDots = document.getElementById('carousel-dots');
  
  let mediaUrl = post.mediaUrl;
  let showCarouselNav = false;
  let isVideo = post.mediaType === 'VIDEO';
  let currentMedia = null;
  
  if (post.carouselImages) {
    try {
      const items = JSON.parse(post.carouselImages);
      if (items.length > 1) {
        currentMedia = items[window.currentCarouselIndex];
        mediaUrl = currentMedia.url || currentMedia;
        isVideo = currentMedia.type === 'VIDEO';
        showCarouselNav = true;
        
        if (carouselDots) {
          carouselDots.innerHTML = '';
          carouselDots.style.display = 'flex';
          for (let i = 0; i < items.length; i++) {
            const dot = document.createElement('div');
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = i === window.currentCarouselIndex ? 'white' : 'rgba(255,255,255,0.5)';
            dot.style.transition = 'background-color 0.2s';
            carouselDots.appendChild(dot);
          }
        }
      } else if (items.length === 1) {
        currentMedia = items[0];
        mediaUrl = currentMedia.url || currentMedia;
        isVideo = currentMedia.type === 'VIDEO';
      }
    } catch (e) {}
  }
  
  if (isVideo) {
    if (image) image.style.display = 'none';
    if (video) {
      video.src = mediaUrl;
      video.style.display = 'block';
      video.play().catch(() => {});
    }
  } else {
    if (video) {
      video.pause();
      video.style.display = 'none';
    }
    if (image) {
      image.src = mediaUrl;
      image.style.display = 'block';
    }
  }
  if (caption) caption.textContent = post.caption || '';
  if (link) link.href = post.permalink;
  if (username) {
    username.textContent = '@' + (post.ownerUsername || post.username || 'Utilisateur inconnu');
  }
  if (carouselPrev) carouselPrev.style.display = showCarouselNav ? 'flex' : 'none';
  if (carouselNext) carouselNext.style.display = showCarouselNav ? 'flex' : 'none';
  if (carouselDots && !showCarouselNav) carouselDots.style.display = 'none';
  
  let statsHTML = [];
  if (post.likeCount > 0) statsHTML.push('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>' + post.likeCount.toLocaleString());
  if (post.commentsCount > 0) statsHTML.push('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>' + post.commentsCount.toLocaleString());
  if (post.reach > 0) statsHTML.push('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>' + post.reach.toLocaleString());
  if (post.saved > 0) statsHTML.push('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>' + post.saved.toLocaleString());
  if (stats) stats.innerHTML = statsHTML.join(' ');
  
  if (hashtags) {
    hashtags.textContent = (post.hashtags && post.hashtags !== '00') ? post.hashtags : '';
  }
}

document.addEventListener('keydown', function(e) {
  const lightbox = document.getElementById('instagram-lightbox');
  if (lightbox && lightbox.style.display === 'block') {
    if (e.key === 'Escape') window.closeLightbox();
    if (e.key === 'ArrowLeft') window.navigatePost(-1);
    if (e.key === 'ArrowRight') window.navigatePost(1);
  }
});

document.addEventListener('click', function(e) {
  const lightbox = document.getElementById('instagram-lightbox');
  if (lightbox && lightbox.style.display === 'block') {
    if (e.target.id === 'instagram-lightbox' || e.target.classList.contains('lightbox-image-container')) {
      window.closeLightbox();
    }
  }
});
