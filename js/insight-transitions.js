/* =========================================================
   MAMBODLA — INSIGHT SHARED TRANSITIONS
   Featured Insight ↔ Article
========================================================= */

(() => {
  const SHARED_IMAGE_NAME = "insight-resilience-image";

  const INSIGHTS_NAV_NAME = "insights-navigation";

  const INSIGHTS_NAV_PRESERVE_KEY = "mambodla-insights-nav-preserve";

  const PORTAL_NAV_CLASS = "insight-portal-nav-visible";

  let portalDismissController = null;

  const mobileViewport = window.matchMedia("(max-width: 768px)");

  /* =====================================================
       URL HELPERS
    ====================================================== */

  const getURL = (value) => {
    if (!value) {
      return null;
    }

    return new URL(value, window.location.href);
  };

  const normalizePath = (url) => {
    if (!url) {
      return "";
    }

    let path = url.pathname.replace(/\/+$/, "");

    if (path.endsWith(".html")) {
      path = path.slice(0, -5);
    }

    return path || "/";
  };

  const isInsightsHub = (url) => {
    return normalizePath(url).endsWith("/insights");
  };

  const isResilienceArticle = (url) => {
    return normalizePath(url).endsWith(
      "/insights/building-a-resilient-business",
    );
  };

  const isInsightsFamily = (url) => {
    const path = normalizePath(url);

    return isInsightsHub(url) || path.includes("/insights/");
  };

  const isInsightsInternalNavigation = (fromURL, toURL) => {
    if (!fromURL || !toURL) {
      return false;
    }

    /*
        Internal Insights choreography applies only when:

        - both documents belong to Insights
        - both are on this website
        - the visitor is actually changing documents

        A same-page hash link such as
        "Read from beginning" is deliberately excluded.
    */

    return (
      fromURL.origin === window.location.origin &&
      toURL.origin === window.location.origin &&
      isInsightsFamily(fromURL) &&
      isInsightsFamily(toURL) &&
      normalizePath(fromURL) !== normalizePath(toURL)
    );
  };

  const isArticleToInsights = (fromURL, toURL) => {
    return (
      fromURL &&
      toURL &&
      !isInsightsHub(fromURL) &&
      isInsightsFamily(fromURL) &&
      isInsightsHub(toURL)
    );
  };

  const isInsightsNavigationVisible = () => {
    const navigation = document.querySelector(".header-inner");

    if (!navigation) {
      return false;
    }

    const rect = navigation.getBoundingClientRect();

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    /*
        Preserve only when the whole navigation
        is genuinely present in the viewport.

        A partly-scrolled-away header still benefits
        from the normal reveal choreography.
    */

    return rect.top >= -2 && rect.bottom <= viewportHeight + 2;
  };

  const isSharedBridgeNavigation = (fromURL, toURL) => {
    /*
        Shared imagery is now FORWARD only.

        Image portal:
        always shared.

        Read More:
        shared on wider screens,
        normal page travel on mobile.
    */

    if (!isInsightsHub(fromURL) || !isResilienceArticle(toURL)) {
      return false;
    }

    /*
        Clicking the actual bridge opens
        the image portal on every viewport.
    */

    if (toURL.hash === "#article-image") {
      return true;
    }

    /*
        Read More keeps its beautiful
        shared-image choreography on desktop,
        but uses the normal page slide on mobile.
    */

    return !mobileViewport.matches;
  };

  const isPortalEntry = (fromURL, toURL) => {
    return (
      isInsightsHub(fromURL) &&
      isResilienceArticle(toURL) &&
      toURL.hash === "#article-image"
    );
  };

  /* =====================================================
   INSIGHTS — INTERNAL NAVIGATION
===================================================== */

  const getInsightsNavigation = () => {
    return document.querySelector(".header-inner");
  };

  const activateInsightsNavigation = () => {
    const navigation = getInsightsNavigation();

    if (!navigation) {
      return null;
    }

    /*
        Temporarily override the normal
        site-navigation name.

        Inline style deliberately wins over
        the global CSS rule.
    */

    navigation.style.viewTransitionName = INSIGHTS_NAV_NAME;

    return navigation;
  };

  const clearInsightsNavigation = (navigation) => {
    if (!navigation) {
      return;
    }

    /*
        Restore normal website navigation behaviour
        after the internal Insights transition.
    */

    navigation.style.viewTransitionName = "";
  };

  /* =====================================================
       SHARED BRIDGE
    ====================================================== */

  const getBridgeImage = () => {
    return document.querySelector(".insight-shared-image-resilience");
  };

  const activateSharedImage = () => {
    const image = getBridgeImage();

    if (!image) {
      return null;
    }

    image.style.viewTransitionName = SHARED_IMAGE_NAME;

    return image;
  };

  const clearSharedImage = (image) => {
    if (!image) {
      return;
    }

    image.style.viewTransitionName = "";
  };

  /* =====================================================
       PORTAL NAV
    ====================================================== */

  const hidePortalNav = () => {
    document.body.classList.remove(PORTAL_NAV_CLASS);

    if (portalDismissController) {
      portalDismissController.abort();

      portalDismissController = null;
    }
  };

  const armPortalNavDismissal = () => {
    if (portalDismissController) {
      portalDismissController.abort();
    }

    const controller = new AbortController();

    portalDismissController = controller;

    const startScrollY = window.scrollY;

    const dismiss = () => {
      hidePortalNav();
    };

    /*
            Wheel / trackpad.
        */

    window.addEventListener("wheel", dismiss, {
      passive: true,
      signal: controller.signal,
    });

    /*
            Touch scrolling.
        */

    window.addEventListener("touchmove", dismiss, {
      passive: true,
      signal: controller.signal,
    });

    /*
            Keyboard scrolling.
        */

    window.addEventListener(
      "keydown",
      (event) => {
        const scrollKeys = [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ];

        if (scrollKeys.includes(event.key)) {
          dismiss();
        }
      },
      {
        signal: controller.signal,
      },
    );

    /*
            Scrollbar dragging / fallback.

            Ignore tiny layout corrections.
        */

    window.addEventListener(
      "scroll",
      () => {
        const distance = Math.abs(window.scrollY - startScrollY);

        if (distance < 8) {
          return;
        }

        dismiss();
      },
      {
        passive: true,
        signal: controller.signal,
      },
    );
  };

  const showPortalNav = () => {
    document.body.classList.add(PORTAL_NAV_CLASS);

    /*
            Wait until the finished transition
            has completely yielded its final frame.

            Then begin listening for USER scrolling.
        */

    requestAnimationFrame(() => {
      requestAnimationFrame(armPortalNavDismissal);
    });
  };

  /* =====================================================
       OUTGOING DOCUMENT
    ====================================================== */

  window.addEventListener("pageswap", (event) => {
    if (!event.viewTransition || !event.activation) {
      return;
    }

    const fromURL = getURL(event.activation.from?.url);

    const toURL = getURL(event.activation.entry?.url);

    const internalInsightsNavigation = isInsightsInternalNavigation(
      fromURL,
      toURL,
    );

    const preserveVisibleNavigation =
      isArticleToInsights(fromURL, toURL) && isInsightsNavigationVisible();

    if (preserveVisibleNavigation) {
      /*
        The visitor can already see the article navigation.

        Keep the normal site-navigation participant
        instead of making it disappear and re-enter.
    */

      sessionStorage.setItem(INSIGHTS_NAV_PRESERVE_KEY, "1");
    } else {
      sessionStorage.removeItem(INSIGHTS_NAV_PRESERVE_KEY);
    }

    if (internalInsightsNavigation && !preserveVisibleNavigation) {
      const navigation = activateInsightsNavigation();

      event.viewTransition.finished.finally(() => {
        clearInsightsNavigation(navigation);
      });
    }

    /*
                If the portal navbar is currently
                visible, remove it before leaving.

                It is contextual UI, not part of
                ordinary page travel.
            */

    hidePortalNav();

    if (!isSharedBridgeNavigation(fromURL, toURL)) {
      return;
    }

    const image = activateSharedImage();

    event.viewTransition.finished.finally(() => {
      clearSharedImage(image);
    });
  });

  /* =====================================================
   INCOMING DOCUMENT
===================================================== */

  window.addEventListener("pagereveal", (event) => {
    const fromURL = getURL(window.navigation?.activation?.from?.url);

    const toURL = getURL(window.location.href);

    const directPortalEntry =
      isResilienceArticle(toURL) && toURL.hash === "#article-image";

    /*
      HOSTED / NON-TRANSITION FALLBACK

      If the destination is the article-image portal
      but the browser does not expose a cross-document
      View Transition, still establish the correct
      image position and contextual navigation.
  */

    if (!event.viewTransition) {
      if (directPortalEntry) {
        const articleImage = document.querySelector("#article-image");

        if (articleImage) {
          articleImage.scrollIntoView({
            behavior: "instant",
            block: "start",
          });
        }

        showPortalNav();
      }

      return;
    }

    const internalInsightsNavigation = isInsightsInternalNavigation(
      fromURL,
      toURL,
    );

    const articleReturn = isArticleToInsights(fromURL, toURL);

    const preserveVisibleNavigation =
      articleReturn &&
      sessionStorage.getItem(INSIGHTS_NAV_PRESERVE_KEY) === "1";

    if (articleReturn) {
      /*
        Consume the one-navigation handoff immediately.

        Nothing remains behind for a later visit.
    */

      sessionStorage.removeItem(INSIGHTS_NAV_PRESERVE_KEY);
    }

    if (internalInsightsNavigation && !preserveVisibleNavigation) {
      const navigation = activateInsightsNavigation();

      event.viewTransition.finished.finally(() => {
        clearInsightsNavigation(navigation);
      });
    }

    if (!isSharedBridgeNavigation(fromURL, toURL)) {
      return;
    }

    const portalEntry = isPortalEntry(fromURL, toURL);

    /*
      IMAGE PORTAL

      Establish the final article-image
      scroll position immediately.

      The bridge transition itself supplies
      all visible movement.
  */

    if (portalEntry) {
      const articleImage = document.querySelector("#article-image");

      if (articleImage) {
        articleImage.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      }
    }

    const image = activateSharedImage();

    event.viewTransition.finished.finally(() => {
      clearSharedImage(image);

      /*
        Only AFTER the bridge is completely
        stationary do we show the contextual navbar.
    */

      if (portalEntry) {
        showPortalNav();
      }
    });
  });

  /* =====================================================
   DIRECT / RESTORED PORTAL FALLBACK
===================================================== */

  const restorePortalFromURL = () => {
    const currentURL = getURL(window.location.href);

    if (
      !isResilienceArticle(currentURL) ||
      currentURL.hash !== "#article-image"
    ) {
      return;
    }

    if (document.body.classList.contains(PORTAL_NAV_CLASS)) {
      return;
    }

    const articleImage = document.querySelector("#article-image");

    if (articleImage) {
      articleImage.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }

    showPortalNav();
  };

  window.addEventListener("pageshow", () => {
    window.setTimeout(restorePortalFromURL, 650);
  });
})();
