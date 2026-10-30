(function () {
  "use strict";

  const body = document.body;
  const header = document.querySelector(".site-header");

  /* Header state */
  const onScroll = function () {
    body.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  const burger = document.querySelector(".burger");
  const mobileMenu = document.getElementById("mobile-menu");

  const setMenu = function (open) {
    body.classList.toggle("menu-open", open);
    body.classList.toggle("is-locked", open);
    if (burger) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    }
    if (mobileMenu) {
      mobileMenu.setAttribute("aria-hidden", String(!open));
    }
  };

  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(!body.classList.contains("menu-open"));
    });
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }

  /* Reveal on scroll */
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealItems.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  /* FAQ */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    const question = item.querySelector(".faq-q");
    if (!question) return;
    question.addEventListener("click", function () {
      const isOpen = item.classList.contains("is-open");
      const group = item.closest(".faq");
      if (group) {
        group.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove("is-open");
            const q = openItem.querySelector(".faq-q");
            if (q) q.setAttribute("aria-expanded", "false");
          }
        });
      }
      item.classList.toggle("is-open", !isOpen);
      question.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && body.classList.contains("menu-open")) {
      setMenu(false);
    }
  });

  /* Gallery filters + lightbox */
  const galleryCards = Array.from(document.querySelectorAll("[data-gallery] .gallery-card"));
  const galleryCount = document.querySelector("[data-gallery-count]");
  const galleryFilters = Array.from(document.querySelectorAll("[data-filter]"));
  const lightbox = document.querySelector("[data-lightbox-root]");
  let closeLightbox = null;

  const photoWord = function (n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return " фотография";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return " фотографии";
    return " фотографий";
  };

  const visibleGalleryCards = function () {
    return galleryCards.filter(function (card) {
      return !card.classList.contains("is-hidden");
    });
  };

  const updateGalleryCount = function () {
    if (!galleryCount) return;
    const total = visibleGalleryCards().length;
    galleryCount.textContent = String(total) + photoWord(total);
  };

  galleryFilters.forEach(function (button) {
    button.addEventListener("click", function () {
      const filter = button.getAttribute("data-filter");
      galleryFilters.forEach(function (other) {
        const active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      galleryCards.forEach(function (card) {
        card.classList.toggle(
          "is-hidden",
          filter !== "all" && card.getAttribute("data-cat") !== filter
        );
      });
      if (lightbox && lightbox.classList.contains("is-open") && closeLightbox) closeLightbox();
      updateGalleryCount();
    });
  });

  if (galleryCount) updateGalleryCount();

  if (lightbox) {
    const lightboxImage = lightbox.querySelector(".lightbox__img");
    const lightboxCaption = lightbox.querySelector(".lightbox__caption");
    const lightboxClose = lightbox.querySelector("[data-lightbox-close]");
    const lightboxPrev = lightbox.querySelector("[data-lightbox-prev]");
    const lightboxNext = lightbox.querySelector("[data-lightbox-next]");
    let lightboxTrigger = null;
    let lightboxIndex = 0;

    const visibleTriggers = function () {
      return visibleGalleryCards()
        .map(function (card) {
          return card.querySelector("[data-lightbox]");
        })
        .filter(Boolean);
    };

    const renderLightbox = function (index) {
      const triggers = visibleTriggers();
      if (!triggers.length) return;
      lightboxIndex = (index + triggers.length) % triggers.length;
      const trigger = triggers[lightboxIndex];
      const source = trigger.getAttribute("data-full");
      const image = trigger.querySelector("img");
      if (lightboxImage) {
        lightboxImage.src = source;
        lightboxImage.alt = image ? image.alt : "";
      }
      if (lightboxCaption) {
        lightboxCaption.textContent = trigger.getAttribute("data-caption") || "";
      }
      const preload = new Image();
      preload.src = triggers[(lightboxIndex + 1) % triggers.length].getAttribute("data-full");
    };

    const openLightbox = function (trigger) {
      lightboxTrigger = trigger;
      const triggers = visibleTriggers();
      renderLightbox(triggers.indexOf(trigger));
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      body.classList.add("lightbox-open");
      window.setTimeout(function () {
        if (lightboxClose) lightboxClose.focus();
      }, 60);
    };

    closeLightbox = function () {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      body.classList.remove("lightbox-open");
      if (lightboxTrigger) lightboxTrigger.focus();
      lightboxTrigger = null;
    };

    document.querySelectorAll("[data-lightbox]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        openLightbox(trigger);
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", function () {
        renderLightbox(lightboxIndex - 1);
      });
    }
    if (lightboxNext) {
      lightboxNext.addEventListener("click", function () {
        renderLightbox(lightboxIndex + 1);
      });
    }

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        renderLightbox(lightboxIndex - 1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        renderLightbox(lightboxIndex + 1);
        return;
      }
      if (event.key === "Tab") {
        const focusable = [lightboxClose, lightboxPrev, lightboxNext].filter(Boolean);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* Back to top */
  document.querySelectorAll("[data-to-top]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* Year */
  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
})();
