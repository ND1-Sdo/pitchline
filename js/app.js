(function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (!window.PitchlineTips) return;

  if (page === "home") window.PitchlineTips.renderHome();
  if (page === "tips") window.PitchlineTips.renderTipsList();
  if (page === "tip") window.PitchlineTips.renderTipDetail();
});
