/* =========================================================
   MAMBODLA — FAQ ACCORDION
   Keeps the page calm by allowing one answer open at a time.
========================================================= */

(() => {
  const items = [...document.querySelectorAll(".faq-item")];

  if (!items.length) {
    return;
  }

  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) {
        return;
      }

      items.forEach((otherItem) => {
        if (otherItem !== item && otherItem.open) {
          otherItem.open = false;
        }
      });
    });
  });
})();
