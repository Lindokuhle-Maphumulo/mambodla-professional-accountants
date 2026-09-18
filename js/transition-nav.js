/* =========================================================
   MAMBODLA — NAVIGATION HANDOFF
   Keeps one stationary navigation state during page travel
========================================================= */

(() => {
  const getPageName = (urlValue) => {
    const url = new URL(urlValue, window.location.href);

    /*
        Every individual article inside /insights/
        belongs to the main Insights navigation section.
    */

    if (url.pathname.includes("/insights/")) {
      return "insights.html";
    }

    const fileName = url.pathname.split("/").pop();

    return fileName || "index.html";
  };

  const clearHandoff = () => {
    document.documentElement.classList.remove("nav-handoff");

    document.querySelectorAll(".nav-transition-active").forEach((link) => {
      link.classList.remove("nav-transition-active");
    });
  };

  /* =====================================================
       ACTIVE LINK HANDOFF
    ====================================================== */

  window.addEventListener("pagereveal", (event) => {
    const transition = event.viewTransition;

    const fromURL = window.navigation?.activation?.from?.url;

    if (!transition || !fromURL) {
      return;
    }

    const fromPage = getPageName(fromURL);

    const currentPage = getPageName(window.location.href);

    if (fromPage === currentPage) {
      return;
    }

    /*
                Keep the outgoing page visually active
                while the new page slides into place.
            */

    document.documentElement.classList.add("nav-handoff");

    document.querySelectorAll(".nav-link, .mobile-nav-link").forEach((link) => {
      const linkPage = getPageName(link.href);

      link.classList.toggle("nav-transition-active", linkPage === fromPage);
    });

    /*
                Once the transition finishes,
                restore the destination's normal
                active navigation state.
            */

    transition.finished.finally(clearHandoff);
  });
})();
