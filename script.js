/* ==========================================================================
   MEXICO FLUID TECHNOLOGIES  |  DeVilbiss + Binks
   JavaScript del sitio. Usa GSAP + ScrollTrigger y Lenis (scroll suave) desde CDN.
   Si esas librerías no cargan, la página sigue funcionando con versiones nativas
   (carrusel con scroll-snap, tarjetas normales, sin pin ni parallax).
   Cada bloque es independiente: si uno falla, el resto sigue.

   Índice
   01 Utilidades y espectro de color
   02 Enlaces de WhatsApp y botones
   03 Spinner de carga
   04 Scroll suave y anclas
   05 Barra superior, menú y navegación activa
   06 Titulares y reveal al hacer scroll
   07 Hero: entrada, producto rotativo y spray interactivo
   08 Manifiesto
   09 Equipos: recorrido horizontal fijado
   10 Sistema: tarjetas apiladas
   11 Laboratorio de tecnología (canvas)
   12 Resultado: video
   13 Galería: collage y lightbox
   14 Preguntas frecuentes
   15 Formulario hacia WhatsApp
   16 Botón flotante
   ========================================================================== */
(() => {
  "use strict";

  /* ------------------------------------------------------------------ 01 */
  const WA_NUMBER = "527221913322";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  let lenis = null;
  const readyCallbacks = [];
  const onReady = (callback) => readyCallbacks.push(callback);

  const scrollToY = (y) => {
    if (lenis) lenis.scrollTo(y, { duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  };

  /* Espectro exacto del logotipo DeVilbiss: se usa como "pintura" en toda la página */
  const SPECTRUM = [[14, 156, 97], [36, 159, 189], [56, 131, 173], [105, 63, 128], [160, 52, 106], [181, 55, 67], [213, 141, 49], [220, 181, 34]];
  const spectrumAt = (t) => {
    const last = SPECTRUM.length - 1;
    const x = (((t % 1) + 1) % 1) * last;
    const i = Math.floor(x);
    const f = x - i;
    const a = SPECTRUM[i];
    const b = SPECTRUM[Math.min(i + 1, last)];
    return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f));
  };

  /* Sprite de gota suave por color (con caché) */
  const spriteCache = new Map();
  const getSprite = (rgb) => {
    const key = rgb.map((v) => Math.round(v / 16) * 16).join(",");
    let sprite = spriteCache.get(key);
    if (!sprite) {
      sprite = document.createElement("canvas");
      sprite.width = 64;
      sprite.height = 64;
      const c = sprite.getContext("2d");
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, `rgba(${key},0.9)`);
      g.addColorStop(0.4, `rgba(${key},0.42)`);
      g.addColorStop(1, `rgba(${key},0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      spriteCache.set(key, sprite);
    }
    return sprite;
  };

  /* ------------------------------------------------------------------ 02 */
  const waLink = (message) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

  const initLinks = () => {
    $$("[data-wa]").forEach((link) => { link.href = waLink(link.dataset.wa); });
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    /* Relleno direccional: el color nace en el punto por donde entra el cursor */
    $$(".btn").forEach((button) => {
      const mark = (event) => {
        const rect = button.getBoundingClientRect();
        button.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        button.style.setProperty("--my", `${event.clientY - rect.top}px`);
      };
      button.addEventListener("pointerenter", mark);
      button.addEventListener("pointerleave", mark);
    });

    if (finePointer && !reduced) {
      $$("[data-magnetic]").forEach((el) => {
        el.addEventListener("pointermove", (event) => {
          const rect = el.getBoundingClientRect();
          el.style.setProperty("--tx", `${((event.clientX - (rect.left + rect.width / 2)) * 0.14).toFixed(1)}px`);
          el.style.setProperty("--ty", `${((event.clientY - (rect.top + rect.height / 2)) * 0.24).toFixed(1)}px`);
        });
        el.addEventListener("pointerleave", () => {
          el.style.setProperty("--tx", "0px");
          el.style.setProperty("--ty", "0px");
        });
      });
    }
  };

  /* ------------------------------------------------------------------ 03 */
  const initLoader = () => {
    const loader = $("#loader");
    const pct = $("#loader-pct");
    const status = $("#loader-status");
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (loader) loader.style.setProperty("--p", "100%");
      if (pct) pct.textContent = "100";
      if (status) status.textContent = "Listo para pintar";

      window.setTimeout(() => {
        loader?.classList.add("is-done");
        root.classList.remove("is-loading");
        body.classList.add("is-ready");
        lenis?.start();
        readyCallbacks.forEach((callback) => callback());
        window.setTimeout(() => loader?.classList.add("is-gone"), 1500);
      }, reduced ? 60 : 420);
    };

    if (!loader) {
      finished = true;
      root.classList.remove("is-loading");
      body.classList.add("is-ready");
      return;
    }

    const messages = [
      [0, "Calibrando presión"],
      [28, "Mezclando color"],
      [58, "Ajustando la boquilla"],
      [88, "Listo para pintar"]
    ];
    const MIN_MS = reduced ? 350 : 2300;
    const MAX_MS = 4800;
    const startedAt = performance.now();
    let pageLoaded = document.readyState === "complete";
    let shown = 0;
    let lastMessage = -1;

    window.addEventListener("load", () => { pageLoaded = true; });

    const frame = (now) => {
      const elapsed = now - startedAt;
      const ceiling = pageLoaded ? 100 : 92;
      const target = Math.min(ceiling, (elapsed / MIN_MS) * 100);
      shown = Math.min(target, shown + Math.max((target - shown) * 0.1, 0.3));

      loader.style.setProperty("--p", `${shown.toFixed(2)}%`);
      if (pct) pct.textContent = String(Math.round(shown));

      const index = messages.reduce((found, item, i) => (shown >= item[0] ? i : found), 0);
      if (index !== lastMessage && status) {
        lastMessage = index;
        status.textContent = messages[index][1];
      }

      if ((shown >= 99.5 && elapsed >= MIN_MS) || elapsed > MAX_MS) {
        finish();
        return;
      }
      window.requestAnimationFrame(frame);
    };

    window.requestAnimationFrame(frame);
    window.setTimeout(finish, MAX_MS + 1200);
  };

  /* ------------------------------------------------------------------ 04 */
  const initSmooth = () => {
    if (!hasGsap || reduced || typeof window.Lenis === "undefined") return;

    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); /* se activa cuando termina el spinner */
  };

  /* ------------------------------------------------------------------ 05 */
  let closeMenu = () => {};

  const initHeader = () => {
    const bar = $("#bar");
    const burger = $("#burger");
    const overlay = $("#overlay");
    if (!bar) return;
    let menuOpen = false;

    const setMenu = (open) => {
      menuOpen = open;
      overlay?.classList.toggle("is-open", open);
      overlay?.setAttribute("aria-hidden", String(!open));
      burger?.setAttribute("aria-expanded", String(open));
      burger?.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      bar.classList.toggle("is-menu", open);
      body.classList.toggle("is-locked", open);
      if (open) lenis?.stop();
      else lenis?.start();
    };
    closeMenu = () => { if (menuOpen) setMenu(false); };

    $$(".overlay__link").forEach((link, i) => link.style.setProperty("--i", i));
    burger?.addEventListener("click", () => setMenu(!menuOpen));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => { if (event.matches) closeMenu(); });

    /* Anclas: scroll suave con Lenis (o nativo si no hay librerías) */
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        if (!id || id.length < 2) return;
        const target = $(id);
        if (!target) return;
        event.preventDefault();
        closeMenu();
        const offset = id === "#inicio" || id === "#servicios" ? 0 : 40;
        window.setTimeout(() => scrollToY(target.getBoundingClientRect().top + window.scrollY + offset), menuOpen ? 80 : 0);
      });
    });

    /* Estado de la barra: sólida al bajar, oculta al bajar rápido, clara u oscura según la sección */
    const darkActive = new Set();
    const applyTheme = () => bar.classList.toggle("is-dark", darkActive.size > 0);

    if (hasGsap) {
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          bar.classList.toggle("is-solid", y > 40);
          if (menuOpen) return;
          if (self.direction === 1 && y > 360) bar.classList.add("is-hidden");
          else if (self.direction === -1) bar.classList.remove("is-hidden");
        }
      });
      $$("[data-theme='dark']").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 40px",
          end: "bottom 40px",
          onToggle: (self) => {
            if (self.isActive) darkActive.add(section);
            else darkActive.delete(section);
            applyTheme();
          }
        });
      });
    } else {
      const sentinel = document.createElement("span");
      sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none";
      body.prepend(sentinel);
      new IntersectionObserver(([entry]) => bar.classList.toggle("is-solid", !entry.isIntersecting)).observe(sentinel);
      const darkObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) darkActive.add(entry.target);
          else darkActive.delete(entry.target);
        });
        applyTheme();
      }, { rootMargin: "0px 0px -94% 0px" });
      $$("[data-theme='dark']").forEach((section) => darkObserver.observe(section));
    }

    /* Enlace activo */
    const links = $$(".nav__link");
    const map = { servicios: "servicios", sistema: "sistema", tecnologia: "tecnologia", resultado: "tecnologia", galeria: "galeria", preguntas: "galeria", contacto: "contacto" };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const current = map[entry.target.id] || "";
        links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((section) => spy.observe(section));

    /* Barra de progreso: CSS nativo cuando existe animation-timeline; si no, GSAP */
    const progress = $("#progress-bar");
    if (hasGsap && progress && !(window.CSS && CSS.supports("animation-timeline: scroll()"))) {
      gsap.to(progress, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    }
  };

  /* ------------------------------------------------------------------ 06 */
  const makeWord = (content) => {
    const outer = document.createElement("span");
    outer.className = "w";
    const inner = document.createElement("span");
    inner.className = "w__i";
    if (typeof content === "string") inner.textContent = content;
    else inner.appendChild(content);
    outer.appendChild(inner);
    return outer;
  };

  const splitWords = (el) => {
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((chunk) => {
          if (!chunk) return;
          fragment.append(/^\s+$/.test(chunk) ? document.createTextNode(chunk) : makeWord(chunk));
        });
        node.replaceWith(fragment);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        /* Un elemento de texto (por ejemplo el espectro) se divide palabra por palabra para que pueda saltar de línea */
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((chunk) => {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) {
            fragment.append(document.createTextNode(chunk));
          } else {
            const clone = node.cloneNode(false);
            clone.textContent = chunk;
            fragment.append(makeWord(clone));
          }
        });
        node.replaceWith(fragment);
      }
    });
    return $$(".w__i", el);
  };

  const initReveal = () => {
    if (!hasGsap || reduced) return;

    $$("[data-split]").forEach((title) => {
      const words = splitWords(title);
      gsap.from(words, {
        yPercent: 120,
        duration: 1.25,
        ease: "expo.out",
        stagger: 0.045,
        scrollTrigger: { trigger: title, start: "top 88%", once: true }
      });
    });

    $$("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 44,
        opacity: 0,
        duration: 1.25,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 91%", once: true }
      });
    });
  };

  /* ------------------------------------------------------------------ 07 */
  const initHero = () => {
    const hero = $("#inicio");
    if (!hero) return;

    /* --- Producto rotativo con barrido --- */
    const imgs = $$(".hero__img");
    const codeEl = $("#hero-code");
    const catEl = $("#hero-cat");
    let current = 0;
    let timer = 0;
    let visible = true;

    const show = (index) => {
      const previous = imgs[current];
      current = (index + imgs.length) % imgs.length;
      if (imgs[current] === previous) return;
      imgs.forEach((img) => img.classList.remove("is-prev"));
      previous.classList.remove("is-active");
      previous.classList.add("is-prev");
      imgs[current].classList.add("is-active");
      /* La foto anterior se retira al terminar el barrido para que no se asome por las franjas transparentes */
      window.setTimeout(() => previous.classList.remove("is-prev"), 1350);
      const next = imgs[current];
      window.setTimeout(() => {
        if (codeEl) codeEl.textContent = next.dataset.code;
        if (catEl) catEl.textContent = next.dataset.cat;
      }, 520);
    };
    const schedule = () => {
      window.clearTimeout(timer);
      if (reduced || !visible || document.hidden) return;
      timer = window.setTimeout(() => { show(current + 1); schedule(); }, 5200);
    };
    imgs[0]?.classList.add("is-active");
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: 0.15 }).observe(hero);
    document.addEventListener("visibilitychange", schedule);

    /* --- Entrada y parallax (GSAP) --- */
    if (hasGsap && !reduced) {
      const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      intro
        .from(".hl__in", { yPercent: 120, duration: 1.6, stagger: 0.14 }, 0)
        .from(".hero__product", { scale: 0.62, rotate: -26, opacity: 0, duration: 2, transformOrigin: "50% 60%" }, 0.15)
        .from("[data-hero]", { y: 40, opacity: 0, duration: 1.3, stagger: 0.12 }, 0.55)
        .from(".bar__in", { yPercent: -130, opacity: 0, duration: 1.2 }, 0.35);
      onReady(() => intro.play());

      /* Profundidad: el producto y el cartel reaccionan al cursor en sentidos opuestos */
      if (finePointer) {
        const moveProduct = { x: gsap.quickTo(".hero__product", "x", { duration: 1.2, ease: "power3.out" }), y: gsap.quickTo(".hero__product", "y", { duration: 1.2, ease: "power3.out" }) };
        const moveTitle = { x: gsap.quickTo(".hero__title", "x", { duration: 1.6, ease: "power3.out" }), y: gsap.quickTo(".hero__title", "y", { duration: 1.6, ease: "power3.out" }) };
        hero.addEventListener("pointermove", (event) => {
          const nx = event.clientX / window.innerWidth - 0.5;
          const ny = event.clientY / window.innerHeight - 0.5;
          moveProduct.x(nx * -46);
          moveProduct.y(ny * -30);
          moveTitle.x(nx * 14);
          moveTitle.y(ny * 8);
        }, { passive: true });
      }

      const scrub = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hl--a .hl__in", { xPercent: -10, ease: "none", scrollTrigger: scrub });
      gsap.to(".hl--b .hl__in", { xPercent: 9, ease: "none", scrollTrigger: scrub });
      gsap.to(".hero__img", { yPercent: -14, scale: 1.1, ease: "none", scrollTrigger: scrub });
      gsap.to(".hero__foot", { y: -30, opacity: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "55% top", end: "bottom top", scrub: true } });
    }

    /* --- Spray interactivo: el cursor "rocía" con el espectro del logotipo --- */
    const canvas = $("#paint");
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    const drops = [];
    const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, active: false, idle: 0 };
    let w = 0;
    let h = 0;
    let time = 0;
    let running = false;
    let raf = 0;
    const MAX_DROPS = 560;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.25 : 1.6);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const emit = (x, y, vx, vy, count) => {
      const hue = (x / Math.max(w, 1)) * 0.92 + time * 0.018;
      for (let i = 0; i < count; i += 1) {
        if (drops.length >= MAX_DROPS) drops.shift();
        const angle = Math.random() * Math.PI * 2;
        const burst = Math.random() * 2.2;
        drops.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          vx: vx * 0.18 + Math.cos(angle) * burst,
          vy: vy * 0.18 + Math.sin(angle) * burst,
          age: 0,
          life: 150 + Math.random() * 130,
          size: 16 + Math.random() * 40,
          rgb: spectrumAt(hue + Math.random() * 0.07)
        });
      }
    };

    const step = () => {
      time += 0.016;
      ctx.clearRect(0, 0, w, h);

      /* Pincel automático cuando nadie mueve el cursor: siempre hay pintura en movimiento */
      pointer.idle += 1;
      if (!pointer.active || pointer.idle > 90) {
        const gx = w * (0.5 + 0.4 * Math.sin(time * 0.62));
        const gy = h * (0.5 + 0.3 * Math.sin(time * 0.91 + 1.3) * Math.cos(time * 0.33));
        emit(gx, gy, Math.cos(time * 0.62) * 6, Math.cos(time * 0.91) * 4, 3);
      }

      for (let i = drops.length - 1; i >= 0; i -= 1) {
        const d = drops[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.965;
        d.vy = d.vy * 0.965 + 0.012;
        d.age += 1;
        const life = 1 - d.age / d.life;
        if (life <= 0) {
          drops[i] = drops[drops.length - 1];
          drops.pop();
          continue;
        }
        const size = d.size * (1 + (1 - life) * 0.7);
        ctx.globalAlpha = Math.min(1, life * 1.6) * 0.34;
        ctx.drawImage(getSprite(d.rgb), d.x - size / 2, d.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(step);
    };
    const start = () => { if (!running) { running = true; raf = window.requestAnimationFrame(step); } };
    const stop = () => { running = false; window.cancelAnimationFrame(raf); };

    resize();
    let resizeTimer = 0;
    window.addEventListener("resize", () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(resize, 200); });

    hero.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      const dx = pointer.x - pointer.lastX;
      const dy = pointer.y - pointer.lastY;
      const distance = Math.hypot(dx, dy);
      if (pointer.active && distance > 2) emit(pointer.x, pointer.y, dx, dy, clamp(Math.round(distance / 7), 1, 7));
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      pointer.active = true;
      pointer.idle = 0;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { pointer.active = false; });

    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  };

  /* ------------------------------------------------------------------ 08 */
  const initManifesto = () => {
    const text = $("#mani-text");
    if (!text) return;

    /* El texto se divide en palabras; las fotos en línea se mantienen como piezas del texto */
    [...text.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((chunk) => {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) {
          fragment.append(document.createTextNode(chunk));
        } else {
          const span = document.createElement("span");
          span.className = "mw";
          span.textContent = chunk;
          fragment.append(span);
        }
      });
      node.replaceWith(fragment);
    });

    if (!hasGsap || reduced) return;

    const pieces = $$(".mw, .inl", text);
    gsap.fromTo(pieces, { opacity: 0.12 }, {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: text, start: "top 82%", end: "bottom 52%", scrub: 0.6 }
    });

    $$(".diff__item").forEach((item) => {
      gsap.fromTo(item, { "--l": 0 }, {
        "--l": 1, duration: 1.6, ease: "expo.out",
        scrollTrigger: { trigger: item, start: "top 90%", once: true }
      });
      gsap.from(item.children, {
        y: 34, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.09,
        scrollTrigger: { trigger: item, start: "top 90%", once: true }
      });
    });
  };

  /* ------------------------------------------------------------------ 09 */
  const initShowcase = () => {
    const section = $("#servicios");
    const pin = $("#show-pin");
    const track = $("#show-track");
    if (!section || !pin || !track) return;

    const panels = $$(".panel--product", track);
    const hudNow = $("#hud-now");
    const hudType = $("#hud-type");
    const hudFill = $("#hud-fill");
    let api = null;

    const nativeJump = (category) => {
      const panel = panels.find((item) => item.dataset.cat === category);
      if (!panel) return;
      track.scrollTo({ left: panel.offsetLeft - (track.clientWidth - panel.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
    };
    $$("[data-jump]").forEach((button) => {
      button.addEventListener("click", () => (api ? api.jump(button.dataset.jump) : nativeJump(button.dataset.jump)));
    });

    if (!hasGsap || reduced) return;

    /* Escritorio: el scroll vertical mueve el recorrido horizontal mientras la sección queda fija */
    const media = gsap.matchMedia();
    media.add("(min-width: 1024px) and (min-height: 560px)", () => {
      section.classList.add("has-pin");
      track.scrollLeft = 0;

      const ghosts = panels.map((panel) => $(".panel__ghost", panel));
      const photos = panels.map((panel) => $(".panel__fig img", panel));
      let dist = 0;
      let lefts = [];
      let widths = [];
      let target = 0;
      let eased = 0;
      let live = false;
      let active = -1;

      /* Las posiciones se miden con el track en 0 para no depender de offsetLeft dentro de un contenedor con scroll */
      const measure = () => {
        const saved = track.scrollLeft;
        track.scrollLeft = 0;
        const origin = track.getBoundingClientRect().left;
        lefts = panels.map((panel) => panel.getBoundingClientRect().left - origin);
        widths = panels.map((panel) => panel.getBoundingClientRect().width);
        dist = Math.max(0, track.scrollWidth - track.clientWidth);
        track.scrollLeft = saved;
      };
      measure();

      const trigger = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () => `+=${dist}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: measure,
        onUpdate: (self) => { target = self.progress; },
        onToggle: (self) => { live = self.isActive; }
      });

      const render = () => {
        const x = eased * dist;
        track.scrollLeft = x;
        const viewport = track.clientWidth;
        let best = 0;
        let bestDistance = Infinity;
        panels.forEach((panel, i) => {
          const center = lefts[i] + widths[i] / 2 - x;
          const rel = (center - viewport / 2) / viewport;
          ghosts[i].style.transform = `translate3d(${(-rel * 140).toFixed(1)}px,0,0)`;
          photos[i].style.transform = `translate3d(${(rel * 80).toFixed(1)}px,0,0) rotate(${(rel * 6).toFixed(2)}deg)`;
          if (Math.abs(rel) < bestDistance) { bestDistance = Math.abs(rel); best = i; }
        });
        if (best !== active) {
          active = best;
          const panel = panels[best];
          pin.style.backgroundColor = panel.dataset.tint;
          if (hudNow) hudNow.textContent = panel.dataset.name;
          if (hudType) hudType.textContent = panel.dataset.type;
        }
        if (hudFill) hudFill.style.transform = `scaleX(${eased.toFixed(4)})`;
      };

      const tick = (time, delta) => {
        if (!live && Math.abs(target - eased) < 0.0004) return;
        eased += (target - eased) * (1 - Math.exp(-(delta / 1000) * 9));
        render();
      };
      gsap.ticker.add(tick);
      render();

      api = {
        jump: (category) => {
          const index = panels.findIndex((panel) => panel.dataset.cat === category);
          if (index < 0) return;
          const x = clamp(lefts[index] + widths[index] / 2 - track.clientWidth / 2, 0, dist);
          scrollToY(trigger.start + (dist ? x / dist : 0) * (trigger.end - trigger.start));
        }
      };

      return () => {
        gsap.ticker.remove(tick);
        section.classList.remove("has-pin");
        api = null;
        pin.style.backgroundColor = "";
        track.scrollLeft = 0;
        panels.forEach((panel, i) => { ghosts[i].style.transform = ""; photos[i].style.transform = ""; });
      };
    });
  };

  /* ------------------------------------------------------------------ 10 */
  const initStack = () => {
    if (!hasGsap || reduced) return;
    const cards = $$(".scard");
    if (!cards.length) return;
    const media = gsap.matchMedia();

    /* Escritorio: las tarjetas se quedan pegadas y la anterior se hunde al llegar la siguiente */
    media.add("(min-width: 900px) and (min-height: 640px)", () => {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (next) {
          gsap.to(card, { scale: 0.93, ease: "none", scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true } });
        }
        gsap.fromTo($(".scard__fig img", card), { yPercent: 7, rotate: -2.5 }, {
          yPercent: -7, rotate: 2.5, ease: "none",
          scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true }
        });
        gsap.from($$(".scard__text > *", card), {
          y: 54, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: card, start: "top 60%", once: true }
        });
      });
    });

    media.add("(max-width: 899px), (max-height: 639px)", () => {
      cards.forEach((card) => {
        gsap.from($$(".scard__text > *", card), {
          y: 40, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: card, start: "top 78%", once: true }
        });
        gsap.from($(".scard__fig", card), {
          y: 60, opacity: 0, duration: 1.3, ease: "expo.out",
          scrollTrigger: { trigger: card, start: "top 70%", once: true }
        });
      });
    });
  };

  /* ------------------------------------------------------------------ 11 */
  /* Laboratorio: simulación ilustrativa de cómo cada tecnología deposita la pintura */
  const initLab = () => {
    const canvas = $("#lab-canvas");
    const stage = $("#lab-stage");
    if (!canvas || !stage) return;

    const ctx = canvas.getContext("2d");
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    const tabs = $$(".tech");

    const TECH = {
      hvlp: { color: [20, 87, 230], spread: 0.5, speed: 4.2, size: [2.6, 5.4], rate: 6, stray: 0.04 },
      trans: { spectrum: true, spread: 0.33, speed: 6, size: [1.8, 3.8], rate: 7, stray: 0.03 },
      conv: { color: [255, 122, 0], spread: 0.24, speed: 8.4, size: [0.9, 2.3], rate: 8, stray: 0.26 },
      assist: { color: [14, 156, 97], spread: 0.36, speed: 6.6, size: [1.3, 3], rate: 7, stray: 0.1 }
    };
    const order = ["hvlp", "trans", "conv", "assist"];
    const INTERVAL = 7000;

    let key = "hvlp";
    let w = 0;
    let h = 0;
    let time = 0;
    let drops = [];
    let raf = 0;
    let running = false;
    let autoTimer = 0;
    let userPicked = false;
    let visible = false;
    const wall = { x: 0, y: 0, w: 0, h: 0 };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = layer.width = Math.round(w * dpr);
      canvas.height = layer.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wall.x = w * 0.64; wall.w = w * 0.32; wall.y = h * 0.1; wall.h = h * 0.8;
      drops = [];
    };

    const roundRect = (c, x, y, width, height, radius) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.arcTo(x + width, y, x + width, y + height, radius);
      c.arcTo(x + width, y + height, x, y + height, radius);
      c.arcTo(x, y + height, x, y, radius);
      c.arcTo(x, y, x + width, y, radius);
      c.closePath();
    };

    const nozzle = () => ({ x: w * 0.12, y: h * 0.5 + Math.sin(time * 0.9) * h * 0.2 });

    const spawn = () => {
      const tech = TECH[key];
      const n = nozzle();
      const stray = Math.random() < tech.stray;
      const angle = (Math.random() - 0.5) * 2 * tech.spread * (stray ? 2.7 : 1);
      const speed = tech.speed * (w / 640) * (stray ? 0.55 : 0.9 + Math.random() * 0.2);
      const size = (tech.size[0] + Math.random() * (tech.size[1] - tech.size[0])) * (w / 640);
      drops.push({
        x: n.x + 16, y: n.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: size * (stray ? 3.2 : 1),
        rgb: tech.spectrum ? spectrumAt((n.y / h) * 0.9 + time * 0.03) : tech.color,
        stray, age: 0, life: stray ? 55 + Math.random() * 50 : 0
      });
    };

    const step = () => {
      time += 0.016;
      const tech = TECH[key];
      for (let i = 0; i < tech.rate; i += 1) spawn();

      for (let i = drops.length - 1; i >= 0; i -= 1) {
        const d = drops[i];
        d.x += d.vx;
        d.y += d.vy;
        d.age += 1;
        let remove = false;
        if (d.stray) {
          remove = d.age > d.life;
        } else if (d.x >= wall.x) {
          if (d.y > wall.y && d.y < wall.y + wall.h) {
            const s = d.size * 3.2;
            const depth = wall.x + wall.w * (0.06 + Math.random() * 0.88);
            lctx.globalAlpha = 0.34;
            lctx.drawImage(getSprite(d.rgb), depth - s / 2, d.y - s / 2, s, s);
          }
          remove = true;
        } else if (d.y < 0 || d.y > h) {
          remove = true;
        }
        if (remove) {
          drops[i] = drops[drops.length - 1];
          drops.pop();
        }
      }
      lctx.globalAlpha = 1;
      lctx.globalCompositeOperation = "destination-out";
      lctx.fillStyle = "rgba(0,0,0,0.0045)";
      lctx.fillRect(0, 0, w, h);
      lctx.globalCompositeOperation = "source-over";
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      /* Pared de la cabina con la pintura acumulada */
      ctx.save();
      roundRect(ctx, wall.x, wall.y, wall.w, wall.h, 18);
      ctx.fillStyle = "#e9edf3";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(layer, 0, 0, w, h);
      ctx.restore();

      /* Gotas en vuelo y niebla de sobrerrociado */
      for (let i = 0; i < drops.length; i += 1) {
        const d = drops[i];
        if (d.stray) {
          ctx.globalAlpha = (1 - d.age / d.life) * 0.32;
          ctx.drawImage(getSprite(d.rgb), d.x - d.size, d.y - d.size, d.size * 2, d.size * 2);
        } else {
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = `rgb(${d.rgb[0]},${d.rgb[1]},${d.rgb[2]})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, Math.max(0.8, d.size * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      /* Boquilla */
      const n = nozzle();
      const glow = ctx.createRadialGradient(n.x + 16, n.y, 0, n.x + 16, n.y, 34);
      glow.addColorStop(0, "rgba(255,122,0,0.55)");
      glow.addColorStop(1, "rgba(255,122,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(n.x - 24, n.y - 40, 90, 80);
      roundRect(ctx, n.x - 56, n.y - 11, 66, 22, 8);
      ctx.fillStyle = "#2b303c";
      ctx.fill();
      roundRect(ctx, n.x + 6, n.y - 6, 14, 12, 4);
      ctx.fillStyle = "#ff7a00";
      ctx.fill();
    };

    const loop = () => {
      step();
      draw();
      raf = window.requestAnimationFrame(loop);
    };
    const start = () => { if (!running && !reduced && w) { running = true; raf = window.requestAnimationFrame(loop); } };
    const stop = () => { running = false; window.cancelAnimationFrame(raf); };

    const preRender = () => {
      for (let i = 0; i < 260; i += 1) step();
      draw();
    };

    const setTech = (next, fromUser) => {
      key = next;
      tabs.forEach((tab) => {
        const on = tab.dataset.tech === key;
        tab.classList.remove("is-active");
        if (on) { void tab.offsetWidth; tab.classList.add("is-active"); }
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      stage.setAttribute("aria-labelledby", `t-${key}`);
      lctx.globalCompositeOperation = "destination-out";
      lctx.fillStyle = "rgba(0,0,0,0.7)";
      lctx.fillRect(0, 0, w, h);
      lctx.globalCompositeOperation = "source-over";
      if (fromUser) { userPicked = true; window.clearInterval(autoTimer); }
      if (reduced) preRender();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => setTech(tab.dataset.tech, true));
      tab.addEventListener("keydown", (event) => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        let nextIndex = null;
        if (keys[event.key]) nextIndex = (i + keys[event.key] + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        tabs[nextIndex].focus();
        setTech(tabs[nextIndex].dataset.tech, true);
      });
    });

    const startAuto = () => {
      window.clearInterval(autoTimer);
      if (userPicked || reduced) return;
      autoTimer = window.setInterval(() => setTech(order[(order.indexOf(key) + 1) % order.length], false), INTERVAL);
    };

    stage.style.setProperty("--tech-ms", `${INTERVAL}ms`);
    document.documentElement.style.setProperty("--tech-ms", `${INTERVAL}ms`);

    resize();
    window.addEventListener("resize", () => { resize(); if (reduced) preRender(); });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        if (!w) resize();
        /* La barra de progreso de la pestaña arranca sincronizada con el autoavance */
        const active = tabs.find((tab) => tab.dataset.tech === key);
        if (active) { active.classList.remove("is-active"); void active.offsetWidth; active.classList.add("is-active"); }
        start();
        startAuto();
      } else {
        stop();
        window.clearInterval(autoTimer);
      }
    }, { threshold: 0.15 }).observe(stage);

    tabs.forEach((tab) => tab.classList.remove("is-active"));
    setTech("hvlp", false);
    if (reduced) preRender();
  };

  /* ------------------------------------------------------------------ 12 */
  const initCinema = () => {
    const frame = $("#yt-frame");
    if (frame) {
      /* El iframe de YouTube se asigna al acercarse, para no frenar la carga inicial */
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        if (!frame.getAttribute("src")) frame.setAttribute("src", frame.dataset.src);
        observer.disconnect();
      }, { rootMargin: "800px 0px" });
      observer.observe(frame);
    }

    if (!hasGsap || reduced) return;
    const section = $("#resultado");
    const phone = $(".phone", section);
    if (!section || !phone) return;

    gsap.fromTo(".cinema__w--l", { x: () => window.innerWidth * 0.2 }, {
      x: 0, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: 0.6, invalidateOnRefresh: true }
    });
    gsap.fromTo(".cinema__w--r", { x: () => -window.innerWidth * 0.2 }, {
      x: 0, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: 0.6, invalidateOnRefresh: true }
    });
    gsap.fromTo(phone, { rotateX: 26, rotateY: -22, scale: 0.78, y: 140 }, {
      rotateX: 0, rotateY: 0, scale: 1, y: 0, ease: "none",
      scrollTrigger: { trigger: phone, start: "top 96%", end: "top 36%", scrub: 0.7 }
    });
    gsap.from(".cinema__mascot", {
      opacity: 0, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: phone, start: "top 60%", once: true }
    });
  };

  /* ------------------------------------------------------------------ 13 */
  const initGallery = () => {
    const items = $$(".cl__item");

    if (hasGsap && !reduced) {
      items.forEach((item) => {
        const speed = parseFloat(item.dataset.speed || "1");
        const amplitude = (speed - 1) * 260;
        const tile = $(".cl__tile", item);
        const image = $("img", item);

        const media = gsap.matchMedia();
        media.add("(min-width: 900px)", () => {
          gsap.fromTo(item, { y: amplitude }, {
            y: -amplitude, ease: "none",
            scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true }
          });
        });

        gsap.from(tile, {
          clipPath: "inset(100% 0 0 0)", duration: 1.5, ease: "expo.inOut",
          scrollTrigger: { trigger: item, start: "top 90%", once: true }
        });
        gsap.from(image, {
          scale: 1.35, duration: 1.8, ease: "expo.out",
          scrollTrigger: { trigger: item, start: "top 90%", once: true }
        });
      });
    }

    /* Lightbox con <dialog> nativo (foco y Escape incluidos) */
    const dialog = $("#lightbox");
    if (!dialog || typeof dialog.showModal !== "function") return;

    const slides = $$(".cl__btn").map((button) => {
      const img = $("img", button);
      return { src: img.currentSrc || img.src, alt: img.alt };
    });
    const image = $("#lb-img");
    const caption = $("#lb-caption");
    const counter = $("#lb-current");
    const total = $("#lb-total");
    let index = 0;

    const render = () => {
      const slide = slides[index];
      image.classList.remove("is-loaded");
      const preload = new Image();
      const apply = () => {
        image.src = slide.src;
        image.alt = slide.alt;
        window.requestAnimationFrame(() => image.classList.add("is-loaded"));
      };
      preload.onload = apply;
      preload.onerror = apply;
      preload.src = slide.src;
      caption.textContent = slide.alt;
      counter.textContent = String(index + 1);
      total.textContent = String(slides.length);
    };
    const step = (delta) => {
      index = (index + delta + slides.length) % slides.length;
      render();
    };

    $$("[data-lightbox]").forEach((button) => button.addEventListener("click", () => {
      index = Number(button.dataset.lightbox);
      render();
      dialog.showModal();
      body.classList.add("is-locked");
      lenis?.stop();
    }));
    $("#lb-close").addEventListener("click", () => dialog.close());
    $("#lb-prev").addEventListener("click", () => step(-1));
    $("#lb-next").addEventListener("click", () => step(1));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => { body.classList.remove("is-locked"); lenis?.start(); });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });
  };

  /* ------------------------------------------------------------------ 14 */
  const initFaq = () => {
    const items = $$(".qa");
    items.forEach((item) => {
      const button = $("button", item);
      button?.addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        items.forEach((other) => {
          const isTarget = other === item && open;
          other.classList.toggle("is-open", isTarget);
          $("button", other)?.setAttribute("aria-expanded", String(isTarget));
        });
        if (hasGsap) window.setTimeout(() => ScrollTrigger.refresh(), 900);
      });
    });
  };

  /* ------------------------------------------------------------------ 15 */
  const initForm = () => {
    const form = $("#contact-form");
    if (!form) return;

    const fields = {
      nombre: { el: $("#f-nombre"), error: $("#e-nombre"), check: (v) => (v.trim().length >= 2 ? "" : "Escribe tu nombre para saber con quién hablamos.") },
      equipo: { el: $("#f-equipo"), error: $("#e-equipo"), check: (v) => (v ? "" : "Elige el equipo que te interesa.") },
      mensaje: { el: $("#f-mensaje"), error: $("#e-mensaje"), check: (v) => (v.trim().length >= 8 ? "" : "Cuéntanos un poco más sobre lo que vas a pintar.") }
    };

    const setError = (field, message) => {
      field.error.textContent = message;
      field.el.closest(".field").classList.toggle("is-invalid", Boolean(message));
      field.el.setAttribute("aria-invalid", message ? "true" : "false");
    };

    Object.values(fields).forEach((field) => {
      const refresh = () => { if (field.error.textContent) setError(field, field.check(field.el.value)); };
      field.el.addEventListener("input", refresh);
      field.el.addEventListener("change", refresh);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let firstInvalid = null;
      Object.values(fields).forEach((field) => {
        const message = field.check(field.el.value);
        setError(field, message);
        if (message && !firstInvalid) firstInvalid = field.el;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const sector = form.querySelector('input[name="sector"]:checked');
      const lines = [
        `Hola, soy ${fields.nombre.el.value.trim()}.`,
        `Me interesa: ${fields.equipo.el.value}.`
      ];
      if (sector) lines.push(`Trabajo en: ${sector.value}.`);
      lines.push(`Lo que voy a pintar: ${fields.mensaje.el.value.trim()}`);
      const url = waLink(lines.join("\n"));

      const ok = $("#form-ok");
      const okLink = $("#form-ok-link");
      if (okLink) okLink.href = url;
      if (ok) ok.hidden = false;

      const opener = document.createElement("a");
      opener.href = url;
      opener.target = "_blank";
      opener.rel = "noopener";
      body.appendChild(opener);
      opener.click();
      opener.remove();
    });
  };

  /* ------------------------------------------------------------------ 16 */
  const initFab = () => {
    const fab = $(".fab");
    if (!fab || reduced) return;
    /* La etiqueta se muestra una vez, al pasar el hero, para no tapar el nombre del producto */
    const expand = () => {
      fab.classList.add("is-expanded");
      window.setTimeout(() => fab.classList.remove("is-expanded"), 6500);
    };
    onReady(() => {
      if (hasGsap) ScrollTrigger.create({ trigger: "#nosotros", start: "top 55%", once: true, onEnter: expand });
      else window.setTimeout(expand, 6000);
    });
  };

  /* ------------------------------------------------------------------ INIT */
  /* El orden importa: ScrollTrigger calcula posiciones en el orden de creación */
  [
    initLinks, initLoader, initSmooth, initHeader, initReveal, initHero, initManifesto,
    initShowcase, initStack, initLab, initCinema, initGallery, initFaq, initForm, initFab
  ].forEach((init) => {
    try {
      init();
    } catch (error) {
      console.error(`[init] ${init.name}`, error);
    }
  });

  if (hasGsap) {
    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
