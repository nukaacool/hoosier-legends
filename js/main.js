/* eslint-disable no-restricted-globals */
(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Header scroll state
  const navEl = qs("[data-site-header] .nav");
  const setScrolled = () => {
    if (!navEl) return;
    navEl.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  // Mobile menu
  const toggleBtn = qs("[data-nav-toggle]");
  const mobileMenu = qs("[data-mobile-menu]");
  const closeBtn = qs("[data-nav-close]");
  const backdropBtn = qs("[data-nav-backdrop]");

  const openMenu = () => {
    if (!toggleBtn || !mobileMenu) return;
    toggleBtn.setAttribute("aria-expanded", "true");
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    if (!toggleBtn || !mobileMenu) return;
    toggleBtn.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  toggleBtn?.addEventListener("click", () => {
    const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMenu();
    else openMenu();
  });
  closeBtn?.addEventListener("click", closeMenu);
  backdropBtn?.addEventListener("click", closeMenu);
  qsa(".mobile-menu__link", mobileMenu || document).forEach((a) => a.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Counters (IntersectionObserver)
  const counterEls = qsa("[data-counter]");
  if (counterEls.length) {
    const animateCounter = (el) => {
      const to = Number(el.getAttribute("data-to") || "0");
      const from = 0;
      const dur = 900;
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(from + (to - from) * eased);
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.dataset.didCount) return;
          el.dataset.didCount = "true";
          animateCounter(el);
          observer.unobserve(el);
        });
      },
      { threshold: 0.35 }
    );

    counterEls.forEach((el) => obs.observe(el));
  }

  // Standings tabs
  const tabsRoot = qs("[data-tabs]");
  if (tabsRoot) {
    const tabs = qsa("[data-tab]", tabsRoot);
    const panels = qsa("[data-panel]", tabsRoot);

    const setActive = (id, { focus = false } = {}) => {
      tabs.forEach((t) => {
        const active = t.getAttribute("data-tab") === id;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
        t.setAttribute("tabindex", active ? "0" : "-1");
        if (active && focus) t.focus();
      });

      panels.forEach((p) => {
        const active = p.getAttribute("data-panel") === id;
        p.classList.toggle("is-active", active);
        p.setAttribute("aria-hidden", active ? "false" : "true");
      });

      const hash = `#${encodeURIComponent(id)}`;
      if (location.hash !== hash) history.replaceState(null, "", hash);
    };

    const initial = (() => {
      const h = decodeURIComponent((location.hash || "").replace("#", "")).trim();
      const has = tabs.some((t) => t.getAttribute("data-tab") === h);
      return has ? h : tabs[0]?.getAttribute("data-tab");
    })();

    if (initial) setActive(initial);

    tabs.forEach((t) => {
      t.addEventListener("click", () => setActive(t.getAttribute("data-tab")));
      t.addEventListener("keydown", (e) => {
        const i = tabs.indexOf(t);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const next = tabs[(i + 1) % tabs.length];
          setActive(next.getAttribute("data-tab"), { focus: true });
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = tabs[(i - 1 + tabs.length) % tabs.length];
          setActive(prev.getAttribute("data-tab"), { focus: true });
        }
      });
    });

    window.addEventListener("hashchange", () => {
      const h = decodeURIComponent((location.hash || "").replace("#", "")).trim();
      if (!h) return;
      if (tabs.some((t) => t.getAttribute("data-tab") === h)) setActive(h);
    });
  }

  // Sports filters
  const filtersRoot = qs("[data-filters]");
  if (filtersRoot) {
    const buttons = qsa("[data-filter]", filtersRoot);
    const cards = qsa("[data-sport-card]", filtersRoot);

    const apply = (season) => {
      buttons.forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-filter") === season));
      cards.forEach((c) => {
        const s = c.getAttribute("data-season");
        const show = season === "ALL" || s === season;
        c.style.display = show ? "" : "none";
      });
    };

    const initial = (qs("[data-filter].is-active", filtersRoot)?.getAttribute("data-filter")) || "ALL";
    apply(initial);

    buttons.forEach((b) => b.addEventListener("click", () => apply(b.getAttribute("data-filter"))));
  }

  // Contact form validation
  const form = qs("[data-contact-form]");
  if (form) {
    const success = qs("[data-form-success]");
    const nameEl = qs('input[name="name"]', form);
    const emailEl = qs('input[name="email"]', form);
    const schoolEl = qs('select[name="school"]', form);
    const messageEl = qs('textarea[name="message"]', form);

    const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

    const setInvalid = (el, msg) => {
      el.setCustomValidity(msg);
      el.reportValidity();
    };

    const clearInvalid = (el) => el.setCustomValidity("");

    [nameEl, emailEl, schoolEl, messageEl].filter(Boolean).forEach((el) => {
      el.addEventListener("input", () => clearInvalid(el));
      el.addEventListener("change", () => clearInvalid(el));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!nameEl || !emailEl || !schoolEl || !messageEl) return;

      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const school = schoolEl.value.trim();
      const message = messageEl.value.trim();

      if (name.length < 2) return setInvalid(nameEl, "Please enter your name.");
      if (!isEmail(email)) return setInvalid(emailEl, "Please enter a valid email address.");
      if (!school) return setInvalid(schoolEl, "Please select a school.");
      if (message.length < 10) return setInvalid(messageEl, "Please enter a message (10+ characters).");

      form.reset();
      success?.classList.add("is-visible");
      success?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      window.setTimeout(() => success?.classList.remove("is-visible"), 5000);
    });
  }
})();

