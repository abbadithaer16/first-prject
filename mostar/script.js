(() => {
  const section = document.querySelector(".cinema-scroll");
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sightsTrack = document.querySelector(".sights-track");
  const sightsControls = document.querySelector(".sights-controls");
  const sightPrev = document.querySelector(".sight-prev");
  const sightNext = document.querySelector(".sight-next");
  const originalSightCards = Array.from(document.querySelectorAll(".sight-card"));

  if (!section) return;

  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetScroll = 0;
  let smoothScroll = 0;
  let initialized = false;
  let rafPending = false;
  let sightCards = [];
  const originalSightCount = originalSightCards.length;
  let activeSight = originalSightCount;

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smoothstep = (e0, e1, v) => {
    const x = clamp((v - e0) / (e1 - e0));
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const segmentInOut = (s, a, b, c, d) => {
    const enter = smoothstep(a, b, s);
    const exit = smoothstep(c, d, s);
    return { enter, exit, active: enter * (1 - exit) };
  };
  const getScrollDistance = () =>
    clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);

  const f = (n, d = 4) => n.toFixed(d);
  const set = (name, value) => root.style.setProperty(name, value);

  function update() {
    rafPending = false;

    targetScroll = getScrollDistance();
    if (!initialized || reduceMotion.matches) {
      smoothScroll = targetScroll;
      initialized = true;
    } else {
      smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
    }
    if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

    if (reduceMotion.matches) {
      mouseX = targetMouseX;
      mouseY = targetMouseY;
    } else {
      mouseX = lerp(mouseX, targetMouseX, 0.12);
      mouseY = lerp(mouseY, targetMouseY, 0.12);
    }
    // Pointer parallax is bypassed under reduced motion.
    const px = reduceMotion.matches ? 0 : mouseX;
    const py = reduceMotion.matches ? 0 : mouseY;

    const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
    const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700);
    const introExit = smoothstep(90, 650, smoothScroll);
    const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
    const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
    const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
    const blurActive = clamp(frame2.active + frame3.active);
    const frame2Opacity = frame2.active * (1 - frame3.enter);
    const splitDrift = Math.pow(frame2.enter, 1.5);
    const panel2Opacity = frame2.active * (1 - frame2.exit);
    const panel3Opacity = frame3.active * (1 - frame3.exit);
    const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
    const sharedHeroY = progress * -74;
    const sharedHeroScale = progress * 0.23;
    const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
    const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

    set("--mx", f(px));
    set("--my", f(py));

    set("--back-opacity", f(1 - frame2.active * 0.06));
    set("--back-x", `${f(px * -12)}px`);
    set("--back-y", `${f(py * -4)}px`);
    set("--back-scale", f(backScale));
    set("--four-y", `${f(10 + progress * 10)}vh`);
    set("--four-scale", f(0.78 + progress * 0.16));
    set("--bazaar-y", `${f(20 - progress * 8)}vh`);
    set("--blur-px", `${f(blurActive * 14, 2)}px`);
    set("--back-brightness", f(1 - blurActive * 0.255));
    set("--bazaar-blur-px", `${f(frame2.active * 14, 2)}px`);
    set("--bazaar-brightness", f(1 - frame2.active * 0.255 - frame3.active * 0.06));
    set("--bazaar-saturation", f(1 + frame3.active * 0.18));
    set("--shade-opacity", "1");
    set("--shade-z", frame2.active > 0.02 ? "2" : "0");
    set("--shade-top-alpha", f(blurActive * 0.465));
    set("--shade-mid-alpha", f(blurActive * 0.42));
    set("--shade-bottom-alpha", f(blurActive * 0.51));

    set("--title-y", `${f(introExit * -210, 2)}px`);
    set("--title-scale", f(1 - introExit * 0.08));
    set("--title-opacity", f(1 - introExit));

    set("--bridge-x", `calc(-50% + ${f(px * 18, 2)}px)`);
    set("--bridge-y", `${f(py * 8 + sharedHeroY - frame2.exit * 760, 2)}px`);
    set("--bridge-bottom", `${f(5 - frame2.enter * 13)}vh`);
    set("--bridge-width", `${f(67.2 + frame2.enter * 37.8)}vw`);
    set("--bridge-scale", f(1.02 + sharedHeroScale + frame2.exit * 0.46));

    set("--split-left-x", `calc(-50% + ${f(-splitDrift * 46)}vw + ${f(px * 22, 2)}px)`);
    set("--split-left-y", `${f(py * 10 + sharedHeroY - splitDrift * 180, 2)}px`);
    set("--split-left-scale", f(1 + sharedHeroScale + frame2.enter * 0.74));
    set("--split-right-x", `calc(-50% + ${f(splitDrift * 46)}vw + ${f(px * 22, 2)}px)`);
    set("--split-right-y", `${f(py * 10 + sharedHeroY - splitDrift * 180, 2)}px`);
    set("--split-right-scale", f(1 + sharedHeroScale + frame2.enter * 0.74));

    set("--frame2-opacity", f(frame2Opacity));
    set("--frame2-x", `calc(-50% + ${f(px * 10, 2)}px)`);
    set("--frame2-y", `calc(-50% + ${f(py * 8 - frame2.exit * 150, 2)}px)`);
    set("--frame2-scale", f(1.06 + frame2.enter * 0.08 + frame2.exit * 0.08));

    set("--intro-copy-y", `${f(introExit * 90, 2)}px`);
    set("--intro-copy-opacity", f(1 - introExit));
    set("--panel2-opacity", f(panel2Opacity));
    set("--panel2-y", `calc(-50% + ${f(-frame2.exit * 86 + (1 - frame2.enter) * 58, 2)}px)`);
    set("--panel3-opacity", f(panel3Opacity));
    set("--panel3-y", `calc(-50% + ${f(-frame3.exit * 86 + (1 - frame3.enter) * 58, 2)}px)`);

    set("--sights-opacity", f(sightsEnter));
    set("--sights-controls-opacity", f(sightsControlsEnter));
    if (sightsControls) sightsControls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
    set("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden");
    set("--sights-y", "0px");
    set("--sights-enter-x", `${f((1 - sightsEnter) * 420)}vw`);
    set("--sights-scale", f(1 / backScale));
    set("--sights-top", `${f(sightsParentTop, 2)}px`);
    set("--sights-screen-top", `${f(sightsScreenTop, 2)}px`);

    if (
      Math.abs(smoothScroll - targetScroll) > 0.08 ||
      Math.abs(mouseX - targetMouseX) > 0.001 ||
      Math.abs(mouseY - targetMouseY) > 0.001
    ) {
      requestTick();
    }
  }

  function requestTick() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(update);
  }

  /* Infinite sights slider */
  function updateSightSlider() {
    if (!sightsTrack || !sightCards.length) return;
    const cardWidth = sightCards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(sightsTrack).columnGap || "0") || 0;
    root.style.setProperty("--sights-shift", `${-(cardWidth + gap) * activeSight}px`);
    sightCards.forEach((card, index) => card.classList.toggle("is-active", index === activeSight));
  }

  function moveSightSlider(dir) {
    activeSight += dir;
    updateSightSlider();
  }

  function selectSightCard(card) {
    const index = Number(card.dataset.sightIndex);
    if (Number.isFinite(index)) {
      activeSight = index;
      updateSightSlider();
    }
  }

  function jumpSightSlider(index) {
    sightsTrack.classList.add("is-jumping");
    activeSight = index;
    updateSightSlider();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => sightsTrack.classList.remove("is-jumping"));
    });
  }

  function normalizeSightSlider() {
    if (activeSight >= originalSightCount * 2) jumpSightSlider(activeSight - originalSightCount);
    else if (activeSight < originalSightCount) jumpSightSlider(activeSight + originalSightCount);
  }

  function setupSightSlider() {
    if (!sightsTrack || !originalSightCount) return;
    sightsTrack.replaceChildren();
    for (let setIndex = 0; setIndex < 3; setIndex += 1) {
      originalSightCards.forEach((card, cardIndex) => {
        const clone = card.cloneNode(true);
        clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
        sightsTrack.appendChild(clone);
      });
    }
    sightCards = Array.from(sightsTrack.querySelectorAll(".sight-card"));
    activeSight = originalSightCount;

    sightCards.forEach((card) => {
      card.addEventListener("click", () => selectSightCard(card));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectSightCard(card);
        }
      });
    });

    sightsTrack.addEventListener("transitionend", (event) => {
      if (event.target === sightsTrack) normalizeSightSlider();
    });
    updateSightSlider();
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", () => {
    updateSightSlider();
    requestTick();
  });
  window.addEventListener(
    "pointermove",
    (event) => {
      targetMouseX = event.clientX / window.innerWidth - 0.5;
      targetMouseY = event.clientY / window.innerHeight - 0.5;
      requestTick();
    },
    { passive: true }
  );
  if (sightPrev) sightPrev.addEventListener("click", () => moveSightSlider(-1));
  if (sightNext) sightNext.addEventListener("click", () => moveSightSlider(1));

  setupSightSlider();
  requestTick();
})();
