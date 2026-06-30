// Rail-guided retro museum scene.
//
// The visitor rides a spline ("the rail") through the rooms: scroll / arrow
// keys / vertical drag advance along it, horizontal drag looks around. Walking
// off the path is impossible, so no collision engine is needed. Approaching an
// exhibit shows a prompt; inspecting eases the camera in and opens a DOM panel,
// then returns to the same spot on the rail.
//
// Public API (see createMuseum):
//   start()                 begin the render loop
//   advance(delta)          nudge along the rail (delta in rail units)
//   goToRoom(id)            ease to a room
//   inspect() / closeInspect()
//   onInspect(fn)           fn(project) when an exhibit is inspected
//   onProximity(fn)         fn(project|null) when the nearest exhibit changes
//   onRoomChange(fn)        fn(room) when the current room changes
//   dispose()

import * as THREE from "three";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";

import {
  retro,
  roomShell,
  exhibitModel,
  pedestal,
  exhibitSpot,
  wallPoster,
  dust,
} from "./retro.js";
import { projects, exhibitMeta, rooms } from "../data/content.js";

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Centerline the camera rides (eye height ~1.6m), running down -Z through the
// rooms. Each room gets a z-center used for wayfinding + goToRoom.
const EYE = 1.6;
const ROOM_Z = {
  lobby: 7,
  gallery: -13,
  skills: -34,
  about: -46,
  experience: -58,
  contact: -70,
};

function railPoints() {
  return [
    new THREE.Vector3(0, EYE, 13),
    new THREE.Vector3(0, EYE, ROOM_Z.lobby),
    new THREE.Vector3(0, EYE, -2),
    new THREE.Vector3(0, EYE, ROOM_Z.gallery),
    new THREE.Vector3(0, EYE, -24),
    new THREE.Vector3(0, EYE, ROOM_Z.skills),
    new THREE.Vector3(0, EYE, ROOM_Z.about),
    new THREE.Vector3(0, EYE, ROOM_Z.experience),
    new THREE.Vector3(0, EYE, ROOM_Z.contact),
  ];
}

export function createMuseum(canvas, labelLayer, options = {}) {
  const reducedMotion = !!options.reducedMotion;
  const isLowEnd =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

  const scene = new THREE.Scene();
  // Warm haze, not black — a lit room receding into distance, not deep space.
  scene.background = new THREE.Color(0x2a241b);
  scene.fog = new THREE.Fog(0x2a241b, 16, 78);

  const camera = new THREE.PerspectiveCamera(
    62,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isLowEnd,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const labelRenderer = new CSS2DRenderer({ element: labelLayer });
  labelRenderer.setSize(window.innerWidth, window.innerHeight);

  // ── lighting: warm, kept bright enough to read (spec: avoid too dark) ──
  scene.add(new THREE.AmbientLight(0x6b5d3e, 1.7));
  scene.add(new THREE.HemisphereLight(0xffd9a0, 0x140f08, 0.7));
  const fill = new THREE.DirectionalLight(retro.warm, 0.9);
  fill.position.set(4, 12, 8);
  scene.add(fill);
  // A few warm ceiling lamps down the corridor so the path is never black.
  for (const z of [7, -8, -20, -34, -58]) {
    const lamp = new THREE.PointLight(retro.warm, 0.7, 26, 2);
    lamp.position.set(0, 4.6, z);
    scene.add(lamp);
  }

  // ── rail ──
  const curve = new THREE.CatmullRomCurve3(railPoints(), false, "catmullrom", 0.5);
  const labels = [];
  const animatedScreens = [];
  const blinkers = [];

  // ── rooms (shells) ──
  const roomDefs = [
    { id: "lobby", z: ROOM_Z.lobby, w: 14, d: 16, h: 6 },
    { id: "gallery", z: ROOM_Z.gallery, w: 16, d: 26, h: 6.5 },
    { id: "skills", z: ROOM_Z.skills, w: 12, d: 12, h: 6 },
    { id: "about", z: ROOM_Z.about, w: 12, d: 12, h: 6 },
    { id: "experience", z: ROOM_Z.experience, w: 10, d: 12, h: 6 },
    { id: "contact", z: ROOM_Z.contact, w: 12, d: 12, h: 6 },
  ];
  const roomById = Object.fromEntries(rooms.map((r) => [r.id, r]));
  for (const def of roomDefs) {
    const accent = roomById[def.id]?.accent || "#fbbf24";
    const shell = roomShell(def.w, def.d, def.h, accent);
    shell.position.set(0, 0, def.z);
    scene.add(shell);
  }

  scene.add(dust(isLowEnd ? 80 : 180, 28));

  // Framed wall posters down the gallery — retro-ad environmental storytelling.
  const galleryAccent = roomById.gallery.accent;
  const posterDefs = [
    { x: -7.85, z: -7, ry: Math.PI / 2, head: "Vintage Computing", sub: "gallery a · est. 1984" },
    { x: 7.85, z: -11, ry: -Math.PI / 2, head: "The Floppy Era", sub: "8-bit & beyond" },
    { x: -7.85, z: -19, ry: Math.PI / 2, head: "Now Showing", sub: "working software" },
    { x: 7.85, z: -23, ry: -Math.PI / 2, head: "Server Room", sub: "mainframes & racks" },
  ];
  for (const p of posterDefs) {
    const poster = wallPoster(p.head, p.sub, galleryAccent);
    poster.position.set(p.x, 2.0, p.z);
    poster.rotation.y = p.ry;
    scene.add(poster);
  }

  // ── exhibits (gallery) ──
  // Lay projects down both sides of the gallery aisle.
  const exhibits = []; // { project, center, facing }
  const galleryStartZ = -5;
  const galleryStep = 4.3;
  projects.forEach((project, i) => {
    const meta = exhibitMeta[project.id] || {};
    const side = i % 2 === 0 ? -1 : 1; // left / right
    const slot = Math.floor(i / 2);
    const x = side * 3.4;
    const z = galleryStartZ - slot * galleryStep;
    const accent = roomById.gallery.accent;

    const stand = pedestal(accent);
    stand.position.set(x, 0, z);
    scene.add(stand);

    const model = exhibitModel(meta.modelType, accent);
    model.position.set(x, 0.64, z);
    model.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2; // face aisle
    scene.add(model);
    if (model.userData.screen) animatedScreens.push(model.userData.screen);
    if (model.userData.blinkLeds) blinkers.push(...model.userData.blinkLeds);

    if (!isLowEnd) {
      const { light, target } = exhibitSpot(new THREE.Vector3(x, 1.2, z), 7);
      scene.add(light);
      scene.add(target);
    }

    // Museum plaque (CSS2D) just toward the aisle from the model.
    const el = document.createElement("div");
    el.className = "exhibit-plaque";
    el.style.setProperty("--gel", accent);
    const titleEl = document.createElement("span");
    titleEl.className = "plaque-title";
    titleEl.textContent = project.file.replace(/\.md$/, "").replace(/-/g, " ");
    const subEl = document.createElement("span");
    subEl.className = "plaque-sub";
    subEl.textContent = meta.subtitle || project.meta;
    el.append(titleEl, subEl);
    const plaque = new CSS2DObject(el);
    plaque.position.set(x + side * -0.2, 1.7, z);
    scene.add(plaque);
    labels.push(plaque);

    exhibits.push({
      project,
      center: new THREE.Vector3(x, 1.25, z),
      facing: new THREE.Vector3(side === -1 ? 1 : -1, 0, 0), // aisle-ward normal
    });
  });

  // ── camera rig / rail state ──
  let t = 0; // current arc position [0,1]
  let targetT = 0;
  const drag = { yaw: 0, pitch: 0, active: false, moved: false, lastX: 0, lastY: 0 };
  const tmpPos = new THREE.Vector3();
  const tmpTan = new THREE.Vector3();
  const tmpForward = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  // inspect state machine: "rail" | "in" | "inspecting" | "out"
  let mode = "rail";
  let activeExhibit = null;
  let lastProximity = undefined;
  let currentRoom = null;
  const tween = {
    active: false,
    t: 0,
    dur: 0.8,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromLook: new THREE.Vector3(),
    toLook: new THREE.Vector3(),
    onDone: null,
  };
  let returnT = 0;

  const inspectListeners = [];
  const proximityListeners = [];
  const roomListeners = [];

  function railCameraPose(at) {
    curve.getPointAt(THREE.MathUtils.clamp(at, 0, 1), tmpPos);
    curve.getTangentAt(THREE.MathUtils.clamp(at, 0, 1), tmpTan);
    const baseYaw = Math.atan2(tmpTan.x, tmpTan.z);
    const yaw = baseYaw + drag.yaw;
    const pitch = drag.pitch;
    tmpForward.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)
    );
    return { pos: tmpPos, look: lookAt.copy(tmpPos).add(tmpForward) };
  }

  function applyRailCamera() {
    const { pos, look } = railCameraPose(t);
    camera.position.copy(pos);
    camera.lookAt(look);
  }

  function updateRoom() {
    let nearest = null;
    let best = Infinity;
    for (const r of rooms) {
      const dz = Math.abs(camera.position.z - (ROOM_Z[r.id] ?? 0));
      if (dz < best) {
        best = dz;
        nearest = r;
      }
    }
    if (nearest && nearest !== currentRoom) {
      currentRoom = nearest;
      roomListeners.forEach((fn) => fn(nearest));
    }
  }

  function updateProximity() {
    if (mode !== "rail") return;
    let near = null;
    let best = 4.2; // metres
    for (const ex of exhibits) {
      const d = camera.position.distanceTo(ex.center);
      if (d < best) {
        best = d;
        near = ex;
      }
    }
    activeExhibit = near;
    const proj = near ? near.project : null;
    if (proj !== lastProximity) {
      lastProximity = proj;
      proximityListeners.forEach((fn) => fn(proj));
    }
  }

  function startTween(toPos, toLook, dur, onDone) {
    tween.fromPos.copy(camera.position);
    camera.getWorldDirection(tmpForward);
    tween.fromLook.copy(camera.position).add(tmpForward);
    tween.toPos.copy(toPos);
    tween.toLook.copy(toLook);
    tween.t = 0;
    tween.dur = reducedMotion ? 0.001 : dur;
    tween.onDone = onDone || null;
    tween.active = true;
  }

  function inspect() {
    if (mode !== "rail" || !activeExhibit) return;
    const ex = activeExhibit;
    returnT = t;
    mode = "in";
    const standPos = ex.center.clone().add(ex.facing.clone().multiplyScalar(2.6));
    standPos.y = 1.45;
    startTween(standPos, ex.center.clone(), 0.85, () => {
      mode = "inspecting";
    });
    proximityListeners.forEach((fn) => fn(null)); // hide prompt while inspecting
    inspectListeners.forEach((fn) => fn(ex.project));
  }

  function closeInspect() {
    if (mode !== "inspecting" && mode !== "in") return;
    mode = "out";
    const { pos, look } = railCameraPose(returnT);
    startTween(pos.clone(), look.clone(), 0.7, () => {
      t = returnT;
      targetT = returnT;
      mode = "rail";
      lastProximity = undefined; // re-fire proximity for where we landed
    });
  }

  function goToRoom(id) {
    const z = ROOM_Z[id];
    if (z === undefined) return;
    let bestT = 0;
    let best = Infinity;
    const steps = 200;
    for (let i = 0; i <= steps; i += 1) {
      const tt = i / steps;
      curve.getPointAt(tt, tmpPos);
      const dz = Math.abs(tmpPos.z - z);
      if (dz < best) {
        best = dz;
        bestT = tt;
      }
    }
    if (mode === "inspecting" || mode === "in") mode = "rail";
    targetT = bestT;
    if (reducedMotion) t = bestT;
  }

  function advance(delta) {
    if (mode !== "rail") return;
    targetT = THREE.MathUtils.clamp(targetT + delta, 0, 1);
  }

  // ── interaction ──
  function onWheel(e) {
    if (mode !== "rail") return;
    e.preventDefault();
    advance(e.deltaY * 0.00035);
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      drag.active = true;
      drag.moved = false;
      drag.lastX = e.touches[0].clientX;
      drag.lastY = e.touches[0].clientY;
    }
  }
  function onTouchMove(e) {
    if (e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - drag.lastX;
    const dy = y - drag.lastY;
    if (Math.abs(dx) > Math.abs(dy)) {
      drag.yaw -= dx * 0.005; // horizontal → look
      drag.moved = true;
    } else {
      advance(-dy * 0.0016); // vertical → advance along rail
    }
    drag.lastX = x;
    drag.lastY = y;
  }
  function onTouchEnd() {
    drag.active = false;
  }

  function onPointerDown(e) {
    drag.active = true;
    drag.moved = false;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
  }
  function onPointerMove(e) {
    if (!drag.active) return;
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    drag.yaw -= dx * 0.0042;
    drag.pitch = THREE.MathUtils.clamp(drag.pitch - dy * 0.0042, -0.6, 0.6);
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
  }
  function onPointerUp() {
    const wasDrag = drag.moved;
    drag.active = false;
    if (mode === "inspecting") return;
    if (!wasDrag && activeExhibit) inspect();
  }

  function onKeyDown(e) {
    if (["ArrowUp", "ArrowRight", "w", "W"].includes(e.key)) {
      advance(0.02);
    } else if (["ArrowDown", "ArrowLeft", "s", "S"].includes(e.key)) {
      advance(-0.02);
    } else if (e.key === "e" || e.key === "E") {
      if (mode === "rail") inspect();
    } else if (e.key === "Escape") {
      if (mode === "inspecting" || mode === "in") closeInspect();
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

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

  // ── render loop ──
  const clock = new THREE.Clock();
  const labelPos = new THREE.Vector3();
  let raf = 0;
  let running = false;
  let started = false;

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);

    if (tween.active) {
      tween.t = Math.min(tween.t + dt / tween.dur, 1);
      const k = easeInOutCubic(tween.t);
      camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
      lookAt.lerpVectors(tween.fromLook, tween.toLook, k);
      camera.lookAt(lookAt);
      if (tween.t >= 1) {
        tween.active = false;
        if (tween.onDone) tween.onDone();
      }
    } else if (mode === "rail") {
      t += (targetT - t) * Math.min(1, dt * 6);
      applyRailCamera();
      updateRoom();
      updateProximity();
    }

    if (!reducedMotion) {
      const flick = (0.9 + Math.sin(clock.elapsedTime * 9) * 0.06) * 1.15;
      for (const m of animatedScreens) m.emissiveIntensity = flick;
      for (const led of blinkers) {
        led.userData.blink += dt * 3;
        led.material.emissiveIntensity =
          0.6 + Math.abs(Math.sin(led.userData.blink)) * 1.2;
      }
    }

    renderer.render(scene, camera);

    for (const label of labels) {
      label.getWorldPosition(labelPos);
      label.visible = labelPos.distanceTo(camera.position) < 14;
    }
    labelRenderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  applyRailCamera();

  return {
    start() {
      if (running) return;
      started = true;
      running = true;
      clock.start();
      frame();
    },
    advance,
    goToRoom,
    inspect,
    closeInspect,
    onInspect(fn) {
      inspectListeners.push(fn);
    },
    onProximity(fn) {
      proximityListeners.push(fn);
    },
    onRoomChange(fn) {
      roomListeners.push(fn);
    },
    get currentRoom() {
      return currentRoom;
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        const mats = Array.isArray(obj.material)
          ? obj.material
          : obj.material
            ? [obj.material]
            : [];
        for (const mat of mats) {
          for (const key in mat) {
            const val = mat[key];
            if (val && val.isTexture) val.dispose();
          }
          mat.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
