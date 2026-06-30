// Geometry + material factories for the "Blueprint Space" world.
// Everything here is pure: it builds and returns objects, no scene side effects.

import * as THREE from "three";

export const palette = {
  void: 0x070e24,
  navy: 0x0a1532,
  grid: 0x1e2a52,
  accent: 0x3b82f6,
  bright: 0x60a5fa,
  glass: 0x9ec5ff,
  light: 0xe6ecf5,
  dim: 0x94a3b8,
};

// Map a content `shape` hint to a Three.js geometry.
function geometryFor(shape) {
  switch (shape) {
    case "box":
      return new THREE.BoxGeometry(1.5, 1.5, 1.5);
    case "octahedron":
      return new THREE.OctahedronGeometry(1.1, 0);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(1.05, 0);
    case "torus":
      return new THREE.TorusGeometry(0.95, 0.34, 16, 40);
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(1.25, 0);
    case "cone":
      return new THREE.ConeGeometry(1.05, 1.8, 28);
    case "torusknot":
      return new THREE.TorusKnotGeometry(0.75, 0.26, 90, 14);
    case "icosahedron":
    default:
      return new THREE.IcosahedronGeometry(1.15, 0);
  }
}

// A "blueprint solid": glassy physical core + a low-opacity accent wireframe
// shell, so it reads as a CAD part rather than a generic shiny blob.
export function blueprintSolid(shape, accentHex) {
  const accent = new THREE.Color(accentHex || "#3b82f6");
  const geometry = geometryFor(shape);

  const core = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: palette.navy,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.55,
      thickness: 1.2,
      ior: 1.3,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      attenuationColor: accent,
      attenuationDistance: 2.5,
      emissive: accent,
      emissiveIntensity: 0.08,
    })
  );

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.35,
    })
  );

  const group = new THREE.Group();
  group.add(core, wire);
  group.userData.material = core.material;
  group.userData.wire = wire.material;
  group.userData.baseEmissive = 0.08;
  group.userData.baseWireOpacity = 0.35;
  return group;
}

// Faint blueprint grid floor that fades into the fog toward a horizon line.
export function gridFloor() {
  const group = new THREE.Group();

  const grid = new THREE.GridHelper(400, 80, palette.grid, palette.grid);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  grid.position.y = -6;
  group.add(grid);

  // Horizon line: a thin glowing strip far down the path.
  const horizonGeo = new THREE.PlaneGeometry(800, 0.6);
  const horizon = new THREE.Mesh(
    horizonGeo,
    new THREE.MeshBasicMaterial({
      color: palette.bright,
      transparent: true,
      opacity: 0.35,
    })
  );
  horizon.position.set(0, -5.4, -200);
  group.add(horizon);

  return group;
}

// Ambient dust points for parallax depth (kept subtle).
export function dust(count = 260) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 160;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = -Math.random() * 220 + 20;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: palette.glass,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    })
  );
}

// A simple emissive node used for experience timeline + contact beacon.
export function node(accentHex = "#60a5fa", radius = 0.5) {
  const accent = new THREE.Color(accentHex);
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    new THREE.MeshStandardMaterial({
      color: palette.navy,
      emissive: accent,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.4,
    })
  );
  return mesh;
}

// A thin glowing connector line between two points (timeline edges).
export function connector(from, to, accentHex = "#3b82f6") {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      color: new THREE.Color(accentHex),
      transparent: true,
      opacity: 0.4,
    })
  );
}

// Concentric ring used for the stack station.
export function ring(radius, accentHex = "#3b82f6") {
  const geo = new THREE.TorusGeometry(radius, 0.02, 8, 120);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHex),
      transparent: true,
      opacity: 0.5,
    })
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}
