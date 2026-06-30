// Single source of truth for portfolio content.
//
// Extracted verbatim from the original index.html so the 3D world, the HTML
// overlays, and the static no-WebGL fallback all render from one place.
// Edit copy here, not in markup.

export const profile = {
  name: "nolan_mai",
  role: "software engineer",
  shell: { user: "nolan@portfolio", path: "~/3d-site", status: "online" },
  email: "nolanmai1811@gmail.com",
  resume: "files/NOLAN MAI Resume.pdf",
};

// Drives the hero terminal typewriter (mirrors the original introScript).
export const introScript = [
  { type: "cmd", text: "whoami" },
  { type: "out", text: "nolan mai — software engineer." },
  { type: "blank" },
  { type: "cmd", text: "cat focus.txt" },
  { type: "out", text: "data-heavy tools. clear interfaces." },
  { type: "out", text: "messy problems made usable." },
  { type: "blank" },
  { type: "cmd", text: "ls status/" },
  { type: "dim", text: "▸ interning @ fpt is — building an mcp system" },
  { type: "dim", text: "▸ b.s. cs · university of utah · may 2027" },
  { type: "dim", text: "▸ 3.8 gpa · llm-assisted code explorer · 709-test editor" },
];

export const about = {
  lead: "I build readable systems out of messy data.",
  body: "CS @ University of Utah (May 2027). Currently at FPT IS building an MCP (Model Context Protocol) system that connects internal tooling to AI assistants. Past work spans research dashboards, mobile health flows, and native desktop tooling.",
  tags: ["dev tooling", "data viz", "full-stack", "llm pipelines", "readable systems"],
};

// Each project becomes one interactive solid in the "work" cluster.
// `shape` is a hint the 3D layer maps to geometry; `accent` tints its material.
export const projects = [
  {
    id: "typing-dungeon",
    file: "typing-dungeon.md",
    meta: "python · 172 tests",
    shape: "gear",
    accent: "#3b82f6",
    summary:
      "Terminal roguelike where typing speed and accuracy drive tactical combat across branching floors.",
    points: [
      "Combat layers: intent, poise, stagger, feint interrupts, quickstep, word debuffs.",
      "JSON saves, top-10 leaderboard, audio cues, 172 passing tests.",
    ],
    links: [
      { label: "repo", href: "https://github.com/PotBorger/typing-dungeon" },
      { label: "gameplay", href: "https://youtu.be/QtAxXzygokw" },
    ],
  },
  {
    id: "desktop-editor",
    file: "desktop-editor.md",
    meta: "pyside6 · 709 tests · 96% cov",
    shape: "nested",
    accent: "#60a5fa",
    summary:
      "Native code editor with multi-tab editing, split panes, drag-and-drop tabs, and save-state aware documents.",
    points: [
      "6.1K+ lines focused on real developer workflows.",
      "99.9% faster large-file open, 99.6% faster replace-all on profiled workloads.",
    ],
    tag: "private build · demo on request",
    links: [],
  },
  {
    id: "lms-platform",
    file: "lms-platform.md",
    meta: "c# · asp.net · mysql",
    shape: "saturn",
    accent: "#3b82f6",
    summary:
      "Full-stack LMS with registration, courses, grading, GPA, and role-based access.",
    points: [
      "24+ controller actions across the end-to-end flow.",
      "Weighted grade recalculation across 10 relational entities.",
    ],
    links: [{ label: "repo", href: "https://github.com/PotBorger/DB-System-LMS" }],
  },
  {
    id: "sparky",
    file: "sparky.md",
    meta: "react · aws · sagemaker",
    shape: "helix",
    accent: "#38bdf8",
    summary:
      "AI wildfire + air quality app turning live environmental data into risk predictions and health guidance.",
    points: [
      "SageMaker model deployed at 78.6% accuracy.",
      "Personalized advisories via AWS Bedrock, map views for 50+ locations.",
    ],
    links: [{ label: "repo", href: "https://github.com/PotBorger/sParky" }],
  },
  {
    id: "treetable",
    file: "treetable.md",
    meta: "python · textual",
    shape: "gear",
    accent: "#3b82f6",
    summary:
      "Terminal tool that renders deeply nested JSON as both tree and table for supercomputer datasets at SCI Institute.",
    points: [],
    links: [
      { label: "repo", href: "https://github.com/PotBorger/Independent-Study-SCI" },
    ],
  },
  {
    id: "sprite-editor",
    file: "sprite-editor.md",
    meta: "c++ · qt",
    shape: "heart",
    accent: "#60a5fa",
    summary:
      "Desktop sprite editor with pixel drawing, real-time animation preview, and project save/load.",
    points: [],
    tag: "coursework · demo on request",
    links: [],
  },
  {
    id: "paintify",
    file: "paintify.md",
    meta: "kotlin · android · firebase",
    shape: "ufo",
    accent: "#3b82f6",
    summary:
      "Android drawing app with a touch-optimized canvas, secure auth, cloud-backed artwork storage, and AI image analysis of user drawings.",
    points: [
      "Firebase Auth + Firestore for persistent sessions and per-user artwork.",
      "AI-driven insight pass over saved drawings.",
    ],
    links: [{ label: "repo", href: "https://github.com/PotBorger/Paintify" }],
  },
  {
    id: "snake-multiplayer",
    file: "snake-multiplayer.md",
    meta: "c# · asp.net · blazor · sql server",
    shape: "torusknot",
    accent: "#38bdf8",
    summary:
      "Multiplayer client–server snake in C# with an ASP.NET backend and Blazor UI, holding authoritative game state for 25 concurrent players.",
    points: [
      "Event-driven real-time sync with disconnect / reconnect handling.",
      "SQL Server leaderboard + session tracking with parameterized CRUD and indexing — 40% lower query latency.",
    ],
    tag: "course project",
    links: [],
  },
];

// Camera travels this path; each entry is a node in space.
export const experience = [
  {
    role: "SWE Intern · FPT IS",
    date: "2026 – Present",
    points: [
      "Building an MCP (Model Context Protocol) system that connects internal tooling to AI assistants.",
    ],
  },
  {
    role: "SWE Intern · Select Portfolio Servicing",
    date: "Sep – Dec 2025",
    points: [
      "Built a Python static analysis platform for legacy C# across 10+ projects.",
      "React Flow architecture explorer cut manual code tracing from hours to minutes.",
      "Wired a local LLM pipeline for consistent business-level docs.",
    ],
  },
  {
    role: "Research Engineer · SCI Institute, U of U",
    date: "Aug 2024 – Dec 2025",
    points: [
      "Built D3 / SvelteKit dashboards for computer-architecture experiments.",
      "Cut analysis turnaround 80% and lifted render throughput 20%.",
    ],
  },
  {
    role: "Fullstack Intern · InCaria",
    date: "Jan – May 2025",
    points: [
      "Shipped React Native + TS flows worth ~20% of MVP completion.",
      "Wired the app to a Django + Postgres backend over REST.",
    ],
  },
  {
    role: "SWE Intern · SENTECHS",
    date: "Jun – Aug 2024",
    points: [
      "API-driven IELTS passage analysis tool, MongoDB vocab pipeline feeding an LLM workflow.",
      "REST endpoints handling 2,000+ daily queries.",
    ],
  },
];

export const stack = [
  { label: "lang", value: "java · ts · python · c# · c++ · kotlin" },
  { label: "front", value: "react · react native · sveltekit · d3 · blazor" },
  { label: "back", value: "node · django · spring · postgres · mongo · sqlite · supabase" },
  { label: "tools", value: "git · docker · aws (sagemaker, bedrock, ec2) · qt · pytest" },
];

export const contact = {
  lead: "Open to engineering roles and interesting collabs.",
  links: [
    { label: "mail · nolanmai1811@gmail.com", href: "mailto:nolanmai1811@gmail.com" },
    { label: "linkedin · /in/nolanmai", href: "https://www.linkedin.com/in/nolanmai/" },
    { label: "github · /PotBorger", href: "https://github.com/PotBorger" },
    { label: "resume · pdf", href: "files/NOLAN MAI Resume.pdf" },
  ],
};

// ── Retro tech-museum model ───────────────────────────
// Rooms the rail visits in order. `accent` tints the room + its plaques.
export const rooms = [
  { id: "lobby", name: "Entrance Lobby", accent: "#fbbf24" },
  { id: "gallery", name: "Project Gallery", accent: "#34d399" },
  { id: "skills", name: "Skills Lab", accent: "#60a5fa" },
  { id: "about", name: "About Archive", accent: "#2dd4bf" },
  { id: "experience", name: "Experience Hall", accent: "#e879f9" },
  { id: "contact", name: "Contact Station", accent: "#fb7185" },
];

// Per-project exhibit presentation, merged onto `projects` by id in the 3D
// layer. `modelType` selects a procedural retro model (crt | arcade |
// server-rack for now); drop a GLB path in `modelPath` later to override.
// REAL DATA: edit subtitle/year/status here; the rest comes from `projects`.
export const exhibitMeta = {
  "typing-dungeon": { modelType: "arcade", subtitle: "Type-to-fight roguelike", role: "Solo developer", year: "2024", status: "open source" },
  "desktop-editor": { modelType: "crt", subtitle: "Native multi-tab code editor", role: "Solo developer", year: "2024", status: "private build" },
  "lms-platform": { modelType: "server-rack", subtitle: "Full-stack learning platform", role: "Backend + DB", year: "2023", status: "open source" },
  "sparky": { modelType: "server-rack", subtitle: "AI wildfire & air-quality app", role: "Full-stack + ML", year: "2024", status: "open source" },
  "treetable": { modelType: "crt", subtitle: "Nested-JSON tree/table viewer", role: "Research engineer", year: "2024", status: "open source" },
  "sprite-editor": { modelType: "crt", subtitle: "Pixel sprite editor", role: "Team of 2", year: "2023", status: "coursework" },
  "paintify": { modelType: "crt", subtitle: "Android drawing app + AI", role: "Solo developer", year: "2024", status: "open source" },
  "snake-multiplayer": { modelType: "arcade", subtitle: "Authoritative multiplayer snake", role: "Networking + DB", year: "2023", status: "course project" },
};

// Museum "wings": one themed exhibit hall per station. `gel` is the hall's
// lighting accent used in the 3D world (room walls, columns, fill light,
// placard stripe); `gelDeep` is the AA-safe variant for ink-on-light use in
// the 2D fallback. `hall`/`name` drive wayfinding (floor directory + indicator).
export const wings = {
  hero: { hall: 0, name: "The Atrium", short: "Atrium", gel: "#fbbf24", gelDeep: "#92400e" },
  about: { hall: 1, name: "The Bench", short: "Bench", gel: "#2dd4bf", gelDeep: "#0f766e" },
  projects: { hall: 2, name: "Work Gallery", short: "Gallery", gel: "#e879f9", gelDeep: "#a21caf" },
  experience: { hall: 3, name: "Career Timeline", short: "Timeline", gel: "#34d399", gelDeep: "#047857" },
  stack: { hall: 4, name: "The Toolwall", short: "Toolwall", gel: "#60a5fa", gelDeep: "#1e3a8a" },
  contact: { hall: 5, name: "The Beacon", short: "Beacon", gel: "#fb7185", gelDeep: "#be123c" },
};

// Section order = the order the camera visits "stations".
export const sections = [
  { id: "about", label: "about" },
  { id: "projects", label: "work" },
  { id: "experience", label: "exp" },
  { id: "stack", label: "stack" },
  { id: "contact", label: "contact" },
];
