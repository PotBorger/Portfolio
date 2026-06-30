// Procedural retro-technology model + room factories for the museum.
// Pure functions returning Object3D — no scene side effects (mirrors the
// factory style of objects.js). Everything is low-poly primitives so it stays
// cheap on mobile; drop real GLB models in later via ProjectModel.

import * as THREE from "three";

export const retro = {
  wall: 0x4a4236, // warm museum greige (lit, not black)
  wallTrim: 0x6b5f49,
  floor: 0x2a2018, // warm polished floor
  ceiling: 0x342c20,
  panel: 0xfff2d6, // recessed ceiling light
  plastic: 0xd8cdb8, // aged beige plastic
  plasticDark: 0x6b6253,
  metal: 0x3c3c44,
  amber: 0xffb000,
  green: 0x3bd16f,
  blue: 0x66ccff,
  red: 0xff3b3b,
  warm: 0xffca73, // tungsten light
};

// Reusable shared geometry keeps draw setup cheap.
const screenGeo = new THREE.PlaneGeometry(1, 1);

function emissive(color, intensity = 1) {
  return new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0,
  });
}

function plastic(color = retro.plastic) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
}

function metalMat(color = retro.metal) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.7 });
}

// An indoor gallery "bay": lit floor, ceiling with recessed light panels, and
// two side walls with a baseboard + picture rail. The Z ends stay OPEN so the
// rail has a clear sightline down the connected corridor. The ceiling fixtures
// + visible warm surfaces are what make it read as a room rather than a void.
export function roomShell(w, d, h, accentHex = "#fbbf24") {
  const group = new THREE.Group();
  const accent = new THREE.Color(accentHex);

  // Floor — warm, lightly polished so lamps pool on it.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: retro.floor, roughness: 0.45, metalness: 0.25 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  group.add(floor);

  // Subtle tile seams on the floor.
  const grid = new THREE.GridHelper(Math.max(w, d), Math.round(Math.max(w, d) / 2), 0x000000, 0x000000);
  grid.material.transparent = true;
  grid.material.opacity = 0.12;
  grid.position.y = 0.02;
  group.add(grid);

  // Ceiling.
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: retro.ceiling, roughness: 1, metalness: 0 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = h;
  group.add(ceiling);

  // Recessed ceiling light panels — the strongest "indoors" cue.
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: new THREE.Color(retro.panel),
    emissiveIntensity: 1.5,
  });
  const panels = Math.max(2, Math.round(d / 5));
  for (let i = 0; i < panels; i += 1) {
    const pz = -d / 2 + (d * (i + 0.5)) / panels;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), panelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(0, h - 0.03, pz);
    group.add(panel);
  }

  // Side walls + baseboard (accent) + picture rail.
  const wallMat = new THREE.MeshStandardMaterial({
    color: retro.wall,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    emissive: accent,
    emissiveIntensity: 0.55,
  });
  const railMat = new THREE.MeshStandardMaterial({ color: retro.wallTrim, roughness: 0.7 });
  for (const sx of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
    wall.rotation.y = sx === -1 ? Math.PI / 2 : -Math.PI / 2;
    wall.position.set((sx * w) / 2, h / 2, 0);
    group.add(wall);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, d), baseMat);
    base.position.set((sx * w) / 2 - sx * 0.04, 0.12, 0);
    group.add(base);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, d), railMat);
    rail.position.set((sx * w) / 2 - sx * 0.03, 1.85, 0);
    group.add(rail);
  }
  return group;
}

// A framed wall poster (retro tech advertisement / exhibit notice). Text is
// drawn to a CanvasTexture so it reads as real signage.
function makeTextTexture(draw, w = 512, h = 640) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1a1610";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

export function wallPoster(headline, subline, accentHex = "#ffb000") {
  const tex = makeTextTexture((ctx, w, h) => {
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = accentHex;
    ctx.font = "700 64px 'IBM Plex Mono', monospace";
    const words = headline.toUpperCase().split(" ");
    words.forEach((word, i) => ctx.fillText(word, w / 2, 180 + i * 78));
    ctx.fillStyle = "#cfc3a8";
    ctx.font = "400 30px 'IBM Plex Mono', monospace";
    ctx.fillText(subline, w / 2, h - 90);
  });
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.9, 0.06),
    new THREE.MeshStandardMaterial({ color: retro.plasticDark, roughness: 0.6 })
  );
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.34, 1.74),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: 0x2a2415, emissiveMap: tex, emissiveIntensity: 0.35 })
  );
  face.position.z = 0.035;
  group.add(frame, face);
  return group;
}

// ── exhibit models (keyed by modelType) ─────────────
// Each model is ~1.3–1.9m tall, origin at its base, faces +Z.

function crtMonitor(accentHex) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 0.9), plastic());
  body.position.y = 0.55;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.5), plastic(retro.plasticDark));
  back.position.set(0, 0.55, -0.55);
  const screen = new THREE.Mesh(screenGeo, emissive(accentHex, 1.2));
  screen.scale.set(0.72, 0.56, 1);
  screen.position.set(0, 0.6, 0.46);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.7), plastic(retro.plasticDark));
  base.position.y = 0.09;
  g.add(body, back, screen, base);
  g.userData.screen = screen.material;
  return g;
}

function arcadeCabinet(accentHex) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.8), plastic(retro.plasticDark));
  body.position.y = 0.95;
  const screen = new THREE.Mesh(screenGeo, emissive(accentHex, 1.1));
  screen.scale.set(0.66, 0.52, 1);
  screen.position.set(0, 1.35, 0.41);
  screen.rotation.x = -0.18;
  const marquee = new THREE.Mesh(screenGeo, emissive(accentHex, 0.8));
  marquee.scale.set(0.8, 0.26, 1);
  marquee.position.set(0, 1.78, 0.36);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.1, 0.45), metalMat());
  panel.position.set(0, 0.95, 0.42);
  panel.rotation.x = 0.5;
  g.add(body, screen, marquee, panel);
  g.userData.screen = screen.material;
  return g;
}

function serverRack(accentHex) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.8, 0.8), metalMat(0x26262c));
  frame.position.y = 0.9;
  g.add(frame);
  const accent = new THREE.Color(accentHex);
  const blinkLeds = [];
  for (let i = 0; i < 7; i += 1) {
    const unit = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.18, 0.05), metalMat(0x33333b));
    unit.position.set(0, 0.35 + i * 0.22, 0.4);
    g.add(unit);
    for (let j = 0; j < 2; j += 1) {
      const led = new THREE.Mesh(
        new THREE.CircleGeometry(0.02, 8),
        emissive(j === 0 ? accent.getHex() : retro.green, 1.5)
      );
      led.position.set(-0.3 + j * 0.12, 0.35 + i * 0.22, 0.43);
      led.userData.blink = Math.random() * Math.PI * 2;
      g.add(led);
      blinkLeds.push(led);
    }
  }
  g.userData.blinkLeds = blinkLeds;
  return g;
}

const MODELS = { crt: crtMonitor, arcade: arcadeCabinet, "server-rack": serverRack };

// Build a procedural model for an exhibit. Unknown types fall back to a CRT.
export function exhibitModel(modelType, accentHex) {
  const make = MODELS[modelType] || crtMonitor;
  return make(accentHex);
}

// A short pedestal the exhibit model sits on.
export function pedestal(accentHex = "#34d399") {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.6, 24), plastic(retro.plasticDark));
  body.position.y = 0.3;
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.04, 24),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      emissive: new THREE.Color(accentHex),
      emissiveIntensity: 0.4,
    })
  );
  top.position.y = 0.62;
  g.add(body, top);
  return g;
}

// A warm spotlight aimed down at an exhibit. Returns { light, target }.
export function exhibitSpot(targetPos, intensity = 6) {
  const light = new THREE.SpotLight(retro.warm, intensity, 9, 0.55, 0.7, 1.4);
  light.position.set(targetPos.x, targetPos.y + 3.4, targetPos.z + 0.6);
  const target = new THREE.Object3D();
  target.position.copy(targetPos);
  light.target = target;
  return { light, target };
}

// Floating dust motes for atmosphere.
export function dust(count = 160, spread = 30) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: retro.warm,
      size: 0.03,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    })
  );
}
