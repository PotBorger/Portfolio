# Nolan Mai Portfolio

Immersive 3D portfolio for Nolan Mai — a navigable "Blueprint Space" built with
Three.js, with a fully accessible 2D fallback.

Live site: [nolan-mai.is-a.dev](https://nolan-mai.is-a.dev/)

## Stack

- [Three.js](https://threejs.org/) — WebGL 3D world (camera stations, glassy
  geometry, bloom postprocessing, CSS2D labels)
- [Vite](https://vite.dev/) — dev server + production build
- Vanilla JS, HTML, CSS (IBM Plex Mono, navy palette)

## Modes

- **3D mode** — the default when WebGL is available and the visitor hasn't asked
  for reduced motion. Navigate stations via the nav, drag to look, click a solid.
- **2D mode** — the original static portfolio. Served automatically when WebGL is
  unavailable, when `prefers-reduced-motion` is set, or with JS disabled (the
  content lives in the DOM for SEO + screen readers). A toggle switches modes.

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
