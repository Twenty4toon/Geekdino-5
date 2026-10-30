/* ==========================================================
   WorkTab V – Geek Dino
   Requires data.js (loaded first)
   ========================================================== */

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)").matches;
const clamp = (x) => Math.max(0, Math.min(1, x));

root.classList.add("js");

/* ---------- Tabs helper ---------- */
function buildTabs(containerId, list, onSelect) {
  const box = $(containerId);
  list.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.textContent = item[0];
    btn.setAttribute("role", "tab");
    btn.onclick = () => {
      [...box.children].forEach((c, j) => c.setAttribute("aria-selected", j === i));
      onSelect(i);
    };
    box.appendChild(btn);
  });
  box.children[0].click();
}

/* ---------- Feature explorer ---------- */
function featureViz(key) {
  if (key === "cores")
    return '<div class="cores">' + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<i style="--i:${i}"></i>`).join("") + "</div>";
  if (key === "screen") return '<div class="scr">8.4″ HD IPS</div>';
  if (key === "bat") return '<div class="bat"><b id="bf"></b></div>';
  if (key === "sig")
    return '<div class="sig">' + [1, 2, 3, 4].map((i) => `<i style="--i:${i}"></i>`).join("") +
      '</div><b class="sig-label-sm">4G LTE</b>';
  if (key === "lock")
    return '<div class="apps"><span>Learn</span><span id="g">Games</span><span id="s">Social</span></div>' +
      '<button class="sw" id="sw" aria-pressed="false">Parental controls: off</button>';
  return '<input type="range" id="rg" min="32" max="512" step="32" value="256" aria-label="Memory card size">' +
    '<b id="rv" class="range-label">256 GB card</b>';
}

function initFeatures() {
  buildTabs("stabs", FEATURES, (i) => {
    const [, big, text, key] = FEATURES[i];
    $("sbig").textContent = big;
    $("stxt").textContent = text;
    $("sviz").innerHTML = featureViz(key);

    if (key === "bat") setTimeout(() => { $("bf").style.width = "100%"; }, 50);

    if (key === "lock") {
      $("sw").onclick = function () {
        const on = this.getAttribute("aria-pressed") !== "true";
        this.setAttribute("aria-pressed", on);
        this.textContent = "Parental controls: " + (on ? "on" : "off");
        $("g").className = $("s").className = on ? "off" : "";
      };
    }

    if (key === "sto") {
      $("rg").oninput = function () { $("rv").textContent = this.value + " GB card"; };
    }
  });
}

/* ---------- Solutions (use cases) ---------- */
function initSolutions() {
  buildTabs("utabs", USE_CASES, (i) => {
    const [name, desc, rows] = USE_CASES[i];
    $("ubig").textContent = name;
    $("utxt").textContent = desc;
    $("umock").innerHTML = `<h3>${name}</h3>` + rows.map((r) => `<div>${r}</div>`).join("");
  });

  // Home page card grid
  $("hgrid").innerHTML = USE_CASES.map(
    (u, i) => `<a class="card rv delay-${i % 3}" href="#solutions"><h3>${u[0]}</h3><p>${u[1]}</p></a>`
  ).join("");

  // Quote form select
  const select = document.querySelector("#qf select");
  USE_CASES.forEach((u) => {
    const o = document.createElement("option");
    o.textContent = u[0];
    select.appendChild(o);
  });
}

/* ---------- Blog ---------- */
function initBlog() {
  buildTabs("btabs", BLOG_CATEGORIES.map((c) => [c]), (i) => {
    const cat = BLOG_CATEGORIES[i];
    $("bgrid").innerHTML = BLOG_POSTS
      .filter((b) => cat === "All" || b[0] === cat)
      .map((b) => `<div class="card"><p>${b[0]}</p><h3>${b[1]}</h3><p>${b[2]}</p></div>`)
      .join("");
  });
}

/* ---------- Quote form → WhatsApp ---------- */
function initQuoteForm() {
  $("qf").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const msg =
      "Hi Geek Dino, I’d like a quote for WorkTab V.\n" +
      `Name: ${f.n.value}\nPhone: ${f.p.value}\nUse case: ${f.u.value}\nQuantity: ${f.c.value}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };
}

/* ---------- Hero pointer tilt ---------- */
function initHeroTilt() {
  const hero = document.querySelector(".hero");
  const tab = $("tab");
  if (reducedMotion) return;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    hero.style.setProperty("--mx", x * 100 + "%");
    hero.style.setProperty("--my", y * 100 + "%");
    tab.style.transform = `rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 8}deg)`;
  });
}

/* ---------- Counters & scroll reveal ---------- */
function animateCount(el) {
  const to = +el.dataset.to;
  const decimals = +el.dataset.d || 0;
  const suffix = el.dataset.s || "";
  const t0 = performance.now();
  (function frame(now) {
    const k = reducedMotion ? 1 : Math.min(1, (now - t0) / 1400);
    el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(decimals) + suffix;
    if (k < 1) requestAnimationFrame(frame);
  })(t0);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    observer.unobserve(e.target);
    e.target.classList.add("in");
    if (e.target.dataset.to) animateCount(e.target);
  });
}, { threshold: 0.25 });

function watchReveals() {
  document.querySelectorAll("main.on .rv:not(.in), main.on [data-to]:not(.in)").forEach((el) => {
    if (reducedMotion) {
      el.classList.add("in");
      if (el.dataset.to) animateCount(el);
    } else {
      observer.observe(el);
    }
  });
}

/* ---------- Hash router (one <main> per page) ---------- */
let currentPage;

function showPage(page) {
  currentPage = page;
  document.querySelectorAll("main").forEach((m) => m.classList.toggle("on", m.id === page));
  document.querySelectorAll("nav a.l").forEach((a) =>
    a.setAttribute("aria-current", a.getAttribute("href") === "#" + page ? "page" : "false")
  );
  watchReveals();
}

function route() {
  const hash = location.hash.slice(1) || "home";
  if (PAGES.includes(hash)) {
    showPage(hash);
    scrollTo(0, 0);
  } else {
    if (!currentPage) showPage("home");
    const target = $(hash);
    if (target) target.scrollIntoView();
  }
}

/* ---------- Scroll effects ---------- */
let lastY = 0;

function onScroll() {
  const y = scrollY;
  const max = root.scrollHeight - innerHeight;
  const progress = max > 0 ? y / max : 0;
  root.style.setProperty("--p", progress);

  if (!reducedMotion) {
    root.style.setProperty("--sy", y);
    const walker = $("walk");
    walker.style.setProperty("--wx", progress * (innerWidth - 60) + "px");
    if (Math.abs(y - lastY) > 2) {
      walker.style.setProperty("--dir", y > lastY ? 1 : -1);
      lastY = y;
    }
  }

  // Pinned Work / Learn / Play / Connect story
  const story = $("scrolly");
  if (story && story.offsetParent) {
    const r = story.getBoundingClientRect();
    const q = clamp(-r.top / (r.height - innerHeight));
    const active = Math.min(3, Math.floor(q * 4));
    story.querySelectorAll(".words>div,.sc").forEach((el, j) => el.classList.toggle("on", j % 4 === active));
    story.querySelectorAll(".rail b").forEach((b, j) => b.style.setProperty("--f", clamp(q * 4 - j)));
    const dev = story.querySelector(".dev");
    dev.style.setProperty("--ry", -20 + 40 * q + "deg");
    dev.style.setProperty("--sc", 0.9 + 0.2 * q);
  }
}

/* ---------- Init ---------- */
initFeatures();
initSolutions();
initBlog();
initQuoteForm();
initHeroTilt();

addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
addEventListener("hashchange", route);
route();
onScroll();
