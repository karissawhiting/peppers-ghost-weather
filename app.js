// ---- Settings: edit these, push, reload ----
// "none" | "horizontal" | "vertical" | "both"
const FLIP = "none";
// Degrees to turn the page so it reads wide: 90 or -90 (use 0 to stay portrait)
const ROTATE = 90;
// --------------------------------------------

const stage = document.getElementById("stage");
const statusEl = document.getElementById("status");
const versionEl = document.getElementById("version");
const tempEl = document.getElementById("temp");
const conditionEl = document.getElementById("condition");
const stateBarEl = document.getElementById("state-bar");
const stateNameEl = document.getElementById("state-name");
const updatedTextEl = document.getElementById("updated-text");

// Label colour per state (look only; values come from the live data)
const STATE_COLORS = {
  sun: "#ffb000",
  clouds: "#9a9a9a",
  rain: "#2f8cff",
  snow: "#ffffff",
  night: "#6a5cff",
};
const DEFAULT_STATE = "clouds"; // shown only until the first fetch succeeds

// Test images (?image=1): 0 to 1, lower keeps the text easier to read
const IMAGE_OPACITY = 0.7;
const IMAGE_DIR = "assets/test/";

// Test clips (?video=1), on black so they blend away in the reflection
const VIDEO_OPACITY = 0.85;
const VIDEOS = {
  clouds: ["assets/clouds.mp4", "assets/clouds2.mp4"],
  night: ["assets/night.mp4"],
};

// Location and timing: Long Island City, Queens
const LAT = 40.74;
const LON = -73.95;
const TIMEZONE = "America/New_York";
const REFRESH_MS = 15 * 60 * 1000;
const STALE_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15 * 1000;

const dotEl = document.getElementById("dot");
const bgEl = document.getElementById("bg");
const videoEl = document.getElementById("bgvideo");

// Optional ?flip= override for quick tests in Safari (not kept in the Home Screen app)
const params = new URLSearchParams(location.search);
const flipSetting = params.get("flip") || FLIP;
const flipNames = { none: "none", h: "horizontal", v: "vertical", both: "both" };
const flip = flipNames[flipSetting] || flipSetting;

// ?state=sun|clouds|rain|snow|night forces the state look (testing); live text still shows
const stateKey = params.get("state");
const stateOverride = STATE_COLORS[stateKey] ? stateKey : null;

// ---- Live data ----
let lastOkMs = null; // phone clock time of the last good fetch
let lastData = null; // last good "current" block
let failureCount = 0;
let refreshTimer = null;
let fetching = false;

function currentStateName() {
  if (stateOverride) return stateOverride;
  if (!lastData) return DEFAULT_STATE;
  return Weather.stateFromWeather(lastData.weather_code, lastData.is_day);
}

// Background: ?video=1 plays the state's clip (falls back to the still image),
// ?image=1 shows the still image only. ?clip=2 picks the second clip if there is one.
function setSrc(el, src) {
  const current = el.getAttribute("src");
  if (!current || !current.endsWith(src)) {
    el.setAttribute("src", src);
  }
}

function showStill(name) {
  videoEl.hidden = true;
  setSrc(bgEl, IMAGE_DIR + name + ".png");
  bgEl.style.opacity = IMAGE_OPACITY;
  bgEl.hidden = false;
}

function showBackground(name) {
  const wantVideo = params.get("video") === "1";
  const wantImage = params.get("image") === "1";
  if (!wantVideo && !wantImage) return;

  const clips = VIDEOS[name] || [];
  const clipIndex = params.get("clip") === "2" ? 1 : 0;
  const clip = clips[clipIndex] || clips[0];

  if (!wantVideo || !clip) {
    showStill(name);
    return;
  }
  bgEl.hidden = true;
  setSrc(videoEl, clip);
  videoEl.style.opacity = VIDEO_OPACITY;
  videoEl.hidden = false;
  // Autoplay can be blocked (for example Low Power Mode): fall back to the still
  const started = videoEl.play();
  if (started && started.catch) {
    started.catch(function() {
      showStill(name);
    });
  }
}

function render() {
  const name = currentStateName();
  const color = STATE_COLORS[name];
  stateBarEl.style.background = color;
  stateNameEl.textContent = name;
  stateNameEl.style.color = color;

  showBackground(name);

  if (lastData) {
    tempEl.textContent = Math.round(lastData.temperature_2m) + "°";
    conditionEl.textContent = Weather.conditionWord(lastData.weather_code, lastData.is_day);
    updatedTextEl.textContent = "updated " + Weather.formatUpdated(lastData.time);
  } else {
    tempEl.textContent = "--°";
    conditionEl.textContent = "Loading";
    updatedTextEl.textContent = "waiting for data";
  }

  // Dot: grey = no data yet, green = fresh, red = stale
  if (!lastData) {
    dotEl.style.background = "#666";
  } else if (Weather.isStale(lastOkMs, Date.now(), STALE_MS)) {
    dotEl.style.background = "#e33";
  } else {
    dotEl.style.background = "#3c3";
  }
  versionEl.textContent = describeVersion();
}

function scheduleRefresh(delayMs) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(fetchWeather, delayMs);
}

async function fetchWeather() {
  if (fetching) return;
  fetching = true;
  const controller = new AbortController();
  const timeout = setTimeout(function() {
    controller.abort();
  }, FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(Weather.buildUrl(LAT, LON, TIMEZONE), {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const current = Weather.parseCurrent(await response.json());
    if (!current) throw new Error("unexpected response");
    lastData = current;
    lastOkMs = Date.now();
    failureCount = 0;
    scheduleRefresh(REFRESH_MS);
  } catch (err) {
    // Keep the last values and try again soon
    failureCount += 1;
    scheduleRefresh(Weather.retryDelayMs(failureCount));
  } finally {
    clearTimeout(timeout);
    fetching = false;
    render();
  }
}

function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const turned = ROTATE === 90 || ROTATE === -90;
  const stageW = turned ? h : w;
  const stageH = turned ? w : h;
  const scaleX = flip === "horizontal" || flip === "both" ? -1 : 1;
  const scaleY = flip === "vertical" || flip === "both" ? -1 : 1;

  stage.style.width = stageW + "px";
  stage.style.height = stageH + "px";
  stage.style.marginLeft = -stageW / 2 + "px";
  stage.style.marginTop = -stageH / 2 + "px";
  // Flip is applied after rotation so it acts on the wide image
  stage.style.transform =
    "scale(" + scaleX + "," + scaleY + ") rotate(" + ROTATE + "deg)";

  // Temperature shrinks if the stage is shorter than expected (floor ~140 px letters)
  const tempSize = Math.max(195, Math.min(220, Math.round(stageH * 0.56)));
  tempEl.style.fontSize = tempSize + "px";
}

// ---- Wake Lock ----
let wakeLock = null;

function setStatus(text) {
  statusEl.textContent = "wake lock: " + text;
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) {
    setStatus("unsupported");
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    setStatus("on");
    wakeLock.addEventListener("release", function() {
      setStatus("off");
    });
  } catch (err) {
    setStatus("off (" + err.name + ")");
  }
}

document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "visible") {
    requestWakeLock();
    // Refresh if data is older than one interval (timers can pause while hidden)
    if (lastOkMs === null || Date.now() - lastOkMs > REFRESH_MS) {
      fetchWeather();
    }
    render();
  }
});

// ---- Version label ----
function describeVersion() {
  const ua = navigator.userAgent;
  const ios = ua.match(/OS (\d+)[_.](\d+)(?:[_.](\d+))?/);
  const iosText = ios
    ? "iOS " + ios[1] + "." + ios[2] + (ios[3] ? "." + ios[3] : "")
    : "iOS ?";
  const standalone = navigator.standalone === true ? "app" : "browser";
  return iosText + " | " + standalone + " | flip " + flip + " | " + currentStateName();
}

render();
layout();
window.addEventListener("resize", layout);
requestWakeLock();
fetchWeather();
// Re-check the stale dot every 30 s
setInterval(render, 30 * 1000);
