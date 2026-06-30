// 2D fallback: the original static portfolio behaviours (scroll reveal,
// project expand/collapse, nav highlight). Shown when WebGL is unavailable
// or the visitor prefers the static experience. Ported from script.js.

export function initStaticSite(root = document) {
  const year = root.getElementById?.("year");
  if (year) year.textContent = new Date().getFullYear();

  const revealItems = root.querySelectorAll(".reveal");
  const navLinks = [...root.querySelectorAll('.static-nav a[href^="#"]')];
  const stationSections = [...root.querySelectorAll(".static-site section[id]")];

  // project expand / collapse
  root.querySelectorAll(".project").forEach((project) => {
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

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -32px 0px" }
  );
  revealItems.forEach((item) => {
    if (!item.classList.contains("is-visible")) revealObserver.observe(item);
  });

  const linkMap = new Map(
    navLinks.map((link) => [link.getAttribute("href").slice(1), link])
  );
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((l) => l.removeAttribute("aria-current"));
      linkMap.get(visible.target.id)?.setAttribute("aria-current", "true");
    },
    { threshold: [0.2, 0.5, 0.75], rootMargin: "-30% 0px -45% 0px" }
  );
  stationSections.forEach((s) => sectionObserver.observe(s));
}
