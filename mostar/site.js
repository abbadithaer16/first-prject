// Shared behaviour for every page: language menu, layered hero parallax,
// the bridge timeline and the day-trip map. Each part is skipped when its
// markup is not on the page.
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Language menu ---------- */
  document.querySelectorAll(".language-switcher").forEach((button) => {
    const menu = document.getElementById(button.getAttribute("aria-controls"));
    if (!menu) return;
    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    };
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setOpen(menu.hidden);
    });
    document.addEventListener("click", (event) => {
      if (!menu.hidden && !menu.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        setOpen(false);
        button.focus();
      }
    });
  });

  /* ---------- Layered hero parallax ---------- */
  const hero = document.querySelector(".page-hero");
  if (hero) {
    const layers = Array.from(hero.querySelectorAll("[data-depth]"));
    const copy = hero.querySelector(".page-hero-copy");
    let pending = false;

    const render = () => {
      pending = false;
      const height = hero.offsetHeight;
      const y = Math.min(Math.max(window.scrollY, 0), height);
      if (reduceMotion.matches) {
        layers.forEach((layer) => layer.style.setProperty("--py", "0px"));
        if (copy) copy.style.setProperty("--fade", "1");
        return;
      }
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth) || 0;
        layer.style.setProperty("--py", `${(y * depth).toFixed(1)}px`);
      });
      if (copy) copy.style.setProperty("--fade", Math.max(0, 1 - y / (height * 0.55)).toFixed(3));
    };
    const tick = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(render);
    };
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    reduceMotion.addEventListener("change", tick);
    render();
  }

  /* ---------- Bridge timeline: the sticky year follows the entry in view ---------- */
  const timeline = document.querySelector("[data-timeline]");
  if (timeline && "IntersectionObserver" in window) {
    const yearEl = timeline.querySelector(".timeline-year");
    const yearText = yearEl.querySelector("span");
    const entries = Array.from(timeline.querySelectorAll("li[data-year]"));
    let current = null;
    let swapTimer = 0;

    const activate = (entry) => {
      if (entry === current) return;
      current = entry;
      entries.forEach((item) => item.classList.toggle("is-active", item === entry));
      const year = entry.dataset.year;
      window.clearTimeout(swapTimer);
      if (reduceMotion.matches) {
        yearText.textContent = year;
        return;
      }
      yearEl.classList.add("is-changing");
      swapTimer = window.setTimeout(() => {
        yearText.textContent = year;
        yearEl.classList.remove("is-changing");
      }, 200);
    };

    const observer = new IntersectionObserver(
      (records) => {
        records.forEach((record) => {
          if (record.isIntersecting) activate(record.target);
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    entries.forEach((entry) => observer.observe(entry));
    activate(entries[0]);
  }

  /* ---------- Day-trip map: one trip open at a time, synced with the map ---------- */
  const trips = document.querySelector("[data-trips]");
  if (trips) {
    const buttons = Array.from(trips.querySelectorAll(".trip-button"));
    const points = Array.from(trips.querySelectorAll(".map-point[data-trip]"));
    const routes = Array.from(trips.querySelectorAll(".map-route[data-trip]"));

    const select = (id) => {
      buttons.forEach((button) => {
        const open = button.dataset.trip === id;
        button.setAttribute("aria-expanded", String(open));
        document.getElementById(button.getAttribute("aria-controls")).hidden = !open;
      });
      points.forEach((point) => point.classList.toggle("is-active", point.dataset.trip === id));
      routes.forEach((route) => route.classList.toggle("is-active", route.dataset.trip === id));
    };

    buttons.forEach((button) => button.addEventListener("click", () => select(button.dataset.trip)));
    points.forEach((point) => {
      point.addEventListener("click", () => select(point.dataset.trip));
    });
    select(buttons[0].dataset.trip);
  }
})();
