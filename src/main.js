// Entry point. Boots into the retro 3D museum (boot screen → entrance →
// walkable museum) or the accessible static 2D site. Three.js is imported
// lazily so it never loads on the 2D path.

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
  canvas: document.getElementById("scene-canvas"),
  labelLayer: document.getElementById("label-layer"),
  loader: document.getElementById("loader"),
  entrance: document.getElementById("entrance"),
  enter: document.getElementById("enter-museum"),
  viewSimple: document.getElementById("view-simple"),
  panel: document.getElementById("inspect-panel"),
  backdrop: document.getElementById("panel-backdrop"),
  roomName: document.getElementById("room-name"),
  prompt: document.getElementById("interact-prompt"),
  menu: document.getElementById("museum-menu"),
  menuToggle: document.getElementById("menu-toggle"),
  fullscreen: document.getElementById("fullscreen-toggle"),
  sound: document.getElementById("sound-toggle"),
  go2d: document.getElementById("go-2d"),
  go3d: document.getElementById("go-3d"),
  srSwitch: document.getElementById("sr-switch-2d"),
};

let museum = null;
let museumStarted = false;
let staticInited = false;

function show2D() {
  if (els.loader) els.loader.hidden = true;
  if (els.entrance) els.entrance.hidden = true;
  document.body.classList.remove("mode-3d", "in-museum");
  document.body.classList.add("mode-2d");
  if (!staticInited) {
    initStaticSite(document);
    staticInited = true;
  }
}

// Reveal the entrance screen (running the boot sequence the first time).
async function showEntrance({ boot } = {}) {
  document.body.classList.remove("mode-2d");
  document.body.classList.add("mode-3d");
  const { runBoot } = await import("./ui/overlay.js");
  if (boot) await runBoot(els.loader);
  else if (els.loader) els.loader.hidden = true;
  if (els.entrance) els.entrance.hidden = false;
}

async function enterMuseum() {
  if (museumStarted) return;
  if (els.entrance) els.entrance.hidden = true;
  document.body.classList.remove("mode-2d");
  document.body.classList.add("mode-3d", "in-museum");

  const { createInspectPanel, wireMuseumHud } = await import("./ui/overlay.js");
  const { createMuseum } = await import("./three/museum.js");

  museum = createMuseum(els.canvas, els.labelLayer, {
    reducedMotion: prefersReducedMotion,
  });
  createInspectPanel(museum, { panelEl: els.panel, backdropEl: els.backdrop });
  wireMuseumHud(museum, {
    roomName: els.roomName,
    prompt: els.prompt,
    menu: els.menu,
    menuToggle: els.menuToggle,
    fullscreen: els.fullscreen,
    sound: els.sound,
  });
  museum.start();
  museumStarted = true;
}

// ── wiring ────────────────────────────────────
const webgl = hasWebGL();

els.enter?.addEventListener("click", () => enterMuseum());
els.viewSimple?.addEventListener("click", () => show2D());
els.go2d?.addEventListener("click", (e) => {
  e.preventDefault();
  show2D();
});
els.srSwitch?.addEventListener("click", () => show2D());
if (els.go3d) {
  els.go3d.addEventListener("click", (e) => {
    e.preventDefault();
    if (!museumStarted) showEntrance({ boot: false });
  });
  els.go3d.hidden = !webgl; // only offer "enter 3d" when usable
}

// ── mode selection ────────────────────────────
if (!webgl) {
  show2D();
  if (els.go2d) els.go2d.hidden = true;
} else if (prefersReducedMotion) {
  // Respect reduced motion: default to the static site, allow opting in.
  show2D();
} else {
  showEntrance({ boot: true });
}
