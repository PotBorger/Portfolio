// The "Blueprint Space" 3D world: scene, camera rig, stations, interaction.
//
// Public surface (see createWorld):
//   world.start()                 begin the render loop
//   world.navigateTo(index)       eased camera tween to a station
//   world.onProjectActivate(fn)   fn(project) when a solid is clicked
//   world.onStationChange(fn)     fn(index) when the active station changes
//   world.focusProject(id|null)   dolly toward a project / release
//   world.dispose()

import * as THREE from "three";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import {
  palette,
  blueprintSolid,
  gridFloor,
  dust,
  node,
  connector,
  ring,
} from "./objects.js";
import {
  about,
  projects,
  experience,
  stack,
  contact,
} from "../data/content.js";

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Per-station camera framing. focus = look-at point; the camera sits at
// focus + spherical(radius, theta, phi). Stations march down -Z.
function buildStations() {
  return [
    { id: "hero", focus: new THREE.Vector3(0, 0, 0), radius: 11, theta: 0, phi: Math.PI / 2 },
    { id: "about", focus: new THREE.Vector3(0, 0, -26), radius: 9, theta: 0.35, phi: 1.45 },
    { id: "projects", focus: new THREE.Vector3(0, 0, -54), radius: 13, theta: 0, phi: 1.5 },
    { id: "experience", focus: new THREE.Vector3(0, 0, -86), radius: 15, theta: -0.2, phi: 1.42 },
    { id: "stack", focus: new THREE.Vector3(0, 1, -116), radius: 12, theta: 0.3, phi: 1.36 },
    { id: "contact", focus: new THREE.Vector3(0, 0, -142), radius: 9, theta: 0, phi: 1.5 },
  ];
}

function makeLabel(text, className) {
  const el = document.createElement("div");
  el.className = `scene-label ${className || ""}`.trim();
  el.textContent = text;
  return new CSS2DObject(el);
}

export function createWorld(canvas, labelLayer, options = {}) {
  const reducedMotion = !!options.reducedMotion;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.void);
  scene.fog = new THREE.Fog(palette.void, 18, 90);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    600
  );

  // Coarse pointer (touch) or narrow viewport = mobile / low-power device.
  const isLowEnd =
    window.matchMedia("(pointer: coarse)").matches ||
    window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isLowEnd,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const labelRenderer = new CSS2DRenderer({ element: labelLayer });
  labelRenderer.setSize(window.innerWidth, window.innerHeight);

  // Postprocessing: bloom on capable devices only. Skipping it on mobile saves
  // one full-resolution render-target read + write per frame.
  let composer = null;
  if (!isLowEnd) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.55, // strength
      0.7,  // radius
      0.85  // threshold
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ── lighting ──────────────────────────────
  scene.add(new THREE.AmbientLight(palette.navy, 1.2));
  const key = new THREE.DirectionalLight(palette.light, 1.6);
  key.position.set(6, 10, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(palette.accent, 1.1);
  rim.position.set(-8, -4, -6);
  scene.add(rim);

  // ── static environment ────────────────────
  scene.add(gridFloor());
  const dustField = dust(isLowEnd ? 120 : 260);
  scene.add(dustField);

  // ── stations + content ────────────────────
  const stations = buildStations();
  const projectMeshes = []; // { id, group, project }
  const animated = []; // objects with per-frame spin
  const labels = []; // CSS2D labels, culled by distance each frame

  // makeLabel + register for distance culling.
  const mk = (text, className) => {
    const label = makeLabel(text, className);
    labels.push(label);
    return label;
  };

  // Hero: a slowly rotating wireframe monolith (the ASCII name is an HTML
  // overlay anchored separately in the DOM, keeping the terminal identity).
  const heroGroup = new THREE.Group();
  const heroSolid = blueprintSolid("icosahedron", "#60a5fa");
  heroSolid.scale.setScalar(2.4);
  heroGroup.add(heroSolid);
  heroGroup.position.copy(stations[0].focus);
  scene.add(heroGroup);
  animated.push({ obj: heroSolid, sx: 0.08, sy: 0.12 });

  // About: one large readable solid + label.
  const aboutSolid = blueprintSolid("dodecahedron", "#3b82f6");
  aboutSolid.scale.setScalar(2.6);
  aboutSolid.position.copy(stations[1].focus);
  scene.add(aboutSolid);
  aboutSolid.add(mk(about.lead, "label-lead"));
  animated.push({ obj: aboutSolid, sx: 0.05, sy: -0.07 });

  // Work: 7 project solids in a gentle arc facing the camera.
  const workFocus = stations[2].focus;
  const arc = Math.PI * 0.9;
  projects.forEach((project, i) => {
    const group = blueprintSolid(project.shape, project.accent);
    const t = projects.length === 1 ? 0.5 : i / (projects.length - 1);
    const angle = -arc / 2 + arc * t;
    const r = 7.5;
    group.position.set(
      workFocus.x + Math.sin(angle) * r,
      workFocus.y + Math.cos(angle) * 2.2 - 0.5,
      workFocus.z + Math.cos(angle) * r * 0.45 + 1
    );
    group.userData.home = group.position.clone();
    group.userData.project = project;

    const label = mk(`[ ${project.file} ]`, "label-callout");
    label.position.set(0, 1.7, 0);
    group.add(label);
    group.userData.label = label;

    scene.add(group);
    projectMeshes.push({ id: project.id, group, project });
    animated.push({ obj: group, sx: 0.12 + i * 0.01, sy: 0.16 - i * 0.008 });
  });

  // Experience: nodes along a descending glowing line.
  const expFocus = stations[3].focus;
  let prevPoint = null;
  experience.forEach((role, i) => {
    const p = new THREE.Vector3(
      expFocus.x - 4.5 + i * 2.25,
      expFocus.y + 2.2 - i * 1.1,
      expFocus.z + 3 - i * 1.5
    );
    const n = node(i === 0 ? "#60a5fa" : "#3b82f6", i === 0 ? 0.5 : 0.4);
    n.position.copy(p);
    scene.add(n);
    const label = mk(role.role, "label-node");
    label.position.set(0, 0.9, 0);
    n.add(label);
    if (prevPoint) scene.add(connector(prevPoint, p, "#3b82f6"));
    prevPoint = p;
    animated.push({ obj: n, sx: 0, sy: 0.3 });
  });

  // Stack: concentric rings, one per layer, with labels.
  const stackFocus = stations[4].focus;
  const stackGroup = new THREE.Group();
  stackGroup.position.copy(stackFocus);
  stack.forEach((row, i) => {
    const r = ring(1.4 + i * 1.1, i % 2 === 0 ? "#3b82f6" : "#60a5fa");
    stackGroup.add(r);
    const label = mk(`${row.label} → ${row.value}`, "label-stack");
    label.position.set(0, 0.6 + i * 0.6, 0);
    stackGroup.add(label);
  });
  scene.add(stackGroup);
  animated.push({ obj: stackGroup, sx: 0, sy: 0.06 });

  // Contact: a beacon node.
  const contactFocus = stations[5].focus;
  const beacon = node("#60a5fa", 1.1);
  beacon.position.copy(contactFocus);
  beacon.add(mk(contact.lead, "label-lead"));
  scene.add(beacon);
  animated.push({ obj: beacon, sx: 0.1, sy: 0.1 });

  // ── camera rig state (spherical around focus) ──
  const rig = {
    focus: stations[0].focus.clone(),
    radius: stations[0].radius,
    theta: stations[0].theta,
    phi: stations[0].phi,
  };
  // Drag offsets layered on top of the station framing.
  const drag = { theta: 0, phi: 0, active: false, lastX: 0, lastY: 0 };
  const pointer = new THREE.Vector2(0, 0); // idle parallax (-1..1)

  let tween = null; // { from, to, t, dur }
  let activeStation = 0;
  let focusedProjectId = null;

  const activateListeners = [];
  const stationListeners = [];

  function applyCamera() {
    const theta = rig.theta + drag.theta + pointer.x * 0.12;
    const phi = THREE.MathUtils.clamp(
      rig.phi + drag.phi - pointer.y * 0.08,
      0.6,
      Math.PI - 0.4
    );
    const r = rig.radius;
    camera.position.set(
      rig.focus.x + r * Math.sin(phi) * Math.sin(theta),
      rig.focus.y + r * Math.cos(phi),
      rig.focus.z + r * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(rig.focus);
  }
  applyCamera();

  function navigateTo(index) {
    const clamped = THREE.MathUtils.clamp(index, 0, stations.length - 1);
    const s = stations[clamped];
    if (!s) return;
    focusedProjectId = null;
    drag.theta = 0;
    drag.phi = 0;
    tween = {
      from: {
        focus: rig.focus.clone(),
        radius: rig.radius,
        theta: rig.theta,
        phi: rig.phi,
      },
      to: { focus: s.focus.clone(), radius: s.radius, theta: s.theta, phi: s.phi },
      t: 0,
      dur: reducedMotion ? 0.001 : 1.2,
    };
    activeStation = clamped;
    stationListeners.forEach((fn) => fn(clamped));
  }

  function focusProject(id) {
    const entry = projectMeshes.find((p) => p.id === id);
    if (!entry) {
      focusedProjectId = null;
      navigateTo(2);
      return;
    }
    focusedProjectId = id;
    const target = entry.group.position;
    tween = {
      from: {
        focus: rig.focus.clone(),
        radius: rig.radius,
        theta: rig.theta,
        phi: rig.phi,
      },
      to: { focus: target.clone(), radius: 4.5, theta: rig.theta, phi: 1.5 },
      t: 0,
      dur: reducedMotion ? 0.001 : 0.9,
    };
  }

  // ── interaction: hover + click on project solids ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;
  let lastRayTime = 0; // throttle raycasting to ~30 fps max

  function pickProject(clientX, clientY) {
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(
      projectMeshes.map((p) => p.group),
      true
    );
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && !obj.userData.project) obj = obj.parent;
    return obj || null;
  }

  function setHover(group) {
    if (hovered === group) return;
    if (hovered) {
      hovered.userData.wire.opacity = hovered.userData.baseWireOpacity;
      hovered.userData.material.emissiveIntensity = hovered.userData.baseEmissive;
      hovered.userData.label?.element.classList.remove("is-hot");
    }
    hovered = group;
    if (hovered) {
      hovered.userData.wire.opacity = 0.9;
      hovered.userData.material.emissiveIntensity = 0.35;
      hovered.userData.label?.element.classList.add("is-hot");
    }
    canvas.style.cursor = hovered ? "pointer" : "grab";
  }

  // ── event listeners ───────────────────────
  function onPointerMove(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    if (drag.active) {
      drag.theta += (e.clientX - drag.lastX) * 0.005;
      drag.phi += (e.clientY - drag.lastY) * 0.005;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      return;
    }
    if (activeStation === 2 && !focusedProjectId) {
      const now = performance.now();
      if (now - lastRayTime >= 32) { // ~30 fps cap for ray tests
        lastRayTime = now;
        setHover(pickProject(e.clientX, e.clientY));
      }
    }
  }

  function onPointerDown(e) {
    drag.active = true;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    canvas.style.cursor = "grabbing";
  }

  function onPointerUp(e) {
    const wasDragging =
      Math.abs(e.clientX - drag.startX) > 6 ||
      Math.abs(e.clientY - drag.startY) > 6;
    drag.active = false;
    canvas.style.cursor = hovered ? "pointer" : "grab";
    if (activeStation === 2 && !focusedProjectId && !wasDragging) {
      const hit = pickProject(e.clientX, e.clientY);
      if (hit) {
        focusProject(hit.userData.project.id);
        activateListeners.forEach((fn) => fn(hit.userData.project));
      }
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("resize", onResize);

  // Pause the render loop when the tab is hidden; resume when visible again.
  // This eliminates GPU work for inactive tabs entirely.
  function onVisibilityChange() {
    if (!started) return;
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
      clock.stop();
    } else {
      running = true;
      clock.start();
      frame();
    }
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  // ── render loop ───────────────────────────
  const clock = new THREE.Clock();
  const labelPos = new THREE.Vector3();
  let raf = 0;
  let running = false;
  let started = false;

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);

    if (tween) {
      tween.t = Math.min(tween.t + dt / tween.dur, 1);
      const k = easeInOutCubic(tween.t);
      rig.focus.lerpVectors(tween.from.focus, tween.to.focus, k);
      rig.radius = THREE.MathUtils.lerp(tween.from.radius, tween.to.radius, k);
      rig.theta = THREE.MathUtils.lerp(tween.from.theta, tween.to.theta, k);
      rig.phi = THREE.MathUtils.lerp(tween.from.phi, tween.to.phi, k);
      if (tween.t >= 1) tween = null;
    }

    if (!reducedMotion) {
      for (const a of animated) {
        a.obj.rotation.x += a.sx * dt;
        a.obj.rotation.y += a.sy * dt;
      }
      dustField.rotation.y += 0.01 * dt;
    }

    applyCamera();
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    // Cull labels by distance so far stations don't pile up at the
    // vanishing point. (CSS2D labels otherwise always render.)
    for (const label of labels) {
      label.getWorldPosition(labelPos);
      // Toggle .visible (not style.display) — CSS2DRenderer rewrites display
      // each frame but honours object visibility.
      label.visible = labelPos.distanceTo(camera.position) < 22;
    }

    labelRenderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      started = true;
      running = true;
      clock.start();
      frame();
    },
    navigateTo,
    focusProject,
    onProjectActivate(fn) {
      activateListeners.push(fn);
    },
    onStationChange(fn) {
      stationListeners.push(fn);
    },
    get activeStation() {
      return activeStation;
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      if (composer) composer.dispose();
      renderer.dispose();
    },
  };
}
