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
