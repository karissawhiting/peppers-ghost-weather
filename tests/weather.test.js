// Run: node tests/weather.test.js
const assert = require("assert");
const Weather = require("../weather.js");

// URL
const url = Weather.buildUrl(40.74, -73.95, "America/New_York");
assert(url.includes("latitude=40.74&longitude=-73.95"));
assert(url.includes("temperature_unit=fahrenheit"));
assert(url.includes("wind_speed_unit=mph"));
assert(url.includes("timezone=America%2FNew_York"));
assert(url.includes("current=temperature_2m,weather_code,is_day"));

// State mapping
const cases = [
  [0, 1, "sun"], [1, 1, "sun"], [0, 0, "night"], [1, 0, "night"],
  [2, 1, "clouds"], [3, 0, "clouds"], [45, 1, "clouds"], [48, 0, "clouds"],
  [51, 1, "rain"], [61, 0, "rain"], [67, 1, "rain"], [80, 1, "rain"],
  [82, 0, "rain"], [95, 1, "rain"], [99, 0, "rain"],
  [71, 1, "snow"], [77, 0, "snow"], [85, 1, "snow"], [86, 0, "snow"],
  [68, 1, "clouds"], [78, 1, "clouds"], [999, 1, "clouds"],
];
cases.forEach(function(c) {
  assert.strictEqual(Weather.stateFromWeather(c[0], c[1]), c[2], "code " + c[0]);
});

// Every code that maps to a state has a word, unknown codes fall back
assert.strictEqual(Weather.conditionWord(0, 1), "Sunny");
assert.strictEqual(Weather.conditionWord(0, 0), "Clear");
assert.strictEqual(Weather.conditionWord(61, 1), "Light rain");
assert.strictEqual(Weather.conditionWord(3, 0), "Overcast");
assert.strictEqual(Weather.conditionWord(999, 1), "Cloudy");

// Time formatting
assert.strictEqual(Weather.formatUpdated("2026-11-23T02:00"), "2:00 AM");
assert.strictEqual(Weather.formatUpdated("2026-11-23T14:05"), "2:05 PM");
assert.strictEqual(Weather.formatUpdated("2026-11-23T00:15"), "12:15 AM");
assert.strictEqual(Weather.formatUpdated("2026-11-23T12:00"), "12:00 PM");
assert.strictEqual(Weather.formatUpdated("junk"), "");

// Stale logic
const STALE = 60 * 60 * 1000;
assert.strictEqual(Weather.isStale(null, 1000, STALE), false);
assert.strictEqual(Weather.isStale(0, STALE, STALE), false);
assert.strictEqual(Weather.isStale(0, STALE + 1, STALE), true);

// Retry delays
assert.strictEqual(Weather.retryDelayMs(1), 60000);
assert.strictEqual(Weather.retryDelayMs(2), 120000);
assert.strictEqual(Weather.retryDelayMs(3), 300000);
assert.strictEqual(Weather.retryDelayMs(10), 300000);

// Response validation
const good = { current: { time: "2026-11-23T02:00", temperature_2m: 57.8,
  weather_code: 3, is_day: 0 } };
assert(Weather.parseCurrent(good));
assert.strictEqual(Weather.parseCurrent({}), null);
assert.strictEqual(Weather.parseCurrent(null), null);
assert.strictEqual(Weather.parseCurrent({ current: { time: "x" } }), null);
assert.strictEqual(
  Weather.parseCurrent({ current: { time: "t", temperature_2m: "57", weather_code: 3, is_day: 0 } }),
  null
);

console.log("weather tests passed");
