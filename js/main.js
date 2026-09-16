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

        menuToggle.setAttribute(
            "aria-expanded",
            isOpen
        );

        menuToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation"
                : "Open navigation"
        );

        document.body.classList.toggle(
            "menu-open",
            isOpen
        );
    });
}


/* =========================================================
   MOBILE NAVIGATION — COUNTER MOTION PAGE TRAVEL
========================================================= */

if (
    menuToggle &&
    mobileNav &&
    mobileNavLinks.length
) {

    mobileNavLinks.forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                ) {
                    return;
                }


                event.preventDefault();


                const destination =
                    link.href;


                /*
                    Navigate immediately.

                    Root page travels left.
                    Drawer snapshot travels right.
                */

                window.location.href =
                    destination;

            }
        );

    });

}

/* =========================================================
   SERVICES — DETAIL CARD FLIP
   ONE ACTIVE SERVICE AT A TIME
========================================================= */

(() => {

    const cards =
        [...document.querySelectorAll("[data-service-flip]")];

    if (!cards.length) {
        return;
    }


    const reduceMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    const cardStates = [];
    const focusTimers = new WeakMap();


    /* =====================================================
       BUILD CARD STATES
    ====================================================== */

    cards.forEach((card) => {

        const front =
            card.querySelector("[data-flip-front]");

        const back =
            card.querySelector("[data-flip-back]");

        const openButton =
            card.querySelector("[data-flip-open]");

        const closeButton =
            card.querySelector("[data-flip-close]");


        if (
            !front ||
            !back ||
            !openButton ||
            !closeButton
        ) {
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
            closeButton
        });

    });


    const animationDelay = () =>
        reduceMotion.matches ? 0 : 420;


    /* =====================================================
       SET FLIPPED STATE
    ====================================================== */

    const setFlipped = (
        state,
        flipped,
        moveFocus = true
    ) => {

        const {
            card,
            front,
            back,
            openButton,
            closeButton
        } = state;


        /* Clear any previous pending focus movement */

        const existingTimer =
            focusTimers.get(card);

        if (existingTimer) {
            window.clearTimeout(existingTimer);
        }


        card.classList.toggle(
            "is-flipped",
            flipped
        );


        openButton.setAttribute(
            "aria-expanded",
            String(flipped)
        );


        front.setAttribute(
            "aria-hidden",
            String(flipped)
        );


        back.setAttribute(
            "aria-hidden",
            String(!flipped)
        );


        front.inert = flipped;
        back.inert = !flipped;


        if (!moveFocus) {
            return;
        }


        const timer =
            window.setTimeout(() => {

                if (flipped) {

                    closeButton.focus({
                        preventScroll: true
                    });

                } else {

                    openButton.focus({
                        preventScroll: true
                    });

                }


                focusTimers.delete(card);

            }, animationDelay());


        focusTimers.set(
            card,
            timer
        );

    };


    /* =====================================================
       CLOSE ALL OTHER SERVICES
    ====================================================== */

    const closeOtherCards = (
        activeState
    ) => {

        cardStates.forEach((state) => {

            if (
                state !== activeState &&
                state.card.classList.contains(
                    "is-flipped"
                )
            ) {

                /*
                 * Close silently.
                 * Focus must remain with the
                 * service the user just selected.
                 */

                setFlipped(
                    state,
                    false,
                    false
                );

            }

        });

    };


    /* =====================================================
       EVENTS
    ====================================================== */

    cardStates.forEach((state) => {

        const {
            card,
            openButton,
            closeButton
        } = state;


        /* OPEN */

        openButton.addEventListener(
            "click",
            () => {

                /*
                 * First close any currently
                 * active service.
                 */

                closeOtherCards(state);


                /*
                 * Then activate the selected
                 * service.
                 */

                setFlipped(
                    state,
                    true
                );

            }
        );


        /* CLOSE */

        closeButton.addEventListener(
            "click",
            () => {

                setFlipped(
                    state,
                    false
                );

            }
        );


        /* ESCAPE closes active service */

        card.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape" &&
                    card.classList.contains(
                        "is-flipped"
                    )
                ) {

                    setFlipped(
                        state,
                        false
                    );

                }

            }
        );

    });

    /* =====================================================
   CLICK AWAY — CLOSE ACTIVE SERVICE
===================================================== */

document.addEventListener(
    "click",
    (event) => {

        /*
         * If the click happened inside
         * any service flip card,
         * let that card handle it.
         */

        const clickedInsideCard =
            event.target.closest(
                "[data-service-flip]"
            );


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

            if (
                state.card.classList.contains(
                    "is-flipped"
                )
            ) {

                setFlipped(
                    state,
                    false,
                    false
                );

            }

        });

    }
);

})();


/* =========================================================
   MAMBODLA — VIEWPORT-AWARE SCROLL REVEAL
   EASE → REVEAL → SETTLE
========================================================= */

(() => {

    const revealItems =
        [
            ...document.querySelectorAll(
                "[data-reveal]"
            )
        ];


    if (!revealItems.length) {
        return;
    }


    const reduceMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    /* =====================================================
       REDUCED MOTION
    ====================================================== */

    if (reduceMotion.matches) {

        revealItems.forEach((item) => {

            item.classList.add(
                "is-visible"
            );

        });

        return;
    }


    /* =====================================================
       STAGGER DELAYS
    ====================================================== */

    revealItems.forEach((item) => {

        const delayStep =
            Number(
                item.dataset.revealDelay || 0
            );


        const delay =
            Math.min(delayStep, 6) * 70;


        item.style.setProperty(
            "--reveal-delay",
            `${delay}ms`
        );

    });


    /* =====================================================
       INITIAL VIEWPORT CLASSIFICATION
    ====================================================== */

    const initialiseReveals = () => {

        const viewportHeight =
            window.visualViewport?.height
            ?? window.innerHeight;


        const pendingItems = [];


        revealItems.forEach((item) => {

            const rect =
                item.getBoundingClientRect();


            /*
                Anything whose TOP already sits inside
                or above the initial viewport is considered
                part of the page-arrival composition.

                It must therefore be completely visible
                while the page is sliding in.
            */

            const alreadyReached =
                rect.top < viewportHeight;


            if (alreadyReached) {

                item.classList.add(
                    "is-visible"
                );

                return;
            }


            /*
                Everything genuinely below the initial
                viewport becomes eligible for scroll reveal.
            */

            item.classList.add(
                "reveal-pending"
            );


            pendingItems.push(item);

        });


        /* =================================================
           FALLBACK
        ================================================== */

        if (!("IntersectionObserver" in window)) {

            pendingItems.forEach((item) => {

                item.classList.add(
                    "is-visible"
                );

            });

            return;
        }


        /* =================================================
           SCROLL OBSERVER
        ================================================== */

        const observer =
            new IntersectionObserver(

                (entries) => {

                    entries.forEach((entry) => {

                        if (!entry.isIntersecting) {
                            return;
                        }


                        entry.target.classList.add(
                            "is-visible"
                        );


                        /*
                            Reveal once.

                            Once information has arrived,
                            it remains calmly present.
                        */

                        observer.unobserve(
                            entry.target
                        );

                    });

                },

                {
                    root: null,

                    rootMargin:
                        "0px 0px -8% 0px",

                    threshold:
                        0.12
                }

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

    requestAnimationFrame(
        initialiseReveals
    );

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

    const enabledPages =
        new Set([
            "about.html",
            "services.html",
            "insights.html",
            "contact.html"
        ]);


    const pageName =
        window.location.pathname
            .split("/")
            .pop()
        || "index.html";


    if (!enabledPages.has(pageName)) {
        return;
    }


    const SCROLL_THRESHOLD =
        400;


    const reduceMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    /* =====================================================
       BUILD UTILITY
    ====================================================== */

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "back-to-top";


    button.setAttribute(
        "aria-label",
        "Back to top"
    );


    /*
        Hidden utilities must not remain
        in the keyboard tab order.
    */

    button.tabIndex =
        -1;


    const label =
        document.createElement(
            "span"
        );


    label.className =
        "back-to-top-label";


    label.setAttribute(
        "aria-hidden",
        "true"
    );


    label.textContent =
        "Back to top";


    const arrow =
        document.createElement(
            "span"
        );


    arrow.className =
        "back-to-top-arrow";


    arrow.setAttribute(
        "aria-hidden",
        "true"
    );


    arrow.textContent =
        "↑";


    button.append(
        label,
        arrow
    );


    document.body.append(
        button
    );


    /* =====================================================
       VISIBILITY
    ====================================================== */

    let frameRequested =
        false;


    const syncVisibility = () => {

        frameRequested =
            false;


        const drawerOpen =
            document.body
                .classList
                .contains(
                    "menu-open"
                );


        const farEnoughDown =
            window.scrollY >=
            SCROLL_THRESHOLD;


        const shouldShow =
            farEnoughDown &&
            !drawerOpen;


        button.classList.toggle(
            "is-visible",
            shouldShow
        );


        button.tabIndex =
            shouldShow
                ? 0
                : -1;

    };


    /*
        Scroll events can fire many times per frame.

        One visual update per animation frame
        is more than enough.
    */

    const requestVisibilitySync =
        () => {

            if (frameRequested) {
                return;
            }


            frameRequested =
                true;


            requestAnimationFrame(
                syncVisibility
            );

        };


    window.addEventListener(
        "scroll",
        requestVisibilitySync,
        {
            passive: true
        }
    );


    /* =====================================================
       MOBILE DRAWER STATE
    ====================================================== */

    /*
        main.js already places "menu-open"
        on BODY when the drawer opens.

        Observe that existing state instead of
        modifying the drawer architecture.
    */

    const bodyObserver =
        new MutationObserver(
            requestVisibilitySync
        );


    bodyObserver.observe(
        document.body,
        {
            attributes: true,
            attributeFilter: [
                "class"
            ]
        }
    );


    /* =====================================================
       RETURN TO TOP
    ====================================================== */

    button.addEventListener(
        "click",
        () => {

            /*
                Respect reduced-motion preference.

                The normal experience keeps the
                approved smooth return journey.
            */

            if (reduceMotion.matches) {

                window.scrollTo(
                    0,
                    0
                );

                return;
            }


            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth"
            });

        }
    );


    /* =====================================================
       HISTORY / RESTORED SCROLL POSITION
    ====================================================== */

    window.addEventListener(
        "pageshow",
        requestVisibilitySync
    );


    /*
        Establish the correct state immediately.

        Usually hidden because a newly entered
        page begins near the top.
    */

    requestAnimationFrame(
        syncVisibility
    );

})();