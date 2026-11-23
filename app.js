// ---- Settings: edit these, push, reload ----
// "none" | "horizontal" | "vertical" | "both"
const FLIP = "none";
// Degrees to turn the page so it reads wide: 90 or -90 (use 0 to stay portrait)
const ROTATE = 90;
// --------------------------------------------

const stage = document.getElementById("stage");
const statusEl = document.getElementById("status");
const versionEl = document.getElementById("version");
const letterEl = document.getElementById("letter");
const arrowEl = document.getElementById("arrow");

// Optional ?flip= override for quick tests in Safari (not kept in the Home Screen app)
const params = new URLSearchParams(location.search);
const flipSetting = params.get("flip") || FLIP;
const flipNames = { none: "none", h: "horizontal", v: "vertical", both: "both" };
const flip = flipNames[flipSetting] || flipSetting;

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

  const size = Math.round(stageH * 0.6);
  letterEl.style.fontSize = size + "px";
  arrowEl.style.fontSize = size + "px";
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
  return iosText + " | " + standalone + " | flip " + flip;
}

versionEl.textContent = describeVersion();
layout();
window.addEventListener("resize", layout);
requestWakeLock();
