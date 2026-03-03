const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const toTopButton = document.querySelector('.to-top');
const reveals = document.querySelectorAll('.reveal');
const serviceCards = document.querySelectorAll('.service-card--link');
const heroSection = document.querySelector('.hero--static');

const updateServiceCardContrast = (card, src) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const size = 40;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    const avg = total / (data.length / 4);
    if (avg < 140) {
      card.classList.add('is-dark');
      card.classList.remove('is-light');
    } else {
      card.classList.add('is-light');
      card.classList.remove('is-dark');
    }
  };
  img.onerror = () => {
    card.classList.add('is-dark');
    card.classList.remove('is-light');
  };
};

const setMobileMenuContrast = (isDark) => {
  const root = document.documentElement;
  if (isDark) {
    root.style.setProperty('--menu-text', '#f7f3ef');
    root.style.setProperty('--menu-cta-bg', '#f7f3ef');
    root.style.setProperty('--menu-cta-text', '#2c2620');
  } else {
    root.style.setProperty('--menu-text', '#2c2620');
    root.style.setProperty('--menu-cta-bg', '#2c2620');
    root.style.setProperty('--menu-cta-text', '#f7f3ef');
  }
};

const setHeroTextContrast = (src) => {
  if (!src) {
    return;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const size = 40;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    const avg = total / (data.length / 4);
    if (avg < 140) {
      document.body.classList.add('is-dark-hero');
      document.body.classList.remove('is-light-hero');
      setMobileMenuContrast(true);
    } else {
      document.body.classList.add('is-light-hero');
      document.body.classList.remove('is-dark-hero');
      setMobileMenuContrast(false);
    }
  };
  img.onerror = () => {
    document.body.classList.add('is-dark-hero');
    document.body.classList.remove('is-light-hero');
    setMobileMenuContrast(true);
  };
};

const setMenuState = (isOpen) => {
  if (!menuToggle || !mobileMenu) {
    return;
  }
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.hidden = !isOpen;
};

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen);
  });
}

if (mobileMenu) {
  mobileMenu.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      setMenuState(false);
    }
  });
}

if (toTopButton) {
  toTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

reveals.forEach((element) => observer.observe(element));

serviceCards.forEach((card) => {
  const src = card.dataset.image;
  if (src) {
    updateServiceCardContrast(card, src);
  }
});

if (heroSection) {
  const heroImages = (heroSection.dataset.heroImages || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const heroMainImage = heroSection.querySelector('.hero-image--static');
  const heroFadeImage = heroSection.querySelector('.hero-image--fade');
  const prevButton = heroSection.querySelector('[data-hero-prev]');
  const nextButton = heroSection.querySelector('[data-hero-next]');

  if (heroImages.length > 1 && heroMainImage && heroFadeImage && prevButton && nextButton) {
    let currentIndex = heroImages.indexOf(heroMainImage.getAttribute('src'));
    if (currentIndex < 0) {
      currentIndex = 0;
      heroMainImage.src = heroImages[0];
    }
    heroFadeImage.src = heroImages[currentIndex];
    let isTransitioning = false;

    const showHeroImage = (index) => {
      if (isTransitioning || index === currentIndex) {
        return;
      }
      isTransitioning = true;
      heroFadeImage.onload = () => {
        setHeroTextContrast(heroFadeImage.src);
        requestAnimationFrame(() => {
          heroFadeImage.classList.add('is-visible');
        });
      };
      heroFadeImage.onerror = () => {
        isTransitioning = false;
      };
      const handleFadeInEnd = (event) => {
        if (event.propertyName !== 'opacity') {
          return;
        }
        const nextSrc = heroFadeImage.src;
        heroMainImage.src = nextSrc;
        const finalize = () => {
          heroFadeImage.classList.remove('is-visible');
          isTransitioning = false;
        };
        if (heroMainImage.complete && heroMainImage.naturalWidth && heroMainImage.src === nextSrc) {
          requestAnimationFrame(finalize);
        } else {
          heroMainImage.addEventListener('load', finalize, { once: true });
          heroMainImage.addEventListener('error', () => {
            isTransitioning = false;
          }, { once: true });
        }
      };
      heroFadeImage.addEventListener('transitionend', handleFadeInEnd, { once: true });
      heroFadeImage.src = heroImages[index];
      currentIndex = index;
    };

    const autoplayDelay = 5000;
    let autoplayId = null;

    const startAutoplay = () => {
      if (autoplayId) {
        clearInterval(autoplayId);
      }
      autoplayId = setInterval(() => {
        const nextIndex = (currentIndex + 1) % heroImages.length;
        showHeroImage(nextIndex);
      }, autoplayDelay);
    };

    startAutoplay();

    prevButton.addEventListener('click', () => {
      const nextIndex = (currentIndex - 1 + heroImages.length) % heroImages.length;
      showHeroImage(nextIndex);
      startAutoplay();
    });

    nextButton.addEventListener('click', () => {
      const nextIndex = (currentIndex + 1) % heroImages.length;
      showHeroImage(nextIndex);
      startAutoplay();
    });
  }

  if (heroMainImage) {
    if (heroMainImage.complete && heroMainImage.naturalWidth) {
      setHeroTextContrast(heroMainImage.src);
    } else {
      heroMainImage.addEventListener('load', () => setHeroTextContrast(heroMainImage.src));
    }
  }
} else {
  setMobileMenuContrast(false);
}

const galleryItems = Array.from(document.querySelectorAll('.gallery-item')).filter(
  (item) => item.dataset.image
);

if (galleryItems.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <div class="lightbox__overlay" data-lightbox-close></div>
    <div class="lightbox__content" role="dialog" aria-modal="true">
      <button class="lightbox__close" type="button" aria-label="Cerrar">X</button>
      <div class="lightbox__counter">1 / 1</div>
      <button class="lightbox__nav lightbox__prev" type="button" aria-label="Anterior">&lt;</button>
      <img class="lightbox__image" alt="Galeria" />
      <button class="lightbox__nav lightbox__next" type="button" aria-label="Siguiente">&gt;</button>
    </div>
  `;
  document.body.appendChild(lightbox);

  const imageEl = lightbox.querySelector('.lightbox__image');
  const counterEl = lightbox.querySelector('.lightbox__counter');
  const closeBtn = lightbox.querySelector('.lightbox__close');
  const prevBtn = lightbox.querySelector('.lightbox__prev');
  const nextBtn = lightbox.querySelector('.lightbox__next');
  const overlay = lightbox.querySelector('[data-lightbox-close]');
  let currentIndex = 0;

  const updateLightbox = () => {
    const item = galleryItems[currentIndex];
    imageEl.src = item.dataset.image;
    counterEl.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
  };

  const openLightbox = (index) => {
    currentIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightbox();
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    updateLightbox();
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.classList.contains('lightbox__content')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) {
      return;
    }
    if (event.key === 'Escape') {
      closeLightbox();
    }
    if (event.key === 'ArrowLeft') {
      showPrev();
    }
    if (event.key === 'ArrowRight') {
      showNext();
    }
  });
}
