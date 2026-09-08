// Navbar Fix
window.onscroll = function () {
  const header = document.querySelector("header");
  const toTop = document.querySelector("#to-top");

  if (header) {
    const fixednav = header.offsetTop;
    if (window.pageYOffset > fixednav) {
      header.classList.add("navbar-fixed");
    } else {
      header.classList.remove("navbar-fixed");
    }
  }

  if (toTop) {
    if (window.pageYOffset > 300) {
      toTop.classList.remove("hidden");
      toTop.classList.add("flex");
    } else {
      toTop.classList.remove("flex");
      toTop.classList.add("hidden");
    }
  }
};

// Hamburger
const hamburger = document.querySelector("#hamburger");
const navMenu = document.querySelector("#nav-menu");

if (hamburger && navMenu) {
  hamburger.addEventListener("click", function () {
    hamburger.classList.toggle("hamburger-active");
    navMenu.classList.toggle("hidden");
  });

  // Klik diluar hamburger
  window.addEventListener("click", function (e) {
    if (e.target != hamburger && !hamburger.contains(e.target) && e.target != navMenu && !navMenu.contains(e.target)) {
      hamburger.classList.remove("hamburger-active");
      navMenu.classList.add("hidden");
    }
  });
}

// Dark Mode Toggle
const darkToggle = document.querySelector("#dark-toggle");
const html = document.querySelector("html");

if (darkToggle) {
  darkToggle.addEventListener("click", function () {
    if (darkToggle.checked) {
      html.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      html.classList.remove("dark");
      localStorage.theme = "light";
    }
  });

  // pindah posisi toggle sesuai mode
  if (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    darkToggle.checked = true;
  } else {
    darkToggle.checked = false;
  }
}