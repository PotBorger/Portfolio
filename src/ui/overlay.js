// HTML overlay layer that sits on top of the 3D canvas:
// terminal boot loader, hero typewriter, top-nav wiring, and the project
// detail panel. Keeps all the zsh personality in accessible DOM.

import { introScript, projects, sections, wings, exhibitMeta } from "../data/content.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ── terminal typewriter (ported from the original script.js) ──
function appendLine({ type, text }, container) {
  const line = document.createElement("p");
  line.className = "line";

  if (type === "blank") {
    line.innerHTML = "&nbsp;";
    container.appendChild(line);
    return Promise.resolve();
  }

  if (type === "cmd") {
    const prompt = document.createElement("span");
    prompt.textContent = "$ ";
    prompt.className = "out-line";
    line.appendChild(prompt);
    line.classList.add("cmd-line");
  } else if (type === "dim") {
    line.classList.add("dim-line");
  } else {
    line.classList.add("out-line");
  }

  container.appendChild(line);

  if (prefersReducedMotion) {
    line.appendChild(document.createTextNode(text));
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let i = 0;
    const speed = type === "cmd" ? 28 : type === "dim" ? 12 : 16;
    const tick = () => {
      if (i >= text.length) return resolve();
      line.appendChild(document.createTextNode(text.charAt(i)));
      i += 1;
      setTimeout(tick, speed + Math.random() * 18);
    };
    setTimeout(tick, type === "cmd" ? 220 : 60);
  });
}

export async function runTypewriter(typer) {
  if (!typer) return;
  typer.innerHTML = "";
  const cursorLine = document.createElement("p");
  cursorLine.className = "line cmd-line";
  cursorLine.innerHTML =
    '<span class="out-line">$ </span><span class="term-cursor">&nbsp;</span>';
  for (const step of introScript) {
    await appendLine(step, typer);
  }
  typer.appendChild(cursorLine);
}

// ── terminal boot loader ──────────────────────
export function runLoader(loaderEl) {
  if (!loaderEl) return Promise.resolve();
  const log = loaderEl.querySelector(".loader-log");
  const steps = [
    "opening the museum...",
    "uncrating exhibits [########]",
    "calibrating gallery lights...",
    "linking halls [6/6]",
    "doors open.",
  ];

  return new Promise((resolve) => {
    const finish = () => {
      setTimeout(
        () => {
          loaderEl.classList.add("is-done");
          setTimeout(() => {
            loaderEl.hidden = true;
            resolve();
          }, 500);
        },
        prefersReducedMotion ? 0 : 400
      );
    };

    if (prefersReducedMotion) {
      log.textContent = steps.join("\n");
      finish();
      return;
    }

    let i = 0;
    const next = () => {
      if (i >= steps.length) return finish();
      const p = document.createElement("p");
      p.textContent = `$ ${steps[i]}`;
      log.appendChild(p);
      i += 1;
      setTimeout(next, 280);
    };
    next();
  });
}

// ── top-nav → camera station ──────────────────
// Stations are: 0 hero, then the content sections in order.
function stationIndexFor(id) {
  if (id === "hero" || id === "top") return 0;
  const i = sections.findIndex((s) => s.id === id);
  return i < 0 ? -1 : i + 1;
}
function stationIdFor(index) {
  if (index <= 0) return "hero";
  return sections[index - 1]?.id ?? "hero";
}

export function wireNav(world, { navEl, indicatorEl }) {
  const links = [...navEl.querySelectorAll("a[data-station]")];
  const mapNodes = [...document.querySelectorAll(".hud-map-node")];

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const index = stationIndexFor(link.dataset.station);
      if (index < 0) return; // let real links (resume) pass through
      e.preventDefault();
      world.navigateTo(index);
    });
  });

  // Make Map HUD nodes interactive + accessible, and color-code them per hall.
  mapNodes.forEach((node) => {
    const wing = wings[node.dataset.mapStation];
    if (wing) {
      node.textContent = `${wing.hall} · ${wing.short}`;
      node.style.setProperty("--hall-gel", wing.gel);
      node.setAttribute(
        "aria-label",
        `Go to Hall ${wing.hall}, ${wing.name}`
      );
    }
    node.setAttribute("role", "button");
    node.setAttribute("tabindex", "0");

    const clickHandler = () => {
      const index = stationIndexFor(node.dataset.mapStation);
      if (index >= 0) world.navigateTo(index);
    };

    node.addEventListener("click", clickHandler);
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        clickHandler();
      }
    });
  });

  world.onStationChange((index) => {
    const id = stationIdFor(index);
    links.forEach((l) =>
      l.toggleAttribute("data-current", l.dataset.station === id)
    );
    
    // Toggle active state on Map HUD nodes
    mapNodes.forEach((node) => {
      node.classList.toggle("is-active", node.dataset.mapStation === id);
    });

    if (indicatorEl) {
      const wing = wings[id];
      indicatorEl.innerHTML = "";
      indicatorEl.append(document.createTextNode("hall "));
      const num = document.createElement("span");
      num.className = "indicator-hall";
      num.textContent = `${wing?.hall ?? index} · ${wing?.name ?? id}`;
      if (wing) num.style.color = wing.gel;
      indicatorEl.append(num);
    }
    // The hero terminal overlay only belongs to the hero station.
    document.body.classList.toggle("off-hero", index !== 0);
    // The contact links overlay only belongs to the contact station (last).
    document.body.classList.toggle("at-contact", id === "contact");
  });
}

// ── project detail panel ──────────────────────
export function createProjectPanel(world, { panelEl, backdropEl }) {
  const body = panelEl.querySelector(".panel-body");
  const closeBtn = panelEl.querySelector(".panel-close");
  let lastFocus = null;

  function render(project) {
    body.innerHTML = "";

    const head = document.createElement("div");
    head.className = "panel-head";
    head.innerHTML = `<span class="panel-cmd">$ cat</span> <span class="panel-file"></span>`;
    head.querySelector(".panel-file").textContent = project.file;
    body.appendChild(head);

    const meta = document.createElement("p");
    meta.className = "panel-meta";
    meta.textContent = project.meta;
    body.appendChild(meta);

    const summary = document.createElement("p");
    summary.className = "panel-summary";
    summary.textContent = project.summary;
    body.appendChild(summary);

    if (project.points?.length) {
      const ul = document.createElement("ul");
      ul.className = "panel-list";
      for (const point of project.points) {
        const li = document.createElement("li");
        li.textContent = point;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }

    if (project.tag) {
      const tag = document.createElement("span");
      tag.className = "panel-tag";
      tag.textContent = project.tag;
      body.appendChild(tag);
    }

    if (project.links?.length) {
      const actions = document.createElement("div");
      actions.className = "panel-actions";
      for (const link of project.links) {
        const a = document.createElement("a");
        a.className = "panel-link";
        a.href = link.href;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = link.label;
        actions.appendChild(a);
      }
      body.appendChild(actions);
    }
  }

  function open(project) {
    render(project);
    lastFocus = document.activeElement;
    panelEl.hidden = false;
    backdropEl.hidden = false;
    requestAnimationFrame(() => {
      panelEl.classList.add("is-open");
      backdropEl.classList.add("is-open");
    });
    closeBtn.focus();
  }

  function close() {
    panelEl.classList.remove("is-open");
    backdropEl.classList.remove("is-open");
    world.focusProject(null);
    const done = () => {
      panelEl.hidden = true;
      backdropEl.hidden = true;
      panelEl.removeEventListener("transitionend", done);
    };
    panelEl.addEventListener("transitionend", done);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  // Focus trap: keep Tab cycling within the open dialog (WCAG 2.1.2).
  document.addEventListener("keydown", (e) => {
    if (panelEl.hidden) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    const focusable = [
      ...panelEl.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  closeBtn.addEventListener("click", close);
  backdropEl.addEventListener("click", close);

  world.onProjectActivate(open);
  return { open, close };
}

// Hidden keyboard-navigable list so the 3D project solids are reachable
// without a mouse. `openPanel` is the panel.open returned above.
export function buildKeyboardProjects(world, listEl, openPanel) {
  listEl.innerHTML = "";
  projects.forEach((project) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kbd-project";
    btn.textContent = `${project.file} — ${project.meta}`;
    btn.addEventListener("click", () => {
      world.navigateTo(2);
      world.focusProject(project.id);
      openPanel(project);
    });
    listEl.appendChild(btn);
  });
}

// ── retro museum UI ───────────────────────────────────
// Boot sequence shown before the entrance screen.
export function runBoot(loaderEl) {
  if (!loaderEl) return Promise.resolve();
  const log = loaderEl.querySelector(".loader-log");
  const steps = [
    "initializing museum systems...",
    "loading archived technology [########]",
    "mounting project exhibits...",
    "calibrating crt displays...",
    "powering on. welcome.",
  ];
  return new Promise((resolve) => {
    const finish = () =>
      setTimeout(
        () => {
          loaderEl.classList.add("is-done");
          setTimeout(() => {
            loaderEl.hidden = true;
            resolve();
          }, 450);
        },
        prefersReducedMotion ? 0 : 350
      );
    if (prefersReducedMotion) {
      log.textContent = steps.join("\n");
      finish();
      return;
    }
    let i = 0;
    const next = () => {
      if (i >= steps.length) return finish();
      const p = document.createElement("p");
      p.textContent = `> ${steps[i]}`;
      log.appendChild(p);
      i += 1;
      setTimeout(next, 300);
    };
    next();
  });
}

// Exhibit inspection panel styled as a CRT/OS window. Renders an exhibit's
// project record (merged with exhibitMeta). Closing resumes the rail.
export function createInspectPanel(museum, { panelEl, backdropEl }) {
  const body = panelEl.querySelector(".panel-body");
  const closeBtn = panelEl.querySelector(".panel-close");
  let lastFocus = null;

  function render(project) {
    const meta = exhibitMeta[project.id] || {};
    body.innerHTML = "";

    const head = document.createElement("div");
    head.className = "crt-head";
    head.innerHTML = `<span class="crt-prompt">C:\\EXHIBITS\\></span> <span class="crt-file"></span>`;
    head.querySelector(".crt-file").textContent = project.file;
    body.appendChild(head);

    const title = document.createElement("h2");
    title.className = "crt-title";
    title.textContent = project.file.replace(/\.md$/, "").replace(/-/g, " ");
    body.appendChild(title);

    if (meta.subtitle) {
      const s = document.createElement("p");
      s.className = "crt-sub";
      s.textContent = meta.subtitle;
      body.appendChild(s);
    }

    const facts = document.createElement("dl");
    facts.className = "crt-facts";
    const addFact = (k, v) => {
      if (!v) return;
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      facts.append(dt, dd);
    };
    addFact("tech", project.meta);
    addFact("role", meta.role);
    addFact("year", meta.year);
    addFact("status", meta.status || project.tag);
    body.appendChild(facts);

    const summary = document.createElement("p");
    summary.className = "crt-summary";
    summary.textContent = project.summary;
    body.appendChild(summary);

    if (project.points?.length) {
      const ul = document.createElement("ul");
      ul.className = "crt-list";
      for (const point of project.points) {
        const li = document.createElement("li");
        li.textContent = point;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }

    if (project.links?.length) {
      const actions = document.createElement("div");
      actions.className = "crt-actions";
      for (const link of project.links) {
        const a = document.createElement("a");
        a.className = "crt-link";
        a.href = link.href;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = `▸ ${link.label}`;
        actions.appendChild(a);
      }
      body.appendChild(actions);
    }
  }

  function open(project) {
    render(project);
    lastFocus = document.activeElement;
    panelEl.hidden = false;
    backdropEl.hidden = false;
    requestAnimationFrame(() => {
      panelEl.classList.add("is-open");
      backdropEl.classList.add("is-open");
    });
    closeBtn.focus();
  }

  function close() {
    panelEl.classList.remove("is-open");
    backdropEl.classList.remove("is-open");
    museum.closeInspect();
    const done = () => {
      panelEl.hidden = true;
      backdropEl.hidden = true;
      panelEl.removeEventListener("transitionend", done);
    };
    panelEl.addEventListener("transitionend", done);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.addEventListener("keydown", (e) => {
    if (panelEl.hidden) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    const focusable = [
      ...panelEl.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  closeBtn.addEventListener("click", close);
  backdropEl.addEventListener("click", close);
  museum.onInspect(open);
  return { open, close };
}

// In-museum HUD: room name, interaction prompt, directory menu, fullscreen,
// and a sound toggle stub (audio wired in a later pass).
export function wireMuseumHud(museum, els) {
  const menuButtons = els.menu ? [...els.menu.querySelectorAll("[data-room]")] : [];

  museum.onRoomChange((room) => {
    if (els.roomName) els.roomName.textContent = room.name;
    menuButtons.forEach((b) =>
      b.classList.toggle("is-current", b.dataset.room === room.id)
    );
  });

  museum.onProximity((project) => {
    if (els.prompt) els.prompt.hidden = !project;
  });

  function closeMenu() {
    els.menu?.classList.remove("is-open");
    els.menuToggle?.setAttribute("aria-expanded", "false");
  }
  function openMenu() {
    els.menu?.classList.add("is-open");
    els.menuToggle?.setAttribute("aria-expanded", "true");
  }
  menuButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      museum.goToRoom(btn.dataset.room);
      closeMenu();
    });
  });
  if (els.menuToggle) {
    els.menuToggle.addEventListener("click", () => {
      if (els.menu?.classList.contains("is-open")) closeMenu();
      else openMenu();
    });
  }

  if (els.fullscreen) {
    els.fullscreen.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  // Sound toggle is a stub for now — audio manager lands in a later pass.
  if (els.sound) {
    let on = false;
    els.sound.addEventListener("click", () => {
      on = !on;
      els.sound.setAttribute("aria-pressed", String(on));
      els.sound.textContent = on ? "♪ sound on" : "♪ sound off";
    });
  }
}
