const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const revealItems = document.querySelectorAll(".reveal");
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = [...document.querySelectorAll("main section[id]")];
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navLinks.length > 0) {
  navLinks[0].setAttribute("aria-current", "true");
}

// ── typewriter intro ──────────────────────────
const typer = document.getElementById("typer");

const introScript = [
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

function appendLine({ type, text }, container) {
  const line = document.createElement("p");
  line.className = "line";

  if (type === "blank") {
    line.innerHTML = "&nbsp;";
    container.appendChild(line);
    return Promise.resolve();
  }

  if (type === "cmd") {
    const prompt = document.createElement("span");
    prompt.textContent = "$ ";
    prompt.className = "out-line";
    line.appendChild(prompt);
    line.classList.add("cmd-line");
  } else if (type === "dim") {
    line.classList.add("dim-line");
  } else {
    line.classList.add("out-line");
  }

  container.appendChild(line);

  if (prefersReducedMotion) {
    line.appendChild(document.createTextNode(text));
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let i = 0;
    const speed = type === "cmd" ? 28 : type === "dim" ? 12 : 16;
    const tick = () => {
      if (i >= text.length) {
        resolve();
        return;
      }
      line.appendChild(document.createTextNode(text.charAt(i)));
      i += 1;
      setTimeout(tick, speed + Math.random() * 18);
    };
    setTimeout(tick, type === "cmd" ? 220 : 60);
  });
}

async function runTyper() {
  if (!typer) return;
  typer.innerHTML = "";

  const cursorLine = document.createElement("p");
  cursorLine.className = "line cmd-line";
  cursorLine.innerHTML =
    '<span class="out-line">$ </span><span class="term-cursor">&nbsp;</span>';

  for (const step of introScript) {
    await appendLine(step, typer);
  }

  typer.appendChild(cursorLine);
}

runTyper();

// ── project expand/collapse ───────────────────
const projects = document.querySelectorAll(".project");

projects.forEach((project) => {
  const trigger = project.querySelector(".project-trigger");
  const body = project.querySelector(".project-body");
  const toggle = project.querySelector(".toggle");
  if (!trigger || !body || !toggle) return;

  trigger.addEventListener("click", () => {
    const isOpen = project.getAttribute("data-open") === "true";
    project.setAttribute("data-open", String(!isOpen));
    trigger.setAttribute("aria-expanded", String(!isOpen));
    body.hidden = isOpen;
    toggle.textContent = isOpen ? "[+]" : "[-]";
  });
});

// ── reveal on scroll + nav highlight ──────────
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -32px 0px",
    }
  );

  revealItems.forEach((item) => {
    if (!item.classList.contains("is-visible")) {
      revealObserver.observe(item);
    }
  });

  const linkMap = new Map(
    navLinks.map((link) => [link.getAttribute("href").slice(1), link])
  );

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleSection) {
        return;
      }

      navLinks.forEach((link) => link.removeAttribute("aria-current"));
      const activeLink = linkMap.get(visibleSection.target.id);

      if (activeLink) {
        activeLink.setAttribute("aria-current", "true");
      }
    },
    {
      threshold: [0.2, 0.5, 0.75],
      rootMargin: "-30% 0px -45% 0px",
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
