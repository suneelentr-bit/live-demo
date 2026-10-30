/* ==========================================================================
   Seismic Chocolates — shared interactions
   Vanilla JavaScript only. Every feature degrades gracefully without JS.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function prefersReducedMotion() {
    return reduceMotionQuery.matches;
  }

  /* ------------------------------------------------------------------------
     Sticky header shadow
     ------------------------------------------------------------------------ */
  var header = doc.getElementById("sc-header");

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  if (header) {
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  /* ------------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------------ */
  var menuToggle = doc.querySelector(".sc-menu-toggle");
  var primaryNav = doc.getElementById("sc-primary-nav");

  if (menuToggle && primaryNav) {
    var closeMenu = function (restoreFocus) {
      primaryNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      if (restoreFocus) menuToggle.focus();
    };

    var openMenu = function () {
      primaryNav.classList.add("is-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close menu");
    };

    menuToggle.addEventListener("click", function () {
      if (menuToggle.getAttribute("aria-expanded") === "true") {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    primaryNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu(false);
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && primaryNav.classList.contains("is-open")) {
        closeMenu(true);
      }
    });

    doc.addEventListener("click", function (event) {
      if (
        primaryNav.classList.contains("is-open") &&
        !event.target.closest(".sc-header")
      ) {
        closeMenu(false);
      }
    });

    var desktopQuery = window.matchMedia("(min-width: 961px)");
    var handleDesktopChange = function (event) {
      if (event.matches) closeMenu(false);
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleDesktopChange);
    }
  }

  /* ------------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------------ */
  doc.querySelectorAll(".sc-year").forEach(function (year) {
    year.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------------------
     Scroll reveal with reduced-motion support
     ------------------------------------------------------------------------ */
  var revealItems = Array.prototype.slice.call(doc.querySelectorAll(".sc-reveal"));

  if (revealItems.length) {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) {
        item.classList.add("is-revealed");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
      );

      revealItems.forEach(function (item) {
        revealObserver.observe(item);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Graceful image fallback
     ------------------------------------------------------------------------ */
  var siteImages = doc.querySelectorAll(
    ".sc-media img, .sc-hero__image, .sc-page-hero__image, .sc-gift__media img, .sc-product-card__media img, .sc-modal__media img"
  );

  siteImages.forEach(function (image) {
    var markBroken = function () {
      image.classList.add("sc-image-error");
      var media = image.closest(".sc-media");
      if (media) media.classList.add("sc-media--fallback");
    };

    if (image.complete && image.naturalWidth === 0) {
      markBroken();
    }

    image.addEventListener("error", markBroken);
  });

  /* ------------------------------------------------------------------------
     Product filtering — chocolates.html
     ------------------------------------------------------------------------ */
  var productGrid = doc.getElementById("sc-product-grid");

  if (productGrid) {
    var productCards = Array.prototype.slice.call(
      productGrid.querySelectorAll("[data-category]")
    );
    var filterButtons = Array.prototype.slice.call(
      doc.querySelectorAll("[data-filter]")
    );
    var countTarget = doc.querySelector("[data-collection-count]");
    var statusTarget = doc.querySelector(".sc-collection-status");
    var emptyState = doc.getElementById("sc-collection-empty");
    var validFilters = filterButtons.map(function (button) {
      return button.getAttribute("data-filter");
    });

    var applyFilter = function (filter, updateUrl) {
      var visible = 0;

      filterButtons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          button.getAttribute("data-filter") === filter ? "true" : "false"
        );
      });

      productCards.forEach(function (card) {
        var matches =
          filter === "all" || card.getAttribute("data-category") === filter;

        card.classList.toggle("sc-product-card--hidden", !matches);

        if (matches) {
          visible += 1;
          // Cards hidden at load may never have crossed the observer threshold.
          card.classList.add("is-revealed");
        }
      });

      if (countTarget) countTarget.textContent = String(visible);

      if (statusTarget) {
        statusTarget.innerHTML =
          "Showing <span>" +
          visible +
          "</span> " +
          (visible === 1 ? "chocolate" : "chocolates");
      }

      if (emptyState) emptyState.hidden = visible !== 0;

      if (updateUrl !== false && window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        if (filter === "all") {
          url.searchParams.delete("category");
        } else {
          url.searchParams.set("category", filter);
        }
        window.history.replaceState(null, "", url.toString());
      }
    };

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyFilter(button.getAttribute("data-filter"), true);
      });
    });

    var requestedFilter = new URLSearchParams(window.location.search).get(
      "category"
    );

    if (requestedFilter && validFilters.indexOf(requestedFilter) !== -1) {
      applyFilter(requestedFilter, false);
    } else {
      applyFilter("all", false);
    }
  }

  /* ------------------------------------------------------------------------
     Accessible product detail modal — chocolates.html
     ------------------------------------------------------------------------ */
  var modal = doc.getElementById("sc-product-modal");

  if (modal) {
    var productOpeners = Array.prototype.slice.call(
      doc.querySelectorAll("[data-product-open]")
    );
    var modalPanel = modal.querySelector(".sc-modal__panel");
    var modalCloseButton = modal.querySelector(".sc-modal__close");
    var lastModalTrigger = null;
    var modalFields = {
      category: doc.getElementById("sc-modal-category"),
      title: doc.getElementById("sc-modal-title"),
      price: doc.getElementById("sc-modal-price"),
      description: doc.getElementById("sc-modal-desc"),
      notes: doc.getElementById("sc-modal-notes"),
      weight: doc.getElementById("sc-modal-weight")
    };

    var fillModal = function (trigger) {
      if (modalFields.category) {
        modalFields.category.textContent = trigger.getAttribute("data-category") || "";
      }
      if (modalFields.title) {
        modalFields.title.textContent = trigger.getAttribute("data-name") || "";
      }
      if (modalFields.price) {
        modalFields.price.textContent = trigger.getAttribute("data-price") || "";
      }
      if (modalFields.description) {
        modalFields.description.textContent =
          trigger.getAttribute("data-description") || "";
      }
      if (modalFields.notes) {
        modalFields.notes.textContent = trigger.getAttribute("data-notes") || "";
      }
      if (modalFields.weight) {
        modalFields.weight.textContent = trigger.getAttribute("data-weight") || "";
      }

      var modalImage = doc.getElementById("sc-modal-image");
      if (modalImage) {
        modalImage.src = trigger.getAttribute("data-image") || "";
        modalImage.alt = trigger.getAttribute("data-alt") || "";
      }
    };

    var openModal = function (trigger) {
      lastModalTrigger = trigger;
      fillModal(trigger);
      modal.hidden = false;
      doc.body.classList.add("sc-modal-open");
      if (modalCloseButton) modalCloseButton.focus();
    };

    var closeModal = function () {
      modal.hidden = true;
      doc.body.classList.remove("sc-modal-open");
      if (lastModalTrigger) lastModalTrigger.focus();
    };

    productOpeners.forEach(function (opener) {
      opener.addEventListener("click", function () {
        openModal(opener);
      });
    });

    modal.querySelectorAll("[data-modal-close]").forEach(function (closer) {
      closer.addEventListener("click", closeModal);
    });

    doc.addEventListener("keydown", function (event) {
      if (modal.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !modalPanel) return;

      var focusable = Array.prototype.slice
        .call(
          modalPanel.querySelectorAll(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        )
        .filter(function (element) {
          return element.offsetParent !== null;
        });

      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Contact form validation and demo submission — contact.html
     ------------------------------------------------------------------------ */
  var contactForm = doc.getElementById("sc-contact-form");

  if (contactForm) {
    var successPanel = doc.getElementById("sc-form-success");
    var successName = successPanel
      ? successPanel.querySelector("[data-success-name]")
      : null;
    var resetButton = doc.getElementById("sc-form-reset");
    var formStatus = doc.getElementById("sc-form-status");

    var fieldConfig = {
      name: {
        input: doc.getElementById("sc-name"),
        error: doc.getElementById("sc-name-error"),
        validate: function (value) {
          if (!value) return "Please enter your name.";
          if (value.length < 2) return "Please enter at least two characters.";
          return "";
        }
      },
      email: {
        input: doc.getElementById("sc-email"),
        error: doc.getElementById("sc-email-error"),
        validate: function (value) {
          if (!value) return "Please enter your email address.";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
            return "That email address does not look quite right.";
          }
          return "";
        }
      },
      subject: {
        input: doc.getElementById("sc-subject"),
        error: doc.getElementById("sc-subject-error"),
        validate: function (value) {
          return value ? "" : "Please choose a subject.";
        }
      },
      message: {
        input: doc.getElementById("sc-message"),
        error: doc.getElementById("sc-message-error"),
        validate: function (value) {
          if (!value) return "Please write a short message.";
          if (value.length < 10) {
            return "Please add a little more detail (at least 10 characters).";
          }
          return "";
        }
      }
    };

    var setFieldError = function (config, message) {
      if (!config.input) return;
      var wrapper = config.input.closest(".sc-field");

      if (message) {
        if (wrapper) wrapper.classList.add("is-invalid");
        config.input.setAttribute("aria-invalid", "true");
        if (config.error) config.error.textContent = message;
      } else {
        if (wrapper) wrapper.classList.remove("is-invalid");
        config.input.removeAttribute("aria-invalid");
        if (config.error) config.error.textContent = "";
      }
    };

    var validateField = function (config) {
      if (!config.input) return true;
      var value = config.input.value.trim();
      var message = config.validate(value);
      setFieldError(config, message);
      return !message;
    };

    Object.keys(fieldConfig).forEach(function (key) {
      var config = fieldConfig[key];
      if (!config.input) return;

      config.input.addEventListener("blur", function () {
        validateField(config);
      });

      var liveEvent = config.input.tagName === "SELECT" ? "change" : "input";
      config.input.addEventListener(liveEvent, function () {
        var wrapper = config.input.closest(".sc-field");
        if (wrapper && wrapper.classList.contains("is-invalid")) {
          validateField(config);
        }
      });
    });

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      var allValid = true;

      Object.keys(fieldConfig).forEach(function (key) {
        var config = fieldConfig[key];
        var valid = validateField(config);
        if (!valid) {
          allValid = false;
          if (!firstInvalid) firstInvalid = config.input;
        }
      });

      if (!allValid) {
        if (formStatus) {
          formStatus.textContent =
            "There are a few fields to check. Please review the messages below the form fields.";
        }
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var nameValue = fieldConfig.name.input
        ? fieldConfig.name.input.value.trim()
        : "friend";

      if (successName) successName.textContent = nameValue;

      if (formStatus) {
        formStatus.textContent =
          "Demo message validated. No data has been sent to a server.";
      }

      contactForm.hidden = true;

      if (successPanel) {
        successPanel.hidden = false;
        successPanel.focus({ preventScroll: true });
        successPanel.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "center"
        });
      }
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        contactForm.reset();

        Object.keys(fieldConfig).forEach(function (key) {
          setFieldError(fieldConfig[key], "");
        });

        if (successPanel) successPanel.hidden = true;
        contactForm.hidden = false;

        if (formStatus) {
          formStatus.textContent = "Form cleared. You can write another note.";
        }

        if (fieldConfig.name.input) {
          fieldConfig.name.input.focus();
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     Smooth scrolling for same-page links, offset for the sticky header
     ------------------------------------------------------------------------ */
  doc.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');

    if (!link) return;

    var hash = link.getAttribute("href");

    if (!hash || hash === "#") return;

    var target = doc.querySelector(hash);

    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });

    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", hash);
    }

    // Keep keyboard focus in sync with the visual jump.
    if (target.getAttribute("tabindex") === null) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  });
})();
