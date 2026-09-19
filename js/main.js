const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");

    menuToggle.classList.toggle("is-open", isOpen);

    menuToggle.setAttribute("aria-expanded", isOpen);

    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation",
    );

    document.body.classList.toggle("menu-open", isOpen);
  });
}

/* =========================================================
   MOBILE NAVIGATION — COUNTER MOTION PAGE TRAVEL
========================================================= */

if (menuToggle && mobileNav && mobileNavLinks.length) {
  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();

      const destination = link.href;

      /*
                    Navigate immediately.

                    Root page travels left.
                    Drawer snapshot travels right.
                */

      window.location.href = destination;
    });
  });
}

/* =========================================================
   SERVICES — DETAIL CARD FLIP
   ONE ACTIVE SERVICE AT A TIME
========================================================= */

(() => {
  const cards = [...document.querySelectorAll("[data-service-flip]")];

  if (!cards.length) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const cardStates = [];
  const focusTimers = new WeakMap();

  /* =====================================================
       BUILD CARD STATES
    ====================================================== */

  cards.forEach((card) => {
    const front = card.querySelector("[data-flip-front]");

    const back = card.querySelector("[data-flip-back]");

    const openButton = card.querySelector("[data-flip-open]");

    const closeButton = card.querySelector("[data-flip-close]");

    if (!front || !back || !openButton || !closeButton) {
      return;
    }

    /* Initial accessibility state */

    front.inert = false;
    back.inert = true;

    cardStates.push({
      card,
      front,
      back,
      openButton,
      closeButton,
    });
  });

  const animationDelay = () => (reduceMotion.matches ? 0 : 420);

  /* =====================================================
       SET FLIPPED STATE
    ====================================================== */

  const setFlipped = (state, flipped, moveFocus = true) => {
    const { card, front, back, openButton, closeButton } = state;

    /* Clear any previous pending focus movement */

    const existingTimer = focusTimers.get(card);

    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    card.classList.toggle("is-flipped", flipped);

    openButton.setAttribute("aria-expanded", String(flipped));

    front.setAttribute("aria-hidden", String(flipped));

    back.setAttribute("aria-hidden", String(!flipped));

    front.inert = flipped;
    back.inert = !flipped;

    if (!moveFocus) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (flipped) {
        closeButton.focus({
          preventScroll: true,
        });
      } else {
        openButton.focus({
          preventScroll: true,
        });
      }

      focusTimers.delete(card);
    }, animationDelay());

    focusTimers.set(card, timer);
  };

  /* =====================================================
       CLOSE ALL OTHER SERVICES
    ====================================================== */

  const closeOtherCards = (activeState) => {
    cardStates.forEach((state) => {
      if (
        state !== activeState &&
        state.card.classList.contains("is-flipped")
      ) {
        /*
         * Close silently.
         * Focus must remain with the
         * service the user just selected.
         */

        setFlipped(state, false, false);
      }
    });
  };

  /* =====================================================
       EVENTS
    ====================================================== */

  cardStates.forEach((state) => {
    const { card, openButton, closeButton } = state;

    /* OPEN */

    openButton.addEventListener("click", () => {
      /*
       * First close any currently
       * active service.
       */

      closeOtherCards(state);

      /*
       * Then activate the selected
       * service.
       */

      setFlipped(state, true);
    });

    /* CLOSE */

    closeButton.addEventListener("click", () => {
      setFlipped(state, false);
    });

    /* ESCAPE closes active service */

    card.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && card.classList.contains("is-flipped")) {
        setFlipped(state, false);
      }
    });
  });

  /* =====================================================
   CLICK AWAY — CLOSE ACTIVE SERVICE
===================================================== */

  document.addEventListener("click", (event) => {
    /*
     * If the click happened inside
     * any service flip card,
     * let that card handle it.
     */

    const clickedInsideCard = event.target.closest("[data-service-flip]");

    if (clickedInsideCard) {
      return;
    }

    /*
     * Otherwise close whichever
     * service is currently active.
     *
     * No focus movement:
     * the user's click should remain
     * wherever they placed it.
     */

    cardStates.forEach((state) => {
      if (state.card.classList.contains("is-flipped")) {
        setFlipped(state, false, false);
      }
    });
  });
})();

/* =========================================================
   MAMBODLA — VIEWPORT-AWARE SCROLL REVEAL
   EASE → REVEAL → SETTLE
========================================================= */

(() => {
  const revealItems = [...document.querySelectorAll("[data-reveal]")];

  if (!revealItems.length) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* =====================================================
       REDUCED MOTION
    ====================================================== */

  if (reduceMotion.matches) {
    revealItems.forEach((item) => {
      item.classList.add("is-visible");
    });

    return;
  }

  /* =====================================================
       STAGGER DELAYS
    ====================================================== */

  revealItems.forEach((item) => {
    const delayStep = Number(item.dataset.revealDelay || 0);

    const delay = Math.min(delayStep, 6) * 70;

    item.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  /* =====================================================
       INITIAL VIEWPORT CLASSIFICATION
    ====================================================== */

  const initialiseReveals = () => {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    const pendingItems = [];

    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();

      /*
                Anything whose TOP already sits inside
                or above the initial viewport is considered
                part of the page-arrival composition.

                It must therefore be completely visible
                while the page is sliding in.
            */

      const alreadyReached = rect.top < viewportHeight;

      if (alreadyReached) {
        item.classList.add("is-visible");

        return;
      }

      /*
                Everything genuinely below the initial
                viewport becomes eligible for scroll reveal.
            */

      item.classList.add("reveal-pending");

      pendingItems.push(item);
    });

    /* =================================================
           FALLBACK
        ================================================== */

    if (!("IntersectionObserver" in window)) {
      pendingItems.forEach((item) => {
        item.classList.add("is-visible");
      });

      return;
    }

    /* =================================================
           SCROLL OBSERVER
        ================================================== */

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");

          /*
                            Reveal once.

                            Once information has arrived,
                            it remains calmly present.
                        */

          observer.unobserve(entry.target);
        });
      },

      {
        root: null,

        rootMargin: "0px 0px -8% 0px",

        threshold: 0.12,
      },
    );

    pendingItems.forEach((item) => {
      observer.observe(item);
    });
  };

  /*
        Allow the browser one rendering frame to resolve
        the current responsive layout before measuring
        the real viewport positions.
    */

  requestAnimationFrame(initialiseReveals);
})();

/* =========================================================
   MAMBODLA — BACK TO TOP UTILITY
   EASE → REVEAL → SETTLE
========================================================= */

(() => {
  /*
        The utility belongs only to pages where
        returning to the main navigation requires
        meaningful upward travel.

        Home:
        excluded — single viewport.

        Articles:
        excluded — preserve the editorial journey.
    */

  const enabledPages = new Set([
    "about.html",
    "services.html",
    "insights.html",
    "contact.html",
  ]);

  const pageName = window.location.pathname.split("/").pop() || "index.html";

  if (!enabledPages.has(pageName)) {
    return;
  }

  const SCROLL_THRESHOLD = 400;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* =====================================================
       BUILD UTILITY
    ====================================================== */

  const button = document.createElement("button");

  button.type = "button";

  button.className = "back-to-top";

  button.setAttribute("aria-label", "Back to top");

  /*
        Hidden utilities must not remain
        in the keyboard tab order.
    */

  button.tabIndex = -1;

  const label = document.createElement("span");

  label.className = "back-to-top-label";

  label.setAttribute("aria-hidden", "true");

  label.textContent = "Back to top";

  const arrow = document.createElement("span");

  arrow.className = "back-to-top-arrow";

  arrow.setAttribute("aria-hidden", "true");

  arrow.textContent = "↑";

  button.append(label, arrow);

  document.body.append(button);

  /* =====================================================
       VISIBILITY
    ====================================================== */

  let frameRequested = false;

  const syncVisibility = () => {
    frameRequested = false;

    const drawerOpen = document.body.classList.contains("menu-open");

    const farEnoughDown = window.scrollY >= SCROLL_THRESHOLD;

    const shouldShow = farEnoughDown && !drawerOpen;

    button.classList.toggle("is-visible", shouldShow);

    button.tabIndex = shouldShow ? 0 : -1;
  };

  /*
        Scroll events can fire many times per frame.

        One visual update per animation frame
        is more than enough.
    */

  const requestVisibilitySync = () => {
    if (frameRequested) {
      return;
    }

    frameRequested = true;

    requestAnimationFrame(syncVisibility);
  };

  window.addEventListener("scroll", requestVisibilitySync, {
    passive: true,
  });

  /* =====================================================
       MOBILE DRAWER STATE
    ====================================================== */

  /*
        main.js already places "menu-open"
        on BODY when the drawer opens.

        Observe that existing state instead of
        modifying the drawer architecture.
    */

  const bodyObserver = new MutationObserver(requestVisibilitySync);

  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  /* =====================================================
       RETURN TO TOP
    ====================================================== */

  button.addEventListener("click", () => {
    /*
                Respect reduced-motion preference.

                The normal experience keeps the
                approved smooth return journey.
            */

    if (reduceMotion.matches) {
      window.scrollTo(0, 0);

      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });

  /* =====================================================
       HISTORY / RESTORED SCROLL POSITION
    ====================================================== */

  window.addEventListener("pageshow", requestVisibilitySync);

  /*
        Establish the correct state immediately.

        Usually hidden because a newly entered
        page begins near the top.
    */

  requestAnimationFrame(syncVisibility);
})();

/* =========================================================
   INSIGHTS — CATEGORY FILTER
   FILTER → EDITORIAL CONTEXT → STAGGERED RESET
========================================================= */

(() => {
  const categoryCards = [...document.querySelectorAll("[data-insight-filter]")];

  const insightCards = [
    ...document.querySelectorAll("[data-insight-category]"),
  ];

  const insightDetails = [
    ...document.querySelectorAll("[data-insight-detail]"),
  ];

  const latestInsights = document.querySelector("#latest-insights");

  const insightsGrid = document.querySelector("[data-insights-grid]");

  const activeFilter = document.querySelector("[data-insights-active-filter]");

  const activeFilterName = document.querySelector(
    "[data-insights-active-filter-name]",
  );

  const viewAll = document.querySelector("[data-insights-view-all]");

  const emptyState = document.querySelector("[data-insights-empty]");

  /* -----------------------------------------------------
     Run only on the Insights hub
  ----------------------------------------------------- */

  if (
    !categoryCards.length ||
    !insightCards.length ||
    !latestInsights ||
    !insightsGrid
  ) {
    return;
  }

  /* -----------------------------------------------------
     Category labels
  ----------------------------------------------------- */

  const categoryNames = {
    "tax-updates": "Tax Updates",

    "financial-tips": "Financial Tips",

    "business-advice": "Business Advice",

    "mambodla-perspectives": "Mambodla Perspectives",

    "community-voice": "Community Voice",
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let activeCategory = null;

  let actionToken = 0;

  /* =====================================================
     MOTION TIMING
     Scroll reveal uses a 70ms stagger.
     Reset deliberately matches that rhythm.
  ====================================================== */

  const CARD_EXIT_DURATION = reduceMotion.matches ? 0 : 220;

  const CARD_EXIT_STEP = reduceMotion.matches ? 0 : 35;

  const DETAIL_EXIT_DURATION = reduceMotion.matches ? 0 : 240;

  const CARD_RETURN_DURATION = reduceMotion.matches ? 0 : 560;

  const CARD_RETURN_STEP = reduceMotion.matches ? 0 : 70;

  /* =====================================================
     HELPERS
  ====================================================== */

  const clearCardMotion = () => {
    insightCards.forEach((card) => {
      card.classList.remove(
        "is-filtering-out",
        "is-filter-entering",
        "is-filter-returning",
      );

      card.style.removeProperty("--filter-exit-delay");

      card.style.removeProperty("--filter-return-delay");
    });
  };

  /* =====================================================
     TRAVEL TO RESULTS
  ====================================================== */

  const scrollToResults = () => {
    latestInsights.scrollIntoView({
      behavior: reduceMotion.matches ? "auto" : "smooth",

      block: "start",
    });
  };

  /* =====================================================
     ACTIVE CATEGORY CARD
  ====================================================== */

  const setActiveCategory = (category) => {
    categoryCards.forEach((card) => {
      const isActive =
        category !== null && card.dataset.insightFilter === category;

      card.classList.toggle("is-active", isActive);

      const link = card.querySelector(".insight-category-link");

      if (!link) {
        return;
      }

      link.setAttribute("aria-pressed", String(isActive));

      const label = link.querySelector("span:first-child");

      if (label) {
        label.textContent = isActive ? "Selected" : "Explore";
      }
    });
  };

  /* =====================================================
     FILTER LABEL
  ====================================================== */

  const showFilterContext = (category) => {
    if (!activeFilter || !activeFilterName) {
      return;
    }

    activeFilterName.textContent = categoryNames[category] || "Insights";

    activeFilter.hidden = false;

    requestAnimationFrame(() => {
      activeFilter.classList.add("is-visible");
    });
  };

  const beginHideFilterContext = () => {
    if (!activeFilter) {
      return;
    }

    activeFilter.classList.remove("is-visible");
  };

  const finishHideFilterContext = () => {
    if (activeFilter) {
      activeFilter.hidden = true;
    }

    if (activeFilterName) {
      activeFilterName.textContent = "";
    }
  };

  /* =====================================================
     EDITORIAL DESCRIPTION
  ====================================================== */

  const beginHideEditorialContent = () => {
    insightDetails.forEach((detail) => {
      detail.classList.remove("is-visible");
    });

    if (emptyState) {
      emptyState.classList.remove("is-visible");
    }
  };

  const hideEditorialContentImmediately = () => {
    insightDetails.forEach((detail) => {
      detail.classList.remove("is-visible");

      detail.hidden = true;
    });

    if (emptyState) {
      emptyState.classList.remove("is-visible");

      emptyState.hidden = true;
    }
  };

  const showEditorialDetail = (category) => {
    const matchingDetail = insightDetails.find(
      (detail) => detail.dataset.insightDetail === category,
    );

    if (!matchingDetail) {
      return;
    }

    matchingDetail.hidden = false;

    requestAnimationFrame(() => {
      matchingDetail.classList.add("is-visible");
    });
  };

  /* =====================================================
     EMPTY CATEGORY
  ====================================================== */

  const showEmptyState = (category) => {
    if (!emptyState) {
      return;
    }

    const eyebrow = emptyState.querySelector(".latest-insights-empty-eyebrow");

    if (eyebrow) {
      eyebrow.textContent = categoryNames[category] || "Insights";
    }

    emptyState.hidden = false;

    requestAnimationFrame(() => {
      emptyState.classList.add("is-visible");
    });
  };

  /* =====================================================
     FILTER CATEGORY
  ====================================================== */

  const filterInsights = (category) => {
    /*
      Selecting the already-active category should
      simply return the visitor to the filtered results.
    */

    if (activeCategory === category) {
      scrollToResults();

      return;
    }

    const token = ++actionToken;

    activeCategory = category;

    clearCardMotion();

    beginHideEditorialContent();

    setActiveCategory(category);

    showFilterContext(category);

    /*
      Start travelling immediately.

      The cards then perform their exit choreography
      while the visitor travels toward Latest Insights.
    */

    scrollToResults();

    /* ---------------------------------------------------
       Fade existing cards away
    --------------------------------------------------- */

    const currentlyVisibleCards = insightCards.filter((card) => !card.hidden);

    currentlyVisibleCards.forEach((card, index) => {
      card.style.setProperty(
        "--filter-exit-delay",
        `${index * CARD_EXIT_STEP}ms`,
      );

      card.classList.add("is-filtering-out");
    });

    const exitWait =
      CARD_EXIT_DURATION +
      Math.max(currentlyVisibleCards.length - 1, 0) * CARD_EXIT_STEP;

    window.setTimeout(() => {
      if (token !== actionToken) {
        return;
      }

      hideEditorialContentImmediately();

      clearCardMotion();

      let visibleCount = 0;

      let matchingCard = null;

      /* -------------------------------------------------
         Apply actual filter
      ------------------------------------------------- */

      insightCards.forEach((card) => {
        const matches = card.dataset.insightCategory === category;

        card.hidden = !matches;

        if (matches) {
          visibleCount += 1;

          if (!matchingCard) {
            matchingCard = card;
          }
        }
      });

      /*
        The editorial side-copy treatment belongs
        specifically to a single visible article.

        If a category later grows to multiple articles,
        the system automatically returns to a normal
        multi-card grid instead of breaking the layout.
      */

      insightsGrid.classList.toggle("is-single-result", visibleCount === 1);

      /* -------------------------------------------------
         One matching article
      ------------------------------------------------- */

      if (visibleCount === 1 && matchingCard) {
        matchingCard.classList.add("is-filter-entering");

        showEditorialDetail(category);

        window.setTimeout(() => {
          matchingCard.classList.remove("is-filter-entering");
        }, CARD_RETURN_DURATION);

        return;
      }

      /* -------------------------------------------------
         No articles yet
      ------------------------------------------------- */

      if (visibleCount === 0) {
        showEmptyState(category);
      }
    }, exitWait);
  };

  /* =====================================================
     VIEW ALL / RESET
  ====================================================== */

  const showAllInsights = () => {
    if (!activeCategory) {
      return;
    }

    const token = ++actionToken;

    activeCategory = null;

    clearCardMotion();

    /*
      First:
      editorial description and filter context leave.
    */

    beginHideEditorialContent();

    beginHideFilterContext();

    /*
      At the same time the navy active category
      smoothly returns to its normal card state.
    */

    setActiveCategory(null);

    window.setTimeout(() => {
      if (token !== actionToken) {
        return;
      }

      hideEditorialContentImmediately();

      finishHideFilterContext();

      insightsGrid.classList.remove("is-single-result");

      /*
        Restore every article before the stagger begins.
      */

      insightCards.forEach((card) => {
        card.hidden = false;
      });

      /*
        Same 70ms stagger rhythm used by the site's
        viewport-aware scroll reveal system.
      */

      insightCards.forEach((card, index) => {
        card.style.setProperty(
          "--filter-return-delay",
          `${index * CARD_RETURN_STEP}ms`,
        );

        card.classList.add("is-filter-returning");
      });

      const returnWait =
        CARD_RETURN_DURATION +
        Math.max(insightCards.length - 1, 0) * CARD_RETURN_STEP;

      window.setTimeout(() => {
        if (token !== actionToken) {
          return;
        }

        clearCardMotion();
      }, returnWait + 60);
    }, DETAIL_EXIT_DURATION);
  };

  /* =====================================================
     CATEGORY CONTROLS
  ====================================================== */

  categoryCards.forEach((card) => {
    const link = card.querySelector(".insight-category-link");

    if (!link) {
      return;
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();

      const category = card.dataset.insightFilter;

      if (!category) {
        return;
      }

      filterInsights(category);
    });
  });

  /* =====================================================
     VIEW ALL CONTROL
  ====================================================== */

  if (viewAll) {
    viewAll.addEventListener("click", (event) => {
      event.preventDefault();

      showAllInsights();
    });
  }

  /* =====================================================
     LOCKED INTERACTION RULE

     There is deliberately NO body/document click listener.

     Empty canvas does nothing.

     The filter changes only when:
     - another category is selected, or
     - View all insights is selected.
  ====================================================== */
})();

/* =========================================================
   CONTACT — ADAPTIVE ENQUIRY + VALIDATION
   One form. Different conversations.
========================================================= */

(() => {
  const form = document.querySelector("[data-contact-form]");

  if (!form) {
    return;
  }

  const serviceSelect = document.querySelector("#contact-service");

  const formHeading = document.querySelector("[data-contact-form-heading]");

  const formTitle = document.querySelector("[data-contact-form-title]");

  const formContext = document.querySelector("[data-contact-form-context]");

  const subjectLabel = document.querySelector("[data-contact-subject-label]");

  const messageLabel = document.querySelector("[data-contact-message-label]");

  const submitLabel = document.querySelector("[data-contact-submit-label]");

  const formStatus = document.querySelector("[data-contact-form-status]");

  const fields = [...form.querySelectorAll("[data-contact-field]")];

  const controls = {
    name: document.querySelector("#contact-name"),

    email: document.querySelector("#contact-email"),

    phone: document.querySelector("#contact-phone"),

    service: serviceSelect,

    subject: document.querySelector("#contact-subject"),

    message: document.querySelector("#contact-message"),
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let activeIntent = "";

  /* =====================================================
     ADAPTIVE FORM COPY
  ====================================================== */

  const intents = {
    "": {
      title: "Send us a message",
      context:
        "Tell us what you need and we’ll point you in the right direction.",
      subject: "Subject",
      message: "Message",
      submit: "Let’s Talk",
      subjectError: "Please enter a subject.",
      messageError: "Please enter your message.",
    },

    accounting: {
      title: "Let’s talk accounting",
      context:
        "Tell us where you need clarity, support or stronger financial reporting.",
      subject: "Accounting enquiry",
      message: "Tell us about your accounting needs",
      submit: "Send enquiry",
      subjectError: "Please tell us what your accounting enquiry is about.",
      messageError: "Please tell us a little about your accounting needs.",
    },

    tax: {
      title: "Let’s talk tax",
      context:
        "Tell us about the tax matter, deadline or compliance issue you need help with.",
      subject: "Tax enquiry",
      message: "Tell us about your tax matter",
      submit: "Send enquiry",
      subjectError: "Please tell us what your tax enquiry is about.",
      messageError: "Please tell us a little about your tax matter.",
    },

    payroll: {
      title: "Let’s talk payroll",
      context:
        "Tell us where you need payroll support, compliance assistance or greater peace of mind.",
      subject: "Payroll enquiry",
      message: "Tell us about your payroll needs",
      submit: "Send enquiry",
      subjectError: "Please tell us what your payroll enquiry is about.",
      messageError: "Please tell us a little about your payroll needs.",
    },

    advisory: {
      title: "Let’s talk business",
      context:
        "Tell us about the decision, challenge or opportunity you would like to explore with us.",
      subject: "Business advisory enquiry",
      message: "Tell us about your business",
      submit: "Start the conversation",
      subjectError: "Please tell us what you would like to discuss.",
      messageError: "Please tell us a little about your business or situation.",
    },

    "insight-contribution": {
      title: "Share your insight with us",
      context:
        "Give us your article topic and a short outline. We’ll review the idea and get back to you.",
      subject: "Article title / topic",
      message: "Short article summary",
      submit: "Submit your idea",
      subjectError: "Please enter your article title or topic.",
      messageError: "Please give us a short summary of your article idea.",
    },

    other: {
      title: "Tell us what you need",
      context:
        "Not sure which service fits? Tell us what you’re working through and we’ll guide you.",
      subject: "Subject",
      message: "Message",
      submit: "Send enquiry",
      subjectError: "Please tell us what your enquiry is about.",
      messageError:
        "Please give us a little more information about your enquiry.",
    },
  };

  /* =====================================================
     APPLY FORM INTENT
  ====================================================== */

  const applyIntent = (intent, animate = true) => {
    const safeIntent = Object.hasOwn(intents, intent) ? intent : "";

    const copy = intents[safeIntent];

    activeIntent = safeIntent;

    const updateCopy = () => {
      if (formTitle) {
        formTitle.textContent = copy.title;
      }

      if (formContext) {
        formContext.textContent = copy.context;
      }

      if (subjectLabel) {
        subjectLabel.textContent = copy.subject;
      }

      if (messageLabel) {
        messageLabel.textContent = copy.message;
      }

      if (submitLabel) {
        submitLabel.textContent = copy.submit;
      }
    };

    if (!animate || reduceMotion.matches || !formHeading) {
      updateCopy();

      return;
    }

    formHeading.classList.add("is-switching");

    window.setTimeout(() => {
      updateCopy();

      requestAnimationFrame(() => {
        formHeading.classList.remove("is-switching");
      });
    }, 120);
  };

  /* =====================================================
     URL INTENT
  ====================================================== */

  const params = new URLSearchParams(window.location.search);

  const requestedIntent = params.get("enquiry") || "";

  if (serviceSelect && requestedIntent) {
    const validOption = [...serviceSelect.options].some(
      (option) => option.value === requestedIntent,
    );

    if (validOption) {
      serviceSelect.value = requestedIntent;

      applyIntent(requestedIntent, false);
    } else {
      applyIntent("", false);
    }
  } else {
    applyIntent(serviceSelect?.value || "", false);
  }

  /* =====================================================
     MANUAL ENQUIRY CHANGE
  ====================================================== */

  if (serviceSelect) {
    serviceSelect.addEventListener("change", () => {
      applyIntent(serviceSelect.value, true);

      validateField("service");
    });
  }

  /* =====================================================
     ERROR HELPERS
  ====================================================== */

  const getField = (fieldName) =>
    form.querySelector(`[data-contact-field="${fieldName}"]`);

  const getError = (fieldName) =>
    getField(fieldName)?.querySelector("[data-contact-error]");

  const clearError = (fieldName) => {
    const field = getField(fieldName);

    const control = controls[fieldName];

    const error = getError(fieldName);

    if (!field || !control) {
      return;
    }

    field.classList.remove("is-invalid");

    control.removeAttribute("aria-invalid");

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  };

  const setError = (fieldName, message) => {
    const field = getField(fieldName);

    const control = controls[fieldName];

    const error = getError(fieldName);

    if (!field || !control) {
      return false;
    }

    field.classList.add("is-invalid");

    control.setAttribute("aria-invalid", "true");

    if (error) {
      error.textContent = message;

      error.hidden = false;
    }

    return false;
  };

  /* =====================================================
     NORMALISATION HELPERS
  ====================================================== */

  const compactPhone = (value) => value.trim().replace(/[\s().-]/g, "");

  const isValidSouthAfricanPhone = (value) => {
    const phone = compactPhone(value);

    return /^0\d{9}$/.test(phone) || /^\+27\d{9}$/.test(phone);
  };

  /* =====================================================
     FIELD VALIDATION
  ====================================================== */

  const validateField = (fieldName) => {
    const control = controls[fieldName];

    if (!control) {
      return true;
    }

    const value = control.value.trim();

    clearError(fieldName);

    /* -------------------------------------------------
   NAME
------------------------------------------------- */

    if (fieldName === "name") {
      if (!value) {
        return setError(fieldName, "Please enter your full name.");
      }

      const validCharacters = /^[\p{L}\p{M}.'’\-\s]+$/u.test(value);

      const nameParts = value.trim().split(/\s+/).filter(Boolean);

      const hasEnoughLetters = nameParts.every((part) => {
        const letters = part.match(/\p{L}/gu) || [];

        return letters.length >= 2;
      });

      if (!validCharacters || nameParts.length < 2 || !hasEnoughLetters) {
        return setError(fieldName, "Please enter your full name.");
      }

      return true;
    }

    /* -------------------------------------------------
   EMAIL
------------------------------------------------- */

    if (fieldName === "email") {
      if (!value) {
        return setError(fieldName, "Please enter your email address.");
      }

      const validEmail =
        /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$/.test(
          value,
        ) && !value.includes("..");

      if (!validEmail) {
        return setError(fieldName, "Please enter a valid email address.");
      }

      return true;
    }

    /* -------------------------------------------------
       PHONE
    ------------------------------------------------- */

    if (fieldName === "phone") {
      if (!value) {
        return setError(fieldName, "Please enter your phone number.");
      }

      if (!isValidSouthAfricanPhone(value)) {
        return setError(
          fieldName,
          "Use a valid South African number, for example 082 123 4567 or +27 82 123 4567.",
        );
      }

      return true;
    }

    /* -------------------------------------------------
       SERVICE / ENQUIRY
    ------------------------------------------------- */

    if (fieldName === "service") {
      if (!value) {
        return setError(fieldName, "Please select how we can help you.");
      }

      return true;
    }

    /* -------------------------------------------------
       SUBJECT
    ------------------------------------------------- */

    if (fieldName === "subject") {
      if (!value) {
        return setError(
          fieldName,
          intents[activeIntent]?.subjectError || intents[""].subjectError,
        );
      }

      if (value.length < 3) {
        return setError(fieldName, "Please add a little more detail.");
      }

      return true;
    }

    /* -------------------------------------------------
       MESSAGE
    ------------------------------------------------- */

    if (fieldName === "message") {
      if (!value) {
        return setError(
          fieldName,
          intents[activeIntent]?.messageError || intents[""].messageError,
        );
      }

      if (value.length < 10) {
        return setError(
          fieldName,
          "Please add a little more information so we can understand your enquiry.",
        );
      }

      return true;
    }

    return true;
  };

  /* =====================================================
     VALIDATE WHILE USING THE FORM
  ====================================================== */

  Object.entries(controls).forEach(([fieldName, control]) => {
    if (!control) {
      return;
    }

    control.addEventListener("blur", () => {
      validateField(fieldName);
    });

    control.addEventListener("input", () => {
      const field = getField(fieldName);

      if (field?.classList.contains("is-invalid")) {
        validateField(fieldName);
      }

      if (formStatus && formStatus.classList.contains("is-visible")) {
        formStatus.classList.remove("is-visible");
        formStatus.textContent = "";
      }
    });
  });

  /* =====================================================
     FULL FORM VALIDATION
  ====================================================== */

  const validateForm = () => {
    const fieldOrder = [
      "name",
      "email",
      "phone",
      "service",
      "subject",
      "message",
    ];

    let firstInvalidField = null;

    fieldOrder.forEach((fieldName) => {
      const valid = validateField(fieldName);

      if (!valid && !firstInvalidField) {
        firstInvalidField = controls[fieldName];
      }
    });

    return {
      valid: !firstInvalidField,

      firstInvalidField,
    };
  };

  /* =====================================================
     SUBMIT
  ====================================================== */

  form.addEventListener("submit", (event) => {
    const result = validateForm();

    if (!result.valid) {
      event.preventDefault();

      const invalidField = result.firstInvalidField;

      if (invalidField) {
        invalidField.focus({
          preventScroll: true,
        });

        invalidField.closest(".contact-field")?.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",

          block: "center",
        });
      }

      return;
    }

    /*
        The form UX and validation are now complete,
        but no delivery service/backend has been
        connected yet.

        Prevent a fake submission while action="#".
      */

    const action = form.getAttribute("action");

    if (!action || action === "#") {
      event.preventDefault();

      if (formStatus) {
        formStatus.textContent =
          "Everything looks good. Online message delivery still needs to be connected before this form can send enquiries.";

        requestAnimationFrame(() => {
          formStatus.classList.add("is-visible");
        });
      }
    }
  });
})();

/* =========================================================
   HOME — ARRIVAL CHOREOGRAPHY
   Fresh introduction / internal return
========================================================= */

(() => {
  const body = document.querySelector(".home-page-body");

  if (!body) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const finishImmediately = () => {
    body.classList.add("home-intro-complete", "home-return-complete");
  };

  /* =====================================================
     HOME RELOAD
     Fresh Home owns the arrival.
     Do not run the normal root page slide.
  ====================================================== */

  window.addEventListener("pageswap", (event) => {
    if (event.activation?.navigationType !== "reload") {
      return;
    }

    event.viewTransition?.skipTransition();
  });

  if (reduceMotion.matches) {
    finishImmediately();

    return;
  }

  /* =====================================================
     HELPERS
  ====================================================== */

  const getActivation = () => window.navigation?.activation;

  const isReload = () => {
    const activation = getActivation();

    if (activation?.navigationType === "reload") {
      return true;
    }

    const navigationEntry = performance.getEntriesByType("navigation")[0];

    return navigationEntry?.type === "reload";
  };

  const isDifferentInternalPage = (fromURL) => {
    if (!fromURL) {
      return false;
    }

    try {
      const previous = new URL(fromURL);

      const current = new URL(window.location.href);

      return (
        previous.origin === current.origin &&
        previous.pathname !== current.pathname
      );
    } catch {
      return false;
    }
  };

  /* =====================================================
     INTERNAL RETURN
  ====================================================== */

  const finishReturn = () => {
    requestAnimationFrame(() => {
      body.classList.add("home-return-complete");
    });
  };

  window.addEventListener("pagereveal", (event) => {
    const transition = event.viewTransition;

    const activation = getActivation();

    const fromURL = activation?.from?.url;

    /* -----------------------------------------------
         RELOAD
         Never reinterpret a reload as "return Home".
      ------------------------------------------------ */

    if (isReload()) {
      document.documentElement.dataset.homeArrival = "fresh";

      /*
          Extra defensive skip on the incoming side.

          The outgoing Home document already requests
          the reload transition to be skipped.
        */

      transition?.skipTransition();

      return;
    }

    /* -----------------------------------------------
         GENUINE INTERNAL RETURN
      ------------------------------------------------ */

    if (transition && isDifferentInternalPage(fromURL)) {
      document.documentElement.dataset.homeArrival = "return";

      body.classList.add("home-intro-complete");

      transition.finished.finally(finishReturn);

      return;
    }

    if (document.documentElement.dataset.homeArrival === "return") {
      finishReturn();
    }
  });

  /* =====================================================
     FRESH ARRIVAL
  ====================================================== */

  if (document.documentElement.dataset.homeArrival !== "fresh") {
    return;
  }

  /*
    Two frames guarantee that the browser paints
    the deliberately hidden starting composition
    before the introduction begins.
  */

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      body.classList.add("home-intro-started");
    });
  });

  /*
    Once every element has settled, release all
    temporary animation ownership so normal Home
    interactions take over again.
  */

  window.setTimeout(() => {
    body.classList.add("home-intro-complete");

    body.classList.remove("home-intro-started");
  }, 2050);
})();
