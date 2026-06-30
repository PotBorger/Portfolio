# Nolan Mai Portfolio

A retro **technology museum** portfolio — visitors ride a guided rail through
connected exhibit rooms and inspect projects rendered as old machines (CRTs,
arcade cabinets, server racks). Built with Three.js, with a fully accessible 2D
fallback.

Live site: [nolan-mai.is-a.dev](https://nolan-mai.is-a.dev/)

## Stack

- [Three.js](https://threejs.org/) — WebGL museum (rail-guided camera, procedural
  retro models, CSS2D plaques, warm gallery lighting)
- [Vite](https://vite.dev/) — dev server + production build
- Vanilla JS, HTML, CSS (IBM Plex Mono, warm retro palette) — no framework

## Modes

- **Museum (3D)** — default when WebGL is available and the visitor hasn't asked
  for reduced motion. Boot screen → entrance → walkable museum. **Scroll / arrow
  keys** move along the rail, **drag** looks around, **E / tap** inspects an
  exhibit; the directory menu jumps between rooms. Same rail drives mobile.
- **Simple version (2D)** — the static portfolio. Served automatically when WebGL
  is unavailable, when `prefers-reduced-motion` is set, or with JS disabled (the
  content lives in the DOM for SEO + screen readers). Reachable from the entrance
  and the in-museum "exit to 2d" button.

## Source layout (3D)

- `src/data/content.js` — all content + `rooms` / `exhibitMeta` (single source)
- `src/three/retro.js` — procedural retro models + room/prop factories
- `src/three/museum.js` — rail controller, exhibits, inspect loop, render loop
- `src/ui/overlay.js` — boot, CRT inspect panel, HUD wiring
- `src/ui/static-site.js` — the 2D simple-version behaviour

## Local development

```bash
npm install
npm run dev      # dev server with HMR
npm run build    # production build → dist/
npm run preview  # preview the built site
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and publishes `dist/` to GitHub Pages.

One-time setup: repo **Settings → Pages → Source = "GitHub Actions"**. The custom
domain is kept in `public/CNAME` so it ships with every build.
