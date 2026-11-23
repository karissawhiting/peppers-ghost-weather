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

// Phase 1: hard-coded values per state, no live data yet
const STATES = {
  sun: { temp: 72, condition: "Sunny", color: "#ffb000" },
  clouds: { temp: 61, condition: "Cloudy", color: "#9a9a9a" },
  rain: { temp: 54, condition: "Light rain", color: "#2f8cff" },
  snow: { temp: 28, condition: "Snow", color: "#ffffff" },
  night: { temp: 47, condition: "Clear", color: "#6a5cff" },
};
const DEFAULT_STATE = "sun";
const UPDATED_TEXT = "updated 3:42 PM";

// Optional ?flip= override for quick tests in Safari (not kept in the Home Screen app)
const params = new URLSearchParams(location.search);
const flipSetting = params.get("flip") || FLIP;
const flipNames = { none: "none", h: "horizontal", v: "vertical", both: "both" };
const flip = flipNames[flipSetting] || flipSetting;

// ?state=sun|clouds|rain|snow|night, falls back to the default
const stateKey = params.get("state");
const stateName = STATES[stateKey] ? stateKey : DEFAULT_STATE;

function showState() {
  const state = STATES[stateName];
  tempEl.textContent = state.temp + "°";
  conditionEl.textContent = state.condition;
  stateBarEl.style.background = state.color;
  stateNameEl.textContent = stateName;
  stateNameEl.style.color = state.color;
  updatedTextEl.textContent = UPDATED_TEXT;
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
  return iosText + " | " + standalone + " | flip " + flip + " | " + stateName;
}

versionEl.textContent = describeVersion();
showState();
layout();
window.addEventListener("resize", layout);
requestWakeLock();
