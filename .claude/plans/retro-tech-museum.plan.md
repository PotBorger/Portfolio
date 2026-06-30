# Plan: Retro Tech-Museum Portfolio (vanilla stack)

**Source**: free-form spec ("nostalgic technology museum") + constraint "use the current tech stack, don't add tech unless necessary"
**Branch**: `feat/retro-tech-museum`
**Complexity**: Large (phased; this plan covers the **vertical slice** first)

## Decisions locked
- **Stack**: keep vanilla JS + Vite + raw Three.js (r0.171) + plain CSS. NO React / Next / R3F / Drei / Tailwind / Framer / TypeScript / GLB. The prompt's framework list is overridden by the "current tech stack" constraint.
- **Navigation**: **rail-guided walk** — camera rides a CatmullRom spline through the rooms; scroll / click-forward / arrow keys advance `t`; drag = free look offset on top of the path tangent. Same model on desktop and mobile (mobile = scroll-driven). No WASD free-walk, no collision engine needed (you can't leave the rail).
- **Contact form**: decorative — full terminal-style UI with loading/success/error states wired to a stub; real endpoint added later.
- **First pass = vertical slice**: retro shell + entrance/boot + ONE fully walkable room (Project Gallery) with a working exhibit + inspect UI + rail nav, with the other rooms stubbed as placeholder volumes along the rail. Then iterate room-by-room.
- **Models**: procedural Three.js primitives keyed by `modelType` (CRT, arcade, server-rack, floppy, etc.). `modelPath` GLB slot left in the data for you to drop real models later.
- **Simple Version**: the existing 2D `static-site.js` fallback IS the "View Simple Version" / non-3D accessible mode.

## Reuse from current codebase
| Asset | Reuse as |
|---|---|
| `src/main.js` mode detection (WebGL + reduced-motion) | entry → boot/entrance → museum vs simple |
| `src/ui/static-site.js` + static DOM | the accessible "Simple Version" |
| `src/data/content.js` | single source of truth (extend fields) |
| loader + 2-mode body classes in `index.html`/`styles.css` | retro boot screen + mode toggle |
| GitHub Actions → Pages deploy | unchanged |
| `objects.js` factory pattern (pure fns returning Object3D) | retro model + room factories |

## Files to change (slice)
| File | Action | Why |
|---|---|---|
| `src/data/content.js` | UPDATE | Extend project shape: `subtitle, role, year, status, features[], screenshots[], modelType, modelPath?, exhibitPosition, exhibitRotation?`. Add `rooms` list (id, name, splineNode, accent). Keep existing exports. |
| `src/three/retro.js` | CREATE | Retro palette + procedural model factories (`crtMonitor`, `arcadeCabinet`, `serverRack`, `floppyDisk`, `cassette`, `robot`, `modem`, `camera`…) keyed by `modelType`; room shell (`roomBox`, `floor`, `ceiling`), `exhibitPlaque`, spotlight rig. |
| `src/three/museum.js` | CREATE | New scene/controller replacing station rig: builds rail spline + rooms + exhibits from data; `RailController` (advance/look); proximity → inspect prompt; focus-on-inspect + return; mobile scroll; perf gating (reuse `isLowEnd`); `dispose()`. Public API mirrors old world (`start/onInspect/onRoomChange/goToRoom/dispose`). |
| `src/three/world.js` | DELETE (after slice proven) | Superseded by `museum.js`. Kept until slice verified. |
| `src/ui/overlay.js` | UPDATE | Retro boot loader copy; entrance screen (title + intro + "Enter Museum" / "View Simple Version"); HUD (room name, nav hint, sound stub, fullscreen, menu w/ section skip); inspect panel restyled as CRT/OS window; interaction prompt ("Press E · tap to inspect"). |
| `src/main.js` | UPDATE | Wire entrance → `museum.start()`; lazy-import `museum.js`; mode selection unchanged. |
| `index.html` | UPDATE | New overlay structure: boot, entrance, HUD, interaction prompt, inspect panel, menu; keep `#static-site` as Simple Version. |
| `styles.css` | UPDATE | Retro theme tokens (charcoal/beige walls, tungsten warm, amber/green/blue CRT glow, red LEDs, scanline/noise) + entrance/HUD/CRT-panel/menu styling; respect `prefers-reduced-motion`. |
| `README.md` | UPDATE | Reflect rail nav + retro museum + modes. |

## Tasks (slice, in order)
1. **Data model** — extend `content.js` (project fields + `rooms`); add placeholder retro `modelType`/`exhibitPosition` for existing projects; mark where real info goes.
2. **Retro kit** — `retro.js`: palette, room shell, 2–3 model factories needed for the slice (CRT, arcade, server-rack), plaque, spotlight.
3. **Rail + scene** — `museum.js`: spline through Lobby → Project Gallery (+ stub volumes for the other 4 rooms); `RailController` (scroll/click/keys advance, drag look); render loop; perf gating; `dispose()` with full resource cleanup (mirror current dispose traverse).
4. **Inspect loop** — proximity detection along rail → interaction prompt; activate (E / click / tap) → ease camera to exhibit + open CRT inspect panel from data; close → resume at same `t`.
5. **Shell UI** — boot loader (retro messages) → entrance screen (Enter Museum / View Simple Version) → in-museum HUD (room name, hint, sound stub, fullscreen, menu with section-skip) in `overlay.js` + `index.html`.
6. **Retro CSS** — theme tokens + entrance/HUD/CRT-panel styling; reduced-motion + AA contrast.
7. **Wire + verify** — `main.js` repoint to `museum.js`; `npm run build`; chrome-devtools walkthrough (boot → enter → ride rail → inspect exhibit → close → menu skip → Simple Version toggle); remove `world.js`.

## Validation
```bash
npm run build        # must stay green
npm run preview      # manual + chrome-devtools walkthrough
```
- Boot → entrance → museum loads, no console errors.
- Rail advances on scroll/click/keys (desktop) and scroll (mobile); drag looks around.
- Approaching the exhibit shows the prompt; inspect opens CRT panel with data; close resumes position.
- "View Simple Version" switches to the accessible 2D site; reduced-motion auto-routes to it.
- Lighthouse a11y pass on the Simple Version; contrast AA on overlays.

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Rail-vs-page scroll conflict | Med | Capture wheel/touch on the canvas; preventDefault while in museum mode; menu/Esc releases |
| Retro models inflate draw calls / lights | Med | Reuse geometry+materials; cap real-time lights; gate spotlights/post on `isLowEnd`; pause off-screen anims |
| CRT scanline/flicker hurts readability or perf | Med | Keep effects subtle + behind a settings/reduced-motion toggle; text lives in DOM overlays, not textures |
| Big rewrite breaks the working site | Med | Build `museum.js` alongside; keep `world.js` until slice verified; all on the branch |
| Contact form looks functional but isn't | Low | Decorative by decision; clear stub success copy; leave obvious endpoint TODO |
| Scope creep (11 phases) | High | Slice first; explicit STOP after step 7 for review before building rooms 2–6 |

## Deferred to later passes (not in slice)
Rooms 2–6 full build (Skills lab, About archive, Experience hallway, Contact station) · audio manager + sound toggle wiring · settings panel (toggle post/grain/flicker) · GLB model swap · full environmental storytelling (posters, ads, cables, dust) · perf auto-detect tuning · full keyboard/mobile/low-power test matrix.

## Acceptance (slice)
- [ ] Build green; no console errors
- [ ] Boot → entrance → walkable Project Gallery via rail
- [ ] One exhibit inspectable (open/close, data-driven), camera returns
- [ ] Simple Version reachable + reduced-motion routes to it
- [ ] Retro look established (palette, CRT panel, plaque); patterns mirror existing factory/module style
