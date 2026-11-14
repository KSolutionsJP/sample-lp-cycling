/* VeloGuard — sample landing page interactions (vanilla JS) */
(function () {
  "use strict";

  /* ---------- header state ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  mainNav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      mainNav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* =====================================================
     Interactive demo — "How It Works"
     A vehicle closes in from 140 m. Alert level escalates:
       > 100 m : All clear
       60–100 m: Vehicle approaching (notice)
       30–60 m : Vehicle closing in (warning)
       < 30 m  : Vehicle very close (danger)
     ===================================================== */
  var CLOSING_KMH = 38;                 // demo vehicle's closing speed
  var CLOSING_MS = CLOSING_KMH / 3.6;   // in m/s

  var slider = document.getElementById("distSlider");
  var distValue = document.getElementById("distValue");
  var car = document.getElementById("demoCar");
  var cone = document.getElementById("radarCone");
  var road = car.parentElement;
  var panel = document.getElementById("alertPanel");
  var stateEl = document.getElementById("alertState");
  var descEl = document.getElementById("alertDesc");
  var speedEl = document.getElementById("closingSpeed");
  var timeEl = document.getElementById("timeToReach");
  var lightEl = document.getElementById("lightMode");
  var playBtn = document.getElementById("playBtn");

  var STATES = {
    clear: {
      name: "All clear",
      desc: "No vehicles behind you. The tail light runs in steady eco mode and the display stays quiet.",
      light: "Steady · Eco"
    },
    notice: {
      name: "Vehicle approaching",
      desc: "Radar picked up a vehicle behind you. A marker appears on your display and the light switches to alert mode.",
      light: "Steady · Alert"
    },
    warning: {
      name: "Vehicle closing in",
      desc: "The vehicle is gaining on you. You get audio beeps and an on-screen position bar; the tail light starts flashing.",
      light: "Flashing · Fast"
    },
    danger: {
      name: "Vehicle very close",
      desc: "The vehicle is right behind you. Maximum-volume alerts, a flashing screen edge, and a rapid strobe make sure both of you know it.",
      light: "Flashing · Rapid strobe"
    }
  };

  function stateFor(d) {
    if (d > 100) return "clear";
    if (d > 60) return "notice";
    if (d > 30) return "warning";
    return "danger";
  }

  var currentState = null;
  function render(distance) {
    var d = Math.max(0, Math.min(140, distance));
    slider.value = Math.round(d);
    distValue.textContent = Math.round(d);

    /* move the car: 140 m = near the top of the road, 0 m = at the rider */
    var roadH = road.clientHeight || 430;
    var top = 10 + (1 - d / 140) * roadH * 0.55;
    car.style.top = top + "px";

    /* radar cone brightens as the vehicle gets closer */
    cone.style.opacity = d > 100 ? "0.35" : d > 60 ? "0.6" : d > 30 ? "0.85" : "1";

    var s = stateFor(d);
    if (s !== currentState) {
      currentState = s;
      panel.setAttribute("data-state", s);
      stateEl.textContent = STATES[s].name;
      descEl.textContent = STATES[s].desc;
      lightEl.textContent = STATES[s].light;
    }
    if (s === "clear") {
      speedEl.textContent = "— km/h";
      timeEl.textContent = "— s";
    } else {
      speedEl.textContent = CLOSING_KMH + " km/h";
      timeEl.textContent = (d / CLOSING_MS).toFixed(1) + " s";
    }
  }

  /* play / pause animation (vehicle approaches at CLOSING_MS, sped up x2 for the demo) */
  var playing = false;
  var rafId = null;
  var lastTs = null;
  var distance = 140;
  var SPEED_UP = 2.2;

  function step(ts) {
    if (!playing) return;
    if (lastTs === null) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;
    distance -= CLOSING_MS * SPEED_UP * dt;
    if (distance <= 6) {
      distance = 6;
      render(distance);
      stopPlay();
      playBtn.textContent = "↺ Replay approach";
      return;
    }
    render(distance);
    rafId = requestAnimationFrame(step);
  }

  function startPlay() {
    if (distance <= 6) distance = 140;      // replay from the top
    playing = true;
    lastTs = null;
    playBtn.textContent = "❚❚ Pause";
    rafId = requestAnimationFrame(step);
  }

  function stopPlay() {
    playing = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (distance > 6) playBtn.textContent = "▶ Resume";
  }

  playBtn.addEventListener("click", function () {
    if (playing) {
      stopPlay();
    } else {
      startPlay();
    }
  });

  slider.addEventListener("input", function () {
    stopPlay();
    playBtn.textContent = "▶ Play approach";
    distance = parseFloat(slider.value);
    render(distance);
  });

  window.addEventListener("resize", function () { render(distance); });
  render(140);

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var body = item.querySelector(".faq-a");
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      /* close any open item */
      document.querySelectorAll(".faq-item.open").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-a").style.maxHeight = "0px";
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
})();
