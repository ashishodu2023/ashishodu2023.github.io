(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* Nav scroll state */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      });
    });
  }

  /* Section fade-up */
  const animated = document.querySelectorAll("[data-animate]");
  if (prefersReducedMotion) {
    animated.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    animated.forEach((el) => io.observe(el));
  } else {
    animated.forEach((el) => el.classList.add("is-visible"));
  }

  /* Hero agent-graph canvas */
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes = [];
  let edges = [];
  let frameId = 0;
  let running = !prefersReducedMotion;

  const NODE_COUNT = 28;
  const TEAL = "61, 186, 156";
  const COPPER = "196, 122, 90";

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initGraph();
  }

  function initGraph() {
    nodes = [];
    edges = [];
    const pad = 40;
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: pad + Math.random() * (width - pad * 2),
        y: pad + Math.random() * (height - pad * 2),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 2 + Math.random() * 2.5,
        pulse: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.7 ? COPPER : TEAL,
      });
    }
    for (let i = 0; i < nodes.length; i++) {
      const links = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < links; j++) {
        const k = Math.floor(Math.random() * nodes.length);
        if (k !== i) edges.push([i, k]);
      }
    }
  }

  function step() {
    const linkDist = Math.min(width, height) * 0.22;
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 30 || n.x > width - 30) n.vx *= -1;
      if (n.y < 30 || n.y > height - 30) n.vy *= -1;
      n.pulse += 0.02;
    }
    ctx.clearRect(0, 0, width, height);

    for (const [a, b] of edges) {
      const n1 = nodes[a];
      const n2 = nodes[b];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.hypot(dx, dy);
      if (dist > linkDist) continue;
      const alpha = (1 - dist / linkDist) * 0.35;
      ctx.strokeStyle = `rgba(${TEAL}, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }

    for (const n of nodes) {
      const glow = 0.5 + 0.5 * Math.sin(n.pulse);
      ctx.fillStyle = `rgba(${n.hue}, ${0.35 + glow * 0.45})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + glow * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (running) frameId = requestAnimationFrame(step);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    const linkDist = Math.min(width, height) * 0.22;
    for (const [a, b] of edges) {
      const n1 = nodes[a];
      const n2 = nodes[b];
      const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      if (dist > linkDist) continue;
      const alpha = (1 - dist / linkDist) * 0.25;
      ctx.strokeStyle = `rgba(${TEAL}, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${n.hue}, 0.55)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (!running) drawStatic();
  });

  if (running) {
    step();
  } else {
    drawStatic();
  }

  document.addEventListener("visibilitychange", () => {
    if (prefersReducedMotion) return;
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frameId);
    } else {
      running = true;
      step();
    }
  });
})();
