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

(function initLogout() {
  const link = document.getElementById("logout-link");
  if (!link) return;
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* ignore */
    }
    window.location.href = "/unlock.html";
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (!window.PitchlineTips) return;

  if (page === "home") window.PitchlineTips.renderHome();
  if (page === "tips") window.PitchlineTips.renderTipsList();
  if (page === "tip") window.PitchlineTips.renderTipDetail();
});
