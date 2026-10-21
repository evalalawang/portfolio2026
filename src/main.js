import { paintDither } from "./dither.js";
import { language, onLanguage, phrase } from "./i18n.js";

const TOP_BAR = 44;
const DOCK_HEIGHT = 66;
const DOCK_GAP = 16;
const wallpaper = document.querySelector("#wallpaper");
const wallpaperCanvas = document.querySelector("#wallpaper-canvas");
const contactCanvas = document.querySelector("#contact-dither");
const photo = new Image();
photo.src = "/assets/wallpaper.png";

function paintWallpaper() {
  if (!photo.complete || !photo.naturalWidth) return;
  paintDither(photo, wallpaperCanvas, {
    tile: 8,
    levels: 5,
    contrast: 1,
    brightness: 105,
  });
}

function paintContact() {
  if (!photo.complete || !photo.naturalWidth) return;
  paintDither(photo, contactCanvas, {
    tile: 4,
    levels: 7,
    contrast: 1,
    brightness: 113,
  });
}

function paintAll() {
  if (!photo.complete || !photo.naturalWidth) return;
  if (wallpaperCanvas.clientWidth < 2 || contactCanvas.clientWidth < 2) {
    requestAnimationFrame(paintAll);
    return;
  }
  paintWallpaper();
  paintContact();
  document.documentElement.dataset.dither = "ready";
}

photo.addEventListener("load", paintAll);
if (photo.complete) paintAll();

const wallpaperObserver = new ResizeObserver(() => {
  requestAnimationFrame(paintWallpaper);
});
wallpaperObserver.observe(wallpaper);

const timeButton = document.querySelector("#time-button");
const rightWidget = document.querySelector("#right-widget");
const dateEl = document.querySelector("#time-date");
const clockEl = document.querySelector("#time-clock");

function paintTime() {
  const now = new Date();
  if (language() === "zh") {
    const clockParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Vancouver",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const clock = (type) => clockParts.find((item) => item.type === type)?.value ?? "";
    clockEl.textContent = `${clock("hour")}:${clock("minute")}:${clock("second")}`;
  } else {
    const clockParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Vancouver",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(now);
    const clock = (type) => clockParts.find((item) => item.type === type)?.value ?? "";
    clockEl.textContent = `${clock("hour")}:${clock("minute")} ${clock("dayPeriod")}`;
  }
  if (language() === "zh") {
    const parts = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "America/Vancouver",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    }).formatToParts(now);
    const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
    dateEl.textContent = `${part("year")}/${part("month")}/${part("day")} ${part("weekday")}`;
    return;
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Vancouver",
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
  dateEl.textContent = `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")}`;
}

paintTime();
setInterval(paintTime, 1000);

timeButton.addEventListener("click", () => {
  const closed = rightWidget.classList.toggle("is-closed");
  timeButton.setAttribute("aria-expanded", closed ? "false" : "true");
});

const songs = {
  chill: {
    title: "Lo Fi Chill",
    artist: "Prettyjohn1",
    art: "/assets/album-chill.png",
    src: "/audio/lo-fi-chill.mp3",
  },
  lofi: {
    title: "Lo Fi",
    artist: "ZephiraMusic",
    flat: true,
    src: "/audio/lo-fi.mp3",
  },
  synth: {
    title: "Synth Pop - Synth Pop Music",
    artist: "JonasBlakewood",
    art: "/assets/album-synth.png",
    href: "https://pixabay.com/music/synth-pop-synth-pop-synth-pop-music-583369/",
    src: "/audio/synth-pop.mp3",
  },
};

const audio = new Audio();
let currentId = "chill";
const playButton = document.querySelector("#play");
const fill = document.querySelector("#player-fill");
const artEl = document.querySelector("#player-art");
const titleEl = document.querySelector("#player-title");
const artistEl = document.querySelector("#player-artist");

function showWidget() {
  rightWidget.classList.remove("is-closed");
  timeButton.setAttribute("aria-expanded", "true");
}

function setPlaying(on) {
  playButton.classList.toggle("is-on", on);
  playButton.setAttribute("aria-label", on ? "Pause" : "Play");
  playButton.setAttribute("aria-pressed", on ? "true" : "false");
}

function paintBar() {
  const track = fill.parentElement;
  if (!audio.duration || audio.currentTime <= 0) {
    fill.style.width = "1px";
    return;
  }
  if (audio.ended || audio.currentTime >= audio.duration) {
    fill.style.width = "100%";
    return;
  }
  fill.style.width = `${Math.max(1, (audio.currentTime / audio.duration) * track.clientWidth)}px`;
}

function applySong(id) {
  const song = songs[id];
  currentId = id;
  titleEl.textContent = song.title;
  artistEl.textContent = song.artist;
  if (song.href) {
    titleEl.href = song.href;
    titleEl.target = "_blank";
    titleEl.rel = "noreferrer";
  } else {
    titleEl.removeAttribute("href");
    titleEl.removeAttribute("target");
    titleEl.removeAttribute("rel");
  }
  artEl.classList.toggle("is-flat", Boolean(song.flat));
  artEl.style.backgroundImage = song.art ? `url("${song.art}")` : "";
}

function loadSong(id, autoplay) {
  const song = songs[id];
  applySong(id);
  const next = new URL(song.src, window.location.href).href;
  if (audio.src !== next) audio.src = song.src;
  audio.currentTime = 0;
  fill.style.width = "1px";
  if (autoplay) {
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  } else {
    audio.pause();
    setPlaying(false);
  }
}

function chooseSong(id) {
  showWidget();
  loadSong(id, true);
}

playButton.addEventListener("click", () => {
  if (!audio.src) audio.src = songs[currentId].src;
  if (audio.paused) {
    if (audio.ended) {
      audio.currentTime = 0;
      fill.style.width = "1px";
    }
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  } else {
    audio.pause();
    setPlaying(false);
  }
});

audio.addEventListener("timeupdate", paintBar);
audio.addEventListener("ended", () => {
  fill.style.width = "100%";
  setPlaying(false);
});

document.querySelectorAll("[data-song]").forEach((button) => {
  button.addEventListener("click", () => chooseSong(button.dataset.song));
});

const GRAB = 40;

function clamp(el, x, y) {
  const width = el.offsetWidth;
  const minX = GRAB - width;
  const maxX = window.innerWidth - GRAB;
  const minY = TOP_BAR;
  const maxY = Math.max(minY, window.innerHeight - DOCK_GAP - DOCK_HEIGHT - GRAB);
  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(minY, y), maxY),
  };
}

const FOLDERS = {
  portfolio: { title: "Portfolio folder", x: 380, y: 222 },
  memory: { title: "memory folder", x: 393, y: 190 },
  music: { title: "music folder", x: 500, y: 250 },
};

const windows = [...document.querySelectorAll(".finder")];
const panePark = document.querySelector(".pane-park");
const panes = Object.fromEntries(
  [...document.querySelectorAll(".pane")].map((pane) => [pane.dataset.pane, pane]),
);

const DOCK_Z = 40;
let windowZ = 28;

function findOpen(id) {
  return windows.find((win) => !win.hidden && win.dataset.folder === id) ?? null;
}

function layerItems() {
  return [...document.querySelectorAll(".finder, .projects, .sketch")];
}

function raise(win) {
  windowZ += 1;
  if (windowZ >= DOCK_Z) {
    const ordered = layerItems()
      .filter((item) => !item.hidden)
      .sort((a, b) => Number(a.style.zIndex || 0) - Number(b.style.zIndex || 0));
    let z = 28;
    ordered.forEach((item) => {
      if (item === win) return;
      z += 1;
      item.style.zIndex = String(z);
    });
    windowZ = Math.min(z + 1, DOCK_Z - 1);
  }
  win.style.zIndex = String(windowZ);
}

function showFolder(win, id) {
  if (win.classList.contains("is-lightbox")) shrinkFolder(win);
  const body = win.querySelector(".finder__body");
  const current = body.querySelector(".pane");
  if (current && current.dataset.pane !== id) panePark.append(current);
  body.append(panes[id]);
  win.dataset.folder = id;
  win.setAttribute("aria-label", phrase(FOLDERS[id].title));
  win.querySelector(".finder__title").textContent = phrase(FOLDERS[id].title);
  win.querySelectorAll(".side__item").forEach((item) => {
    const on = item.dataset.open === id;
    item.classList.toggle("is-current", on);
    item.setAttribute("aria-current", on ? "true" : "false");
  });
}

function openFromDesktop(id) {
  if (isPhone() && sheetOpen()) return;
  const existing = findOpen(id);
  if (existing) {
    raise(existing);
    return;
  }
  const win = windows.find((item) => item.hidden);
  if (!win) return;
  win.hidden = false;
  if (isPhone()) {
    win.style.left = "0px";
    win.style.top = "44px";
    win.style.width = "100%";
    win.style.height = "calc(100% - 44px)";
  } else {
    win.style.left = `${FOLDERS[id].x}px`;
    win.style.top = `${FOLDERS[id].y}px`;
  }
  showFolder(win, id);
  raise(win);
  markSheet();
}

function openFromSidebar(win, id) {
  const existing = findOpen(id);
  if (existing) {
    raise(existing);
    return;
  }
  showFolder(win, id);
  raise(win);
}

document.querySelectorAll(".finder__close").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const win = button.closest(".finder");
    win.hidden = true;
    win.classList.remove("is-lightbox", "is-sizing");
    win.style.removeProperty("width");
    win.style.removeProperty("height");
    markSheet();
  });
});

document.querySelectorAll(".side__item").forEach((button) => {
  button.addEventListener("click", () => {
    openFromSidebar(button.closest(".finder"), button.dataset.open);
  });
});

document.querySelectorAll(".finder").forEach((win) => {
  win.addEventListener("pointerdown", () => {
    if (!win.hidden) raise(win);
  });
});

const DRAG_SLOP = 4;

document.querySelectorAll("[data-drag]").forEach((el) => {
  let pointerId = null;
  let originX = 0;
  let originY = 0;
  let startX = 0;
  let startY = 0;
  let dragged = false;

  el.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (isPhone() && el.matches(".about, .folder, .finder, .projects, .sketch")) return;
    if (event.target.closest("button, a, input, textarea, canvas, .projects__stage, .sketch__foot")) return;
    el.classList.remove("is-sizing");
    const rect = el.getBoundingClientRect();
    originX = event.clientX - rect.left;
    originY = event.clientY - rect.top;
    startX = event.clientX;
    startY = event.clientY;
    dragged = false;
    pointerId = event.pointerId;
    el.setPointerCapture(event.pointerId);
  });

  el.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!dragged && Math.hypot(dx, dy) < DRAG_SLOP) return;
    if (!dragged && el.matches(".finder, .projects, .sketch")) {
      if (el.classList.contains("projects")) el.style.transform = "none";
      raise(el);
    }
    dragged = true;
    el.classList.add("is-dragging");
    const next = clamp(el, event.clientX - originX, event.clientY - originY);
    el.style.left = `${next.x}px`;
    el.style.top = `${next.y}px`;
  });

  function end(event) {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    el.classList.remove("is-dragging");
    if (!dragged && el.dataset.open) openFromDesktop(el.dataset.open);
  }

  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
});

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-drag]").forEach((el) => {
    el.style.removeProperty("left");
    el.style.removeProperty("top");
    el.style.removeProperty("transform");
  });
});

function bindHover(el) {
  let armed = true;
  el.addEventListener("pointerenter", () => {
    if (armed) el.classList.add("is-hot");
  });
  el.addEventListener("pointerleave", () => {
    armed = true;
    el.classList.remove("is-hot");
  });
  const clear = () => {
    el.classList.remove("is-hot");
    armed = false;
  };
  el.addEventListener("pointerdown", clear);
  el.addEventListener("dblclick", clear);
}

document.querySelectorAll(".folder, .file, .trip, .project, .side__item").forEach(bindHover);

document.querySelector("#restart").addEventListener("click", () => {
  document.querySelectorAll("[data-drag]").forEach((el) => {
    el.style.removeProperty("left");
    el.style.removeProperty("top");
    el.style.removeProperty("transform");
    el.classList.remove("is-dragging");
  });
  windows.forEach((win) => {
    win.hidden = true;
    win.classList.remove("is-lightbox", "is-sizing");
    win.style.removeProperty("width");
    win.style.removeProperty("height");
  });
  markSheet();
});

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll("[data-panel]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.dataset.section;
    tabs.forEach((item) => {
      const on = item === tab;
      item.classList.toggle("tab--on", on);
      item.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
  });
});

const pointer = document.querySelector("#pointer");
const tipX = 7.2;
const tipY = 7.7;

function placePointer(x, y) {
  pointer.style.transform = `translate(${x - tipX}px, ${y - tipY}px) rotate(-42deg)`;
}

function hidePointer() {
  pointer.hidden = true;
}

function insideViewport(x, y) {
  return x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
}

window.addEventListener("pointermove", (event) => {
  if (isPhone()) {
    hidePointer();
    return;
  }
  if (!insideViewport(event.clientX, event.clientY)) {
    hidePointer();
    return;
  }
  pointer.hidden = false;
  placePointer(event.clientX, event.clientY);
});

document.documentElement.addEventListener("pointerleave", hidePointer);
document.addEventListener("mouseout", (event) => {
  if (!event.relatedTarget) hidePointer();
});

const projects = document.querySelector("#projects");
const sketch = document.querySelector("#sketch");
const projectTabs = document.querySelectorAll(".projects__tab");
const studies = document.querySelectorAll(".study");
const scroller = document.querySelector("#projects-scroll");
const jumps = document.querySelectorAll(".projects__nav button");
const defaultNav = [
  ["overview", "Overview"],
  ["challenge", "Challenge"],
  ["decision", "Decision"],
  ["design", "Design"],
  ["outcome", "Outcome"],
];
const projectNav = {
  website: [
    ["overview", "Overview"],
    ["concept", "Creative concept"],
    ["design", "Design"],
    ["outcome", "Outcome"],
  ],
  experiment: [
    ["overview", "Overview"],
    ["project-1", "Project 1"],
    ["project-2", "Project 2"],
    ["outcome", "Outcome"],
  ],
};

function navLabel(english) {
  const zh = {
    Overview: "概述",
    Challenge: "挑战",
    Decision: "决策",
    Design: "设计",
    Outcome: "成果",
    "Creative concept": "创意概念",
    "Project 1": "情感物件",
    "Project 2": "小池",
  };
  return language() === "zh" ? zh[english] || english : english;
}

let currentProject = "honor";

function applyNav(project) {
  currentProject = project;
  const items = projectNav[project] || defaultNav;
  jumps.forEach((button, index) => {
    const item = items[index];
    const icon = button.querySelector("i");
    button.hidden = !item;
    if (!item) {
      button.dataset.jump = "";
      button.classList.remove("is-on");
      return;
    }
    button.dataset.jump = item[0];
    button.replaceChildren(icon, navLabel(item[1]));
    button.classList.toggle("is-on", item[0] === "overview");
  });
}
const canvas = document.querySelector("#sketch-canvas");
const ctx = canvas.getContext("2d");
let strokes = [];
let currentStroke = null;
let ink = "#FD882B";

function openProjects() {
  if (isPhone() && projects.hidden && sheetOpen()) return;
  if (isPhone()) projects.classList.remove("is-reading");
  projects.hidden = false;
  raise(projects);
  markSheet();
}

function resetStudyScroll() {
  scroller.scrollTop = 0;
  projects.scrollTop = 0;
}

function showStudy(id) {
  projectTabs.forEach((tab) => {
    const on = tab.dataset.project === id;
    tab.classList.toggle("is-on", on);
    tab.setAttribute("aria-selected", on ? "true" : "false");
  });
  studies.forEach((study) => {
    study.hidden = study.dataset.project !== id;
  });
  applyNav(id);
  if (isPhone()) projects.classList.add("is-reading");
  resetStudyScroll();
  requestAnimationFrame(resetStudyScroll);
}

function resetStudy() {
  projectTabs.forEach((tab) => {
    const on = tab.dataset.project === "honor";
    tab.classList.toggle("is-on", on);
    tab.setAttribute("aria-selected", on ? "true" : "false");
  });
  studies.forEach((study) => {
    study.hidden = study.dataset.project !== "honor";
  });
  applyNav("honor");
  scroller.scrollTop = 0;
  const compare = document.querySelector(".compare");
  if (compare) {
    compare.dataset.mode = "before";
    compare.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.mode === "before");
    });
  }
}

document.querySelector("#open-projects").addEventListener("click", openProjects);
document.querySelector("#open-projects-file").addEventListener("click", (event) => {
  event.stopPropagation();
  openProjects();
});

document.querySelector(".projects__close").addEventListener("click", () => {
  projects.hidden = true;
  projects.classList.remove("is-reading");
  markSheet();
});

document.querySelectorAll("[data-study]").forEach((button) => {
  button.addEventListener("click", () => showStudy(button.dataset.study));
});

document.querySelector(".study-back").addEventListener("click", () => {
  resetStudyScroll();
  projects.classList.remove("is-reading");
});

projects.addEventListener("pointerdown", () => {
  if (!projects.hidden) raise(projects);
});

projectTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.dataset.project;
    projectTabs.forEach((item) => {
      const on = item === tab;
      item.classList.toggle("is-on", on);
      item.setAttribute("aria-selected", on ? "true" : "false");
    });
    studies.forEach((study) => {
      study.hidden = study.dataset.project !== id;
    });
    scroller.scrollTop = 0;
    applyNav(id);
  });
});

let jumpLock = false;

jumps.forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.jump;
    jumps.forEach((item) => item.classList.toggle("is-on", item === button));
    const study = scroller.querySelector(".study:not([hidden])");
    const target = study?.querySelector(`[data-section="${id}"]`);
    if (!target) return;
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    jumpLock = true;
    scroller.scrollTo({ top, behavior: "smooth" });
  });
});

function spyNav() {
  if (jumpLock) return;
  const study = scroller.querySelector(".study:not([hidden])");
  if (!study) return;
  const edge = scroller.getBoundingClientRect().top + 24;
  let current = "overview";
  study.querySelectorAll("[data-section]").forEach((section) => {
    if (section.getBoundingClientRect().top <= edge) current = section.dataset.section;
  });
  jumps.forEach((item) => item.classList.toggle("is-on", item.dataset.jump === current));
}

document.querySelectorAll(".study-video").forEach((video) => {
  video.controls = false;
  video.addEventListener("error", () => {
    if (video.dataset.missing === "true") return;
    video.dataset.missing = "true";
    video.removeAttribute("src");
    video.load();
  });
});

scroller.addEventListener("scroll", spyNav, { passive: true });
scroller.addEventListener("scrollend", () => {
  jumpLock = false;
});
scroller.addEventListener("wheel", () => {
  jumpLock = false;
}, { passive: true });
scroller.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".projects__nav")) return;
  jumpLock = false;
});

document.querySelectorAll(".compare__switch button").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.closest(".compare");
    panel.dataset.mode = button.dataset.mode;
    panel.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("is-on", item === button);
    });
  });
});

function paintSketch() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  strokes.forEach((stroke) => {
    if (!stroke.points.length) return;
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    if (stroke.points.length === 1) {
      ctx.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y);
    } else {
      stroke.points.forEach((point) => ctx.lineTo(point.x, point.y));
    }
    ctx.stroke();
  });
}

function openSketch() {
  if (isPhone() && sketch.hidden && sheetOpen()) return;
  sketch.hidden = false;
  raise(sketch);
  markSheet();
  requestAnimationFrame(() => requestAnimationFrame(paintSketch));
}

const noteThumb = document.querySelector("#note-thumb");
noteThumb.addEventListener("click", openSketch);
noteThumb.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openSketch();
});

document.querySelector(".sketch__close").addEventListener("click", () => {
  sketch.hidden = true;
  markSheet();
});

sketch.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  if (!sketch.hidden) raise(sketch);
});

function sketchPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  canvas.setPointerCapture(event.pointerId);
  currentStroke = { color: ink, points: [sketchPoint(event)] };
  strokes.push(currentStroke);
  paintSketch();
});

canvas.addEventListener("pointermove", (event) => {
  if (!currentStroke || !canvas.hasPointerCapture(event.pointerId)) return;
  currentStroke.points.push(sketchPoint(event));
  paintSketch();
});

function endStroke(event) {
  if (!currentStroke) return;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  currentStroke = null;
}

canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);

document.querySelectorAll(".swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    ink = swatch.dataset.color;
    document.querySelectorAll(".swatch").forEach((item) => {
      item.classList.toggle("is-on", item === swatch);
    });
  });
});

function clearSketch() {
  strokes = [];
  currentStroke = null;
  ink = "#FD882B";
  document.querySelectorAll(".swatch").forEach((item) => {
    item.classList.toggle("is-on", item.dataset.color === ink);
  });
  paintSketch();
}

document.querySelector(".sketch__clear").addEventListener("click", clearSketch);

window.addEventListener("resize", () => {
  if (!sketch.hidden) paintSketch();
});

document.querySelector("#restart").addEventListener("click", () => {
  projects.hidden = true;
  sketch.hidden = true;
  resetStudy();
  clearSketch();
});

const albums = {
  korea: { name: "Korea", count: 9 },
  shaoxing: { name: "Shaoxing", count: 7 },
  vancouver: { name: "Vancouver", count: 5 },
  japan: { name: "Japan", count: 8 },
};
let albumId = "korea";

function tripLabel(name) {
  if (name === "Vancouver") return language() === "zh" ? "温哥华" : name;
  return phrase(name);
}
let photoIndex = 0;
let sliding = false;
const lightboxTrack = document.querySelector(".lightbox__track");

function albumPhoto(offset) {
  const album = albums[albumId];
  const index = (photoIndex + offset + album.count) % album.count;
  return `/trips/${albumId}/${index + 1}.png`;
}

function paintLightbox() {
  const name = albums[albumId].name;
  sliding = false;
  lightboxTrack.classList.remove("is-next", "is-prev");
  lightboxTrack.style.transition = "none";
  lightboxTrack.style.transform = "translateX(0)";
  lightboxTrack.replaceChildren();
  [-2, -1, 0, 1, 2].forEach((offset) => {
    const img = document.createElement("img");
    img.className = "lightbox__photo";
    if (offset === 0) img.classList.add("is-focus");
    if (offset === -1) img.classList.add("is-prev");
    if (offset === 1) img.classList.add("is-next");
    img.src = albumPhoto(offset);
    img.alt = offset === 0 ? `${name} photo ${photoIndex + 1}` : "";
    lightboxTrack.append(img);
  });
  document.querySelectorAll(".finder__crumb-name").forEach((node) => {
    node.textContent = tripLabel(name);
  });
}

function fitWindow(width, height, x, y) {
  const minX = GRAB - width;
  const maxX = window.innerWidth - GRAB;
  const minY = TOP_BAR;
  const maxY = Math.max(minY, window.innerHeight - DOCK_GAP - DOCK_HEIGHT - GRAB);
  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(minY, y), maxY),
  };
}

function resizeFolder(win, width, height) {
  const rect = win.getBoundingClientRect();
  const pos = fitWindow(width, height, rect.left + rect.width / 2 - width / 2, rect.top + rect.height / 2 - height / 2);
  win.classList.add("is-sizing");
  win.style.width = `${width}px`;
  win.style.height = `${height}px`;
  win.style.left = `${pos.x}px`;
  win.style.top = `${pos.y}px`;
  const stop = (event) => {
    if (event.target !== win || event.propertyName !== "width") return;
    win.classList.remove("is-sizing");
    win.removeEventListener("transitionend", stop);
  };
  win.addEventListener("transitionend", stop);
  window.setTimeout(() => win.classList.remove("is-sizing"), 520);
}

function shrinkFolder(win) {
  if (!win.classList.contains("is-lightbox")) return;
  win.classList.remove("is-lightbox");
  if (isPhone()) {
    win.style.removeProperty("width");
    win.style.removeProperty("height");
    win.style.removeProperty("left");
    win.style.removeProperty("top");
    return;
  }
  resizeFolder(win, 720, 480);
}

function openAlbum(id) {
  const win = panes.memory.closest(".finder");
  if (!win || win.hidden) return;
  albumId = id;
  photoIndex = 0;
  paintLightbox();
  if (!isPhone()) {
    const width = Math.min(948, window.innerWidth - 48);
    const height = Math.min(720, window.innerHeight - 96);
    resizeFolder(win, width, height);
  }
  win.classList.add("is-lightbox");
  raise(win);
}

document.querySelectorAll(".trip").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openAlbum(button.dataset.trip);
  });
});

document.querySelectorAll(".finder__crumb-back").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    shrinkFolder(button.closest(".finder"));
  });
});

document.querySelector(".lightbox__back").addEventListener("click", (event) => {
  event.stopPropagation();
  shrinkFolder(panes.memory.closest(".finder"));
});

function stepAlbum(direction) {
  if (isPhone()) {
    const count = albums[albumId].count;
    photoIndex = (photoIndex + direction + count) % count;
    paintLightbox();
    return;
  }
  if (sliding) return;
  const focus = lightboxTrack.querySelector(".lightbox__photo.is-focus");
  if (!focus) return;
  const slot = focus.getBoundingClientRect().width + 12;
  if (!slot) return;
  sliding = true;
  lightboxTrack.classList.add(direction > 0 ? "is-next" : "is-prev");
  lightboxTrack.style.transition = "transform 0.45s ease";
  lightboxTrack.style.transform = `translateX(${-direction * slot}px)`;
  const finish = () => {
    if (!sliding) return;
    sliding = false;
    lightboxTrack.removeEventListener("transitionend", onEnd);
    const count = albums[albumId].count;
    photoIndex = (photoIndex + direction + count) % count;
    paintLightbox();
  };
  const onEnd = (event) => {
    if (event.target !== lightboxTrack || event.propertyName !== "transform") return;
    finish();
  };
  lightboxTrack.addEventListener("transitionend", onEnd);
  window.setTimeout(() => {
    if (sliding) finish();
  }, 520);
}

document.querySelector(".lightbox__arrow--prev").addEventListener("click", (event) => {
  event.stopPropagation();
  stepAlbum(-1);
});
document.querySelector(".lightbox__arrow--next").addEventListener("click", (event) => {
  event.stopPropagation();
  stepAlbum(1);
});

const weatherIcon = document.querySelector("#weather-icon");
const weatherLabel = document.querySelector("#weather-label");
const weatherTemp = document.querySelector("#weather-temp");
let weatherEnglish = "Sunny";

function paintWeatherLabel() {
  weatherLabel.textContent = phrase(weatherEnglish);
}

function weatherFor(code, isDay) {
  const night = !isDay;
  const map = {
    0: night ? ["clear-night", "Clear night"] : ["sunny", "Sunny"],
    1: night ? ["partly-night", "Partly cloudy"] : ["clear-times", "Clear at times"],
    2: night ? ["partly-night", "Partly cloudy"] : ["partly", "Partly cloudy"],
    3: night ? ["cloudy-night", "Cloudy"] : ["cloudy", "Cloudy"],
    45: ["fog", "Fog"],
    48: ["fog", "Fog"],
    51: night ? ["drizzle-night", "Drizzle"] : ["drizzle", "Drizzle"],
    53: night ? ["drizzle-night", "Drizzle"] : ["drizzle", "Drizzle"],
    55: night ? ["drizzle-night", "Drizzle"] : ["drizzle", "Drizzle"],
    56: ["rain", "Sleet"],
    57: ["rain", "Sleet"],
    61: night ? ["rain-night", "Rain"] : ["rain", "Rain"],
    63: night ? ["rain-night", "Rain"] : ["rain", "Rain"],
    65: night ? ["rain-night", "Heavy rain"] : ["rain", "Heavy rain"],
    66: ["rain", "Sleet"],
    67: ["rain", "Sleet"],
    71: ["snow", "Snow"],
    73: ["snow", "Snow"],
    75: ["snow", "Blizzard"],
    77: ["snow", "Snow"],
    80: night ? ["showers-night", "Scattered showers"] : ["showers", "Scattered showers"],
    81: night ? ["showers-night", "Scattered showers"] : ["showers", "Scattered showers"],
    82: night ? ["rain-night", "Heavy rain"] : ["rain", "Heavy rain"],
    85: ["snow", "Snow"],
    86: ["snow", "Blowing snow"],
    95: night ? ["showers-night", "Scattered thunderstorm"] : ["showers", "Scattered thunderstorm"],
    96: ["showers", "Hail"],
    99: night ? ["showers-night", "Severe thunderstorm"] : ["showers", "Severe thunderstorm"],
  };
  return map[code] || (night ? ["cloudy-night", "Cloudy"] : ["cloudy", "Cloudy"]);
}

const GATE_LINES = ["Hello there!", "Welcome to my space."];
const gate = document.querySelector("#gate");
const gateLines = [...gate.querySelectorAll(".gate__line")];
const gateEnter = document.querySelector("#gate-enter");
const mobileQuery = window.matchMedia("(max-width: 768px)");
let gateTimer = 0;
let gateReady = false;
let typedDone = false;
let gateMode = mobileQuery.matches ? "mobile" : "desktop";

function siteReady() {
  return document.readyState === "complete" && document.documentElement.dataset.dither === "ready";
}

function refreshGateReady() {
  gateReady = siteReady() && typedDone;
  gateEnter.disabled = !gateReady;
}

function typeGate() {
  window.clearTimeout(gateTimer);
  typedDone = false;
  gateReady = false;
  gateEnter.disabled = true;
  gateLines.forEach((line) => {
    line.querySelector(".gate__chars").textContent = "";
    line.classList.remove("is-typing");
  });
  let line = 0;
  let count = 0;
  const tick = () => {
    if (line >= GATE_LINES.length) {
      typedDone = true;
      gateLines.forEach((item) => item.classList.remove("is-typing"));
      gateLines.at(-1).classList.add("is-typing");
      refreshGateReady();
      return;
    }
    gateLines.forEach((item, index) => item.classList.toggle("is-typing", index === line));
    count += 1;
    gateLines[line].querySelector(".gate__chars").textContent = GATE_LINES[line].slice(0, count);
    if (count >= GATE_LINES[line].length) {
      line += 1;
      count = 0;
      gateTimer = window.setTimeout(tick, 280);
      return;
    }
    gateTimer = window.setTimeout(tick, 46);
  };
  tick();
}

function openGate() {
  document.documentElement.classList.add("is-gated");
  document.documentElement.classList.remove("is-in");
  gate.hidden = false;
  gate.classList.remove("is-leaving");
  typeGate();
}

function closeGate() {
  if (!gateReady) return;
  document.documentElement.classList.add("is-in");
  requestAnimationFrame(() => {
    document.documentElement.classList.remove("is-gated");
  });
  gate.classList.add("is-leaving");
  const hide = (event) => {
    if (event.propertyName !== "opacity" || event.target !== gate) return;
    gate.hidden = true;
    gate.removeEventListener("transitionend", hide);
  };
  gate.addEventListener("transitionend", hide);
}

gateEnter.addEventListener("click", closeGate);
window.addEventListener("load", refreshGateReady);
document.fonts.ready.then(refreshGateReady);
new MutationObserver(refreshGateReady).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-dither"],
});

mobileQuery.addEventListener("change", (event) => {
  const next = event.matches ? "mobile" : "desktop";
  if (next === "mobile" && gateMode !== "mobile") openGate();
  gateMode = next;
  syncPhone();
});

const phoneWidgets = document.querySelector("#phone-widgets");
const phoneAbout = document.querySelector("#phone-about");
const phoneHome = document.querySelector("#phone-home");
const phoneTrack = document.querySelector("#pager-track");
const aboutCard = document.querySelector("#about");
const headline = document.querySelector(".headline");
const parked = new Map();
let phonePage = 0;

function isPhone() {
  return mobileQuery.matches;
}

function markSheet() {
  document.documentElement.classList.toggle("is-sheet", isPhone() && sheetOpen());
}

function sheetOpen() {
  return Boolean(document.querySelector(".projects:not([hidden]), .sketch:not([hidden]), .finder:not([hidden])"));
}

function park(node, parent) {
  if (!parked.has(node)) parked.set(node, { parent: node.parentElement, next: node.nextSibling });
  parent.append(node);
}

function unpark(node) {
  const spot = parked.get(node);
  if (!spot) return;
  spot.parent.insertBefore(node, spot.next);
}

let heldScroll = [];
let swipeToken = 0;

function syncAppWidth() {
  document.documentElement.style.setProperty("--app-width", `${document.documentElement.clientWidth}px`);
}

function rememberScroll() {
  heldScroll = [...document.querySelectorAll(".pager__view")].map((view) => ({
    view,
    top: view.scrollTop,
  }));
}

function restoreScroll() {
  heldScroll.forEach(({ view, top }) => {
    if (view.scrollTop !== top) view.scrollTop = top;
  });
}

function setPhonePage(index, animate) {
  const next = Math.max(0, Math.min(2, index));
  if (next === 0 && next < phonePage) {
    phoneWidgets.scrollTop = 0;
    heldScroll = heldScroll.map((item) => (item.view === phoneWidgets ? { view: item.view, top: 0 } : item));
  }
  phonePage = next;
  const width = pager.clientWidth || window.innerWidth;
  document.querySelectorAll(".pager__view").forEach((view) => {
    view.style.width = `${width}px`;
  });
  phoneTrack.style.width = `${width * 3}px`;
  phoneTrack.style.transition = animate ? "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)" : "none";
  phoneTrack.style.transform = `translate3d(${-phonePage * width}px, 0, 0)`;
  document.querySelectorAll(".pager-dots button").forEach((dot, dotIndex) => {
    dot.classList.toggle("is-on", dotIndex === phonePage);
    dot.setAttribute("aria-current", dotIndex === phonePage ? "true" : "false");
  });
  document.documentElement.classList.toggle("is-phone-home", isPhone() && phonePage === 2);
  if (!animate) {
    document.documentElement.classList.remove("is-swiping");
    return;
  }
  const token = ++swipeToken;
  document.documentElement.classList.add("is-swiping");
  let released = false;
  const release = (event) => {
    if (event && event.propertyName !== "transform") return;
    phoneTrack.removeEventListener("transitionend", release);
    if (released || token !== swipeToken) return;
    released = true;
    restoreScroll();
    document.documentElement.classList.remove("is-swiping");
  };
  phoneTrack.addEventListener("transitionend", release);
  window.setTimeout(release, 520);
}

function syncPhone() {
  document.documentElement.classList.toggle("is-phone", isPhone());
  if (isPhone()) {
    park(rightWidget, phoneWidgets);
    park(aboutCard, phoneAbout);
    park(headline, phoneHome);
    rightWidget.classList.remove("is-closed");
    if (currentId !== "chill") loadSong("chill", false);
    windows.forEach((win) => {
      win.classList.remove("is-sizing");
      win.style.removeProperty("width");
      win.style.removeProperty("height");
      win.style.removeProperty("left");
      win.style.removeProperty("top");
    });
    setPhonePage(phonePage, false);
    markSheet();
    return;
  }
  unpark(rightWidget);
  unpark(aboutCard);
  unpark(headline);
  phoneTrack.style.removeProperty("width");
  phoneTrack.style.removeProperty("transform");
  document.querySelectorAll(".pager__view").forEach((view) => view.style.removeProperty("width"));
  document.documentElement.classList.remove("is-phone-home", "is-sheet");
}

document.querySelectorAll(".pager-dots button").forEach((dot) => {
  dot.addEventListener("click", () => setPhonePage(Number(dot.dataset.page), true));
});

document.querySelectorAll("[data-sheet]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.sheet === "projects") openProjects();
    if (button.dataset.sheet === "memory") openFromDesktop("memory");
  });
});

const pager = document.querySelector(".pager");
let swipe = null;
pager.addEventListener("pointerdown", (event) => {
  if (!isPhone() || sheetOpen()) return;
  if (event.target.closest("button, a, input, textarea")) return;
  rememberScroll();
  swipeToken += 1;
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: "" };
  try {
    pager.setPointerCapture(event.pointerId);
  } catch (error) {}
});
pager.addEventListener("pointermove", (event) => {
  if (!swipe || swipe.id !== event.pointerId) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  if (!swipe.axis) {
    if (Math.hypot(dx, dy) < 8) return;
    swipe.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (swipe.axis === "x") {
      document.documentElement.classList.add("is-swiping");
      restoreScroll();
    }
  }
  if (swipe.axis !== "x") return;
  event.preventDefault();
  restoreScroll();
  const width = pager.clientWidth || window.innerWidth;
  let shift = -phonePage * width + dx;
  if ((phonePage === 0 && dx > 0) || (phonePage === 2 && dx < 0)) {
    shift = -phonePage * width + dx * 0.35;
  }
  phoneTrack.style.transition = "none";
  phoneTrack.style.transform = `translate3d(${shift}px, 0, 0)`;
});
function endSwipe(event) {
  if (!swipe || swipe.id !== event.pointerId) return;
  const dx = event.clientX - swipe.x;
  const width = pager.clientWidth || window.innerWidth;
  const horizontal = swipe.axis === "x";
  swipe = null;
  if (!horizontal) {
    document.documentElement.classList.remove("is-swiping");
    return;
  }
  restoreScroll();
  if (dx <= -width * 0.18) setPhonePage(phonePage + 1, true);
  else if (dx >= width * 0.18) setPhonePage(phonePage - 1, true);
  else setPhonePage(phonePage, true);
}
pager.addEventListener("pointerup", endSwipe);
pager.addEventListener("pointercancel", endSwipe);
pager.addEventListener("touchmove", (event) => {
  if (swipe && swipe.axis === "x") event.preventDefault();
}, { passive: false });

function onViewportResize() {
  syncAppWidth();
  if (isPhone() && !swipe) setPhonePage(phonePage, false);
}

syncAppWidth();
window.addEventListener("resize", onViewportResize);
window.addEventListener("orientationchange", onViewportResize);

syncPhone();

onLanguage(() => {
  paintTime();
  paintWeatherLabel();
  document.querySelectorAll(".finder").forEach((win) => {
    const id = win.dataset.folder;
    if (!id || !FOLDERS[id]) return;
    win.querySelector(".finder__title").textContent = phrase(FOLDERS[id].title);
    win.setAttribute("aria-label", phrase(FOLDERS[id].title));
  });
  document.querySelectorAll(".finder__crumb-name").forEach((node) => {
    node.textContent = tripLabel(albums[albumId].name);
  });
  applyNav(currentProject);
});

openGate();

fetch("https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&current=temperature_2m,weather_code,is_day&timezone=America%2FVancouver")
  .then((response) => response.json())
  .then((data) => {
    const current = data.current;
    if (!current) return;
    const [icon, label] = weatherFor(current.weather_code, current.is_day === 1);
    weatherEnglish = label;
    weatherTemp.textContent = String(Math.round(current.temperature_2m));
    paintWeatherLabel();
    weatherIcon.src = `/weather/${icon}.svg`;
    weatherIcon.alt = "";
  })
  .catch(() => {});
