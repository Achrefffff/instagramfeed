window.instagramPosts = [];
window.currentIndex = 0;

window.initInstagramLightbox = function(posts) {
  window.instagramPosts = posts;
};

window.openLightbox = function(index) {
  window.currentIndex = index;
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
  const caption = document.getElementById('lightbox-caption');
  const link = document.getElementById('lightbox-link');
  const stats = document.getElementById('lightbox-stats');
  const hashtags = document.getElementById('lightbox-hashtags');
  const username = document.getElementById('lightbox-username');
  
  if (image) image.src = post.mediaUrl;
  if (caption) caption.textContent = post.caption || '';
  if (link) link.href = post.permalink;
  if (username) {
    username.textContent = '@' + (post.ownerUsername || post.username || 'Utilisateur inconnu');
  }
  
  let statsHTML = '❤️ ' + post.likeCount.toLocaleString() + ' 💬 ' + post.commentsCount.toLocaleString();
  if (stats) stats.innerHTML = statsHTML;
  
  if (hashtags) hashtags.textContent = post.hashtags || '';
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
