// HTML overlay layer that sits on top of the 3D canvas:
// terminal boot loader, hero typewriter, top-nav wiring, and the project
// detail panel. Keeps all the zsh personality in accessible DOM.

import { introScript, projects, sections } from "../data/content.js";

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
    "booting 3d-site...",
    "loading geometry [########]",
    "compiling shaders...",
    "linking stations [6/6]",
    "ready.",
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

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const index = stationIndexFor(link.dataset.station);
      if (index < 0) return; // let real links (resume) pass through
      e.preventDefault();
      world.navigateTo(index);
    });
  });

  world.onStationChange((index) => {
    const id = stationIdFor(index);
    links.forEach((l) =>
      l.toggleAttribute("data-current", l.dataset.station === id)
    );
    if (indicatorEl) indicatorEl.textContent = `station ${index + 1}/6 · ${id}`;
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
