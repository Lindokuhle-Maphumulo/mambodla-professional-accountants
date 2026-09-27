/* =========================================================
   MAMBODLA PROFESSIONAL ACCOUNTANTS
   PRE-LAUNCH ACCESSIBILITY + NAVIGATION HARDENING
========================================================= */

(() => {
  "use strict";

  /* =====================================================
     SKIP LINK
  ===================================================== */

  const main = document.querySelector("main");

  if (main && !document.querySelector(".skip-link")) {
    if (!main.id) {
      main.id = "main-content";
    }

    const skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = `#${main.id}`;
    skipLink.textContent = "Skip to main content";
    document.body.prepend(skipLink);
  }

  /* =====================================================
     MOBILE DRAWER ACCESSIBILITY
  ===================================================== */

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  if (!menuToggle || !mobileNav) {
    return;
  }

  const desktopQuery = window.matchMedia("(min-width: 769px)");

  const setDrawerAccessibility = () => {
    const isOpen =
      !desktopQuery.matches && mobileNav.classList.contains("is-open");

    mobileNav.inert = !isOpen;
    mobileNav.setAttribute("aria-hidden", String(!isOpen));
  };

  const closeDrawer = ({ returnFocus = false } = {}) => {
    if (mobileNav.classList.contains("is-open")) {
      mobileNav.classList.remove("is-open");
    }

    if (menuToggle.classList.contains("is-open")) {
      menuToggle.classList.remove("is-open");
    }

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");

    if (document.body.classList.contains("menu-open")) {
      document.body.classList.remove("menu-open");
    }

    setDrawerAccessibility();

    if (returnFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  };

  const drawerObserver = new MutationObserver(() => {
    setDrawerAccessibility();
  });

  drawerObserver.observe(mobileNav, {
    attributes: true,
    attributeFilter: ["class"],
  });

  menuToggle.addEventListener("click", () => {
    requestAnimationFrame(setDrawerAccessibility);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !mobileNav.classList.contains("is-open")) {
      return;
    }

    event.preventDefault();
    closeDrawer({ returnFocus: true });
  });

  const handleBreakpointChange = () => {
    if (desktopQuery.matches) {
      closeDrawer();
      return;
    }

    setDrawerAccessibility();
  };

  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", handleBreakpointChange);
  } else {
    desktopQuery.addListener(handleBreakpointChange);
  }

  if (desktopQuery.matches && mobileNav.classList.contains("is-open")) {
    closeDrawer();
  } else {
    setDrawerAccessibility();
  }
})();
