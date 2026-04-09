const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const toTopButton = document.querySelector('.to-top');
const reveals = document.querySelectorAll('.reveal');
const serviceCards = document.querySelectorAll('.service-card--link');
const heroSection = document.querySelector('.hero--static');
const pageHeroSection = document.querySelector('.page-hero');
const logo = document.querySelector('.logo');
const navGroup = document.querySelector('.nav-group');
const heroArrowTargets = Array.from(document.querySelectorAll('.hero-arrow'));
const headerContrastTargets = [logo, navGroup, menuToggle, ...heroArrowTargets].filter(Boolean);
let headerContrastRequestId = 0;

const getAverageBrightnessFromImageData = (data) => {
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return total / (data.length / 4);
};

const getImageAverageBrightness = (src, onResult, onError) => {
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
    onResult(getAverageBrightnessFromImageData(data));
  };
  img.onerror = () => {
    if (typeof onError === 'function') {
      onError();
    }
  };
};

const updateServiceCardContrast = (card, src) => {
  const title = card.querySelector('.service-title');
  const applyContrast = (avg) => {
    if (avg < 140) {
      card.classList.add('is-dark');
      card.classList.remove('is-light');
    } else {
      card.classList.add('is-light');
      card.classList.remove('is-dark');
    }
  };

  if (!title) {
    getImageAverageBrightness(src, applyContrast, () => {
      card.classList.add('is-dark');
      card.classList.remove('is-light');
    });
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  img.onload = () => {
    const sampleRect = getCoverSampleRect(
      card.getBoundingClientRect(),
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      title.getBoundingClientRect()
    );

    if (!sampleRect) {
      getImageAverageBrightness(src, applyContrast, () => {
        card.classList.add('is-dark');
        card.classList.remove('is-light');
      });
      return;
    }

    applyContrast(getRegionAverageBrightness(img, sampleRect));
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

const setHeaderContrastMode = (isDark) => {
  if (isDark) {
    document.body.classList.add('is-dark-hero');
    document.body.classList.remove('is-light-hero');
  } else {
    document.body.classList.add('is-light-hero');
    document.body.classList.remove('is-dark-hero');
  }
  setMobileMenuContrast(isDark);
};

const setHeaderTextContrast = (src) => {
  if (!src) {
    setHeaderContrastMode(false);
    return;
  }
  getImageAverageBrightness(src, (avg) => {
    setHeaderContrastMode(avg < 140);
  }, () => {
    setHeaderContrastMode(true);
  });
};

const getBackgroundImageUrl = (element) => {
  if (!element) {
    return '';
  }
  const backgroundImage = getComputedStyle(element).backgroundImage;
  const match = backgroundImage.match(/url\((['"]?)(.*?)\1\)/);
  return match ? match[2] : '';
};

const setHeaderZoneContrast = (target, isDark) => {
  target.classList.toggle('is-dark-zone', isDark);
  target.classList.toggle('is-light-zone', !isDark);
};

const clearHeaderZoneContrast = () => {
  headerContrastTargets.forEach((target) => {
    target.classList.remove('is-dark-zone', 'is-light-zone');
  });
};

const getRectIntersection = (firstRect, secondRect) => {
  const left = Math.max(firstRect.left, secondRect.left);
  const top = Math.max(firstRect.top, secondRect.top);
  const right = Math.min(firstRect.right, secondRect.right);
  const bottom = Math.min(firstRect.bottom, secondRect.bottom);

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
};

const getCoverSampleRect = (containerRect, imageWidth, imageHeight, targetRect) => {
  const intersection = getRectIntersection(targetRect, containerRect);

  if (!intersection) {
    return null;
  }

  const scale = Math.max(
    containerRect.width / imageWidth,
    containerRect.height / imageHeight
  );
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;
  const offsetX = (containerRect.width - renderedWidth) / 2;
  const offsetY = (containerRect.height - renderedHeight) / 2;
  const sourceX = (intersection.left - containerRect.left - offsetX) / scale;
  const sourceY = (intersection.top - containerRect.top - offsetY) / scale;
  const sourceWidth = intersection.width / scale;
  const sourceHeight = intersection.height / scale;

  const clampedX = Math.max(0, sourceX);
  const clampedY = Math.max(0, sourceY);
  const clampedWidth = Math.min(imageWidth - clampedX, sourceWidth);
  const clampedHeight = Math.min(imageHeight - clampedY, sourceHeight);

  if (clampedWidth <= 0 || clampedHeight <= 0) {
    return null;
  }

  return {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  };
};

const getRegionAverageBrightness = (img, sampleRect) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const size = 40;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(
    img,
    sampleRect.x,
    sampleRect.y,
    sampleRect.width,
    sampleRect.height,
    0,
    0,
    size,
    size
  );
  const { data } = ctx.getImageData(0, 0, size, size);
  return getAverageBrightnessFromImageData(data);
};

const updateHeaderZoneContrast = (src, container) => {
  if (!src || !container || !headerContrastTargets.length) {
    clearHeaderZoneContrast();
    return;
  }

  const requestId = ++headerContrastRequestId;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  img.onload = () => {
    if (requestId !== headerContrastRequestId) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const fallbackIsDark = document.body.classList.contains('is-dark-hero');

    headerContrastTargets.forEach((target) => {
      const sampleRect = getCoverSampleRect(
        containerRect,
        img.naturalWidth || img.width,
        img.naturalHeight || img.height,
        target.getBoundingClientRect()
      );

      if (!sampleRect) {
        setHeaderZoneContrast(target, fallbackIsDark);
        return;
      }

      const avg = getRegionAverageBrightness(img, sampleRect);
      setHeaderZoneContrast(target, avg < 140);
    });
  };
  img.onerror = () => {
    if (requestId !== headerContrastRequestId) {
      return;
    }
    clearHeaderZoneContrast();
  };
};

const refreshHeaderZoneContrast = () => {
  if (heroSection) {
    const currentHeroImage =
      heroSection.querySelector('.hero-image--fade.is-visible') ||
      heroSection.querySelector('.hero-image--static');
    updateHeaderZoneContrast(currentHeroImage?.currentSrc || currentHeroImage?.src, heroSection);
  } else if (pageHeroSection) {
    updateHeaderZoneContrast(getBackgroundImageUrl(pageHeroSection), pageHeroSection);
  } else {
    clearHeaderZoneContrast();
  }
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

const refreshServiceCardContrast = () => {
  serviceCards.forEach((card) => {
    const src = card.dataset.image;
    if (src) {
      updateServiceCardContrast(card, src);
    }
  });
};

refreshServiceCardContrast();

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
        setHeaderTextContrast(heroFadeImage.src);
        updateHeaderZoneContrast(heroFadeImage.src, heroSection);
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
      setHeaderTextContrast(heroMainImage.src);
      updateHeaderZoneContrast(heroMainImage.currentSrc || heroMainImage.src, heroSection);
    } else {
      heroMainImage.addEventListener('load', () => {
        setHeaderTextContrast(heroMainImage.src);
        updateHeaderZoneContrast(heroMainImage.currentSrc || heroMainImage.src, heroSection);
      });
    }
  }
} else if (pageHeroSection) {
  const pageHeroImage = getBackgroundImageUrl(pageHeroSection);
  setHeaderTextContrast(pageHeroImage);
  updateHeaderZoneContrast(pageHeroImage, pageHeroSection);
} else {
  setHeaderContrastMode(false);
  clearHeaderZoneContrast();
}

window.addEventListener('resize', () => {
  refreshHeaderZoneContrast();
  refreshServiceCardContrast();
});

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
