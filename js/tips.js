const LEAGUES = [
  { slug: "premier-league", name: "Premier League", short: "EPL" },
  { slug: "la-liga", name: "La Liga", short: "ESP" },
  { slug: "serie-a", name: "Serie A", short: "ITA" },
  { slug: "bundesliga", name: "Bundesliga", short: "GER" },
  { slug: "ligue-1", name: "Ligue 1", short: "FRA" },
  { slug: "champions-league", name: "Champions League", short: "UCL" },
];

async function loadTips() {
  const res = await fetch("/api/tips", { credentials: "same-origin" });
  if (res.status === 401) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/unlock.html?next=${next}`);
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error("Could not load tips");
  return res.json();
}

function lockedHomeHtml() {
  return `
    <div class="locked-panel">
      <p class="section-kicker">Members only</p>
      <h2 class="detail-match" style="font-size:clamp(1.4rem,3vw,1.9rem)">Tips are locked</h2>
      <p class="detail-summary">Enter this week’s access code to see featured picks and full analysis.</p>
      <a class="btn btn-primary" href="unlock.html">Unlock with weekly code</a>
    </div>
  `;
}

function formatKickoff(iso) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Dublin",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function tipRowHtml(tip) {
  return `
    <a class="tip-row" href="tip.html?id=${encodeURIComponent(tip.id)}" data-reveal>
      <div class="tip-row-main">
        <div class="tip-meta">
          <span class="tip-league">${tip.leagueName}</span>
          <span>${formatKickoff(tip.kickoff)}</span>
        </div>
        <div class="tip-match">${tip.home} vs ${tip.away}</div>
        <p class="tip-summary">${tip.summary}</p>
      </div>
      <div class="tip-side">
        <div class="tip-market">${tip.market}</div>
        <div class="tip-odds">${tip.odds}</div>
        <div class="tip-conf">${tip.confidence}% confidence</div>
      </div>
    </a>
  `;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function observeReveals(root = document) {
  const nodes = root.querySelectorAll("[data-reveal]");
  if (!nodes.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.transitionDelay = `${Math.min(i * 40, 200)}ms`;
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  nodes.forEach((el) => io.observe(el));
}

async function renderHome() {
  const featuredEl = document.getElementById("featured-tip");
  const listEl = document.getElementById("latest-tips");
  if (!featuredEl && !listEl) return;

  try {
    const session = await fetch("/api/session", { credentials: "same-origin" }).then((r) => r.json());
    if (!session.authenticated) {
      if (featuredEl) featuredEl.innerHTML = lockedHomeHtml();
      if (listEl) {
        listEl.innerHTML = `<p class="empty-state">Unlock with your weekly code to browse tips. <a href="unlock.html">Enter code</a></p>`;
      }
      return;
    }

    const tips = await loadTips();
    const featured = [...tips].sort((a, b) => b.confidence - a.confidence)[0];
    const latest = tips.slice(0, 6);

    if (featuredEl && featured) {
      featuredEl.innerHTML = `
        <div class="featured-card">
          <div>
            <p class="section-kicker">${featured.leagueName} · Featured</p>
            <h2 class="detail-match" style="font-size:clamp(1.5rem,3vw,2.1rem)">${featured.home} vs ${featured.away}</h2>
            <p class="detail-summary">${featured.summary}</p>
            <p class="tip-meta" style="margin-bottom:1.25rem">
              <span>${featured.market}</span>
              <span>@ ${featured.odds}</span>
              <span>${featured.confidence}% confidence</span>
            </p>
            <a class="btn btn-primary" href="tip.html?id=${encodeURIComponent(featured.id)}">Read full tip</a>
          </div>
          <div class="featured-visual" role="img" aria-label="Football pitch"></div>
        </div>
      `;
    }

    if (listEl) {
      listEl.innerHTML = latest.map(tipRowHtml).join("");
      observeReveals(listEl);
    }
  } catch (err) {
    if (err.message === "unauthorized") return;
    if (featuredEl) featuredEl.innerHTML = lockedHomeHtml();
    if (listEl) listEl.innerHTML = `<p class="empty-state">Tips are temporarily unavailable.</p>`;
    console.error(err);
  }
}

async function renderTipsList() {
  const listEl = document.getElementById("tips-list");
  const filtersEl = document.getElementById("league-filters");
  if (!listEl) return;

  const initial = getQueryParam("league") || "all";

  try {
    const tips = await loadTips();

    if (filtersEl) {
      const chips = [
        { slug: "all", name: "All leagues" },
        ...LEAGUES.map((l) => ({ slug: l.slug, name: l.name })),
      ];
      filtersEl.innerHTML = chips
        .map(
          (c) => `
          <button type="button" class="filter-chip" data-league="${c.slug}" aria-pressed="${
            c.slug === initial ? "true" : "false"
          }">${c.name}</button>`
        )
        .join("");
    }

    const paint = (league) => {
      const filtered =
        league === "all" ? tips : tips.filter((t) => t.league === league);
      if (!filtered.length) {
        listEl.innerHTML = `<p class="empty-state">No tips for this league yet.</p>`;
        return;
      }
      listEl.innerHTML = filtered.map(tipRowHtml).join("");
      observeReveals(listEl);

      filtersEl?.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.setAttribute("aria-pressed", chip.dataset.league === league ? "true" : "false");
      });

      const url = new URL(window.location.href);
      if (league === "all") url.searchParams.delete("league");
      else url.searchParams.set("league", league);
      history.replaceState({}, "", url);
    };

    paint(initial);

    filtersEl?.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      paint(btn.dataset.league);
    });
  } catch (err) {
    listEl.innerHTML = `<p class="empty-state">Tips are temporarily unavailable.</p>`;
    console.error(err);
  }
}

async function renderTipDetail() {
  const root = document.getElementById("tip-detail");
  if (!root) return;

  const id = getQueryParam("id");
  if (!id) {
    root.innerHTML = `<p class="empty-state">Tip not found. <a href="tips.html">Browse all tips</a>.</p>`;
    return;
  }

  try {
    const tips = await loadTips();
    const tip = tips.find((t) => t.id === id);
    if (!tip) {
      root.innerHTML = `<p class="empty-state">Tip not found. <a href="tips.html">Browse all tips</a>.</p>`;
      return;
    }

    document.title = `${tip.home} vs ${tip.away} tip · Pitchline`;

    root.innerHTML = `
      <div class="page-hero">
        <div class="container">
          <p class="section-kicker">${tip.leagueName} · ${formatKickoff(tip.kickoff)}</p>
          <h1>${tip.home} vs ${tip.away}</h1>
          <p>${tip.summary}</p>
        </div>
      </div>
      <div class="container detail-grid">
        <article class="detail-body">
          <h2>Analysis</h2>
          <p>${tip.analysis}</p>
        </article>
        <aside class="pick-panel">
          <p class="label">Our pick</p>
          <p class="selection">${tip.selection}</p>
          <p class="label">${tip.market}</p>
          <div class="pick-stats">
            <div>
              <span>Odds</span>
              <strong>${tip.odds}</strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>${tip.confidence}%</strong>
            </div>
          </div>
          <div class="confidence-bar" aria-hidden="true"><i style="width:${tip.confidence}%"></i></div>
          <p class="disclaimer-box">
            Editorial tip only — not a bet placement. Odds change. 18+ only. Please gamble responsibly.
          </p>
          <a class="btn btn-ghost" href="tips.html?league=${encodeURIComponent(tip.league)}" style="width:100%;margin-top:1rem">More ${tip.leagueName}</a>
        </aside>
      </div>
    `;

    requestAnimationFrame(() => {
      const bar = root.querySelector(".confidence-bar > i");
      if (bar) {
        const w = bar.style.width;
        bar.style.width = "0";
        requestAnimationFrame(() => {
          bar.style.width = w;
        });
      }
    });
  } catch (err) {
    root.innerHTML = `<p class="empty-state">Tips are temporarily unavailable.</p>`;
    console.error(err);
  }
}

window.PitchlineTips = {
  LEAGUES,
  loadTips,
  renderHome,
  renderTipsList,
  renderTipDetail,
  observeReveals,
};
