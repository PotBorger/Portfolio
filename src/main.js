// Entry point. Decides between the immersive 3D world and the static 2D
// site, then wires whichever mode is active. Three.js is imported lazily so
// it never loads on the 2D path.

import "../styles.css";
import { initStaticSite } from "./ui/static-site.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

const els = {
  app: document.getElementById("app-3d"),
  canvas: document.getElementById("scene-canvas"),
  labelLayer: document.getElementById("label-layer"),
  loader: document.getElementById("loader"),
  typer: document.getElementById("typer"),
  nav: document.getElementById("scene-nav"),
  indicator: document.getElementById("station-indicator"),
  panel: document.getElementById("project-panel"),
  backdrop: document.getElementById("panel-backdrop"),
  kbdList: document.getElementById("kbd-projects"),
  staticSite: document.getElementById("static-site"),
  go2d: document.getElementById("go-2d"),
  go3d: document.getElementById("go-3d"),
  srSwitch: document.getElementById("sr-switch-2d"),
};

let worldStarted = false;

let staticInited = false;

function show2D() {
  if (els.loader) els.loader.hidden = true;
  document.body.classList.remove("mode-3d");
  document.body.classList.add("mode-2d");
  // Visibility is driven by the body class in CSS; just wire behaviour once.
  if (!staticInited) {
    initStaticSite(document);
    staticInited = true;
  }
}

async function start3D() {
  document.body.classList.remove("mode-2d");
  document.body.classList.add("mode-3d");

  const {
    runLoader,
    runTypewriter,
    wireNav,
    createProjectPanel,
    buildKeyboardProjects,
  } = await import("./ui/overlay.js");
  const { createWorld } = await import("./three/world.js");

  await runLoader(els.loader);

  const world = createWorld(els.canvas, els.labelLayer, {
    reducedMotion: prefersReducedMotion,
  });

  wireNav(world, { navEl: els.nav, indicatorEl: els.indicator });
  const panel = createProjectPanel(world, {
    panelEl: els.panel,
    backdropEl: els.backdrop,
  });
  buildKeyboardProjects(world, els.kbdList, panel.open);

  world.start();
  worldStarted = true;
  runTypewriter(els.typer);
}

// ── mode selection ────────────────────────────
const webgl = hasWebGL();

if (els.go2d) {
  els.go2d.addEventListener("click", (e) => {
    e.preventDefault();
    show2D();
  });
}
// SR-only affordance: lets screen-reader / keyboard users jump to 2D before
// the 3D canvas (WCAG 1.3.1, 2.4.1).
if (els.srSwitch) {
  els.srSwitch.addEventListener("click", () => show2D());
}
if (els.go3d) {
  els.go3d.addEventListener("click", (e) => {
    e.preventDefault();
    if (!worldStarted) start3D();
  });
  // Only offer "enter 3D" when it's actually available.
  els.go3d.hidden = !webgl;
}

if (!webgl) {
  // No WebGL → static site is the only option.
  show2D();
  if (els.go2d) els.go2d.hidden = true;
} else if (prefersReducedMotion) {
  // Respect reduced motion: default to static, allow opting into 3D.
  show2D();
} else {
  start3D();
}
