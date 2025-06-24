// Navigation Menu Toggle
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

// For hidden elements
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log(entry);
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    } else {
      entry.target.classList.remove("show");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((element) => observer.observe(element));

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("mobile-active");
  menuToggle.classList.toggle("active");
});

// Modal Functionality for Projects
const projectItems = document.querySelectorAll(".project-item");
const modals = document.querySelectorAll(".modal");
const closeButtons = document.querySelectorAll(".close-button");

// Resume Card and Modal
const resumeCard = document.querySelector(".card");

projectItems.forEach((item) => {
  item.addEventListener("click", () => {
    const modalId = item.getAttribute("data-modal");
    document.getElementById(modalId).style.display = "block";
  });
});

closeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.parentElement.parentElement.style.display = "none";
  });
});

window.onclick = function (event) {
  modals.forEach((modal) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
};

// Smooth Scrolling
const navLinksSmooth = document.querySelectorAll("nav ul li a");
navLinksSmooth.forEach((link) => {
  link.addEventListener("click", function (e) {
    if (this.hash !== "") {
      e.preventDefault();
      const hash = this.hash;
      document.querySelector(hash).scrollIntoView({
        behavior: "smooth",
      });
    }
  });
});
