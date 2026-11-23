// Pure weather helpers (no DOM), shared by the page and tests/weather.test.js
const Weather = {
  buildUrl: function(lat, lon, timezone) {
    const fields = [
      "temperature_2m",
      "weather_code",
      "is_day",
      "wind_speed_10m",
      "precipitation",
      "cloud_cover",
    ];
    return (
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + lat +
      "&longitude=" + lon +
      "&current=" + fields.join(",") +
      "&temperature_unit=fahrenheit" +
      "&wind_speed_unit=mph" +
      "&timezone=" + encodeURIComponent(timezone)
    );
  },

  // Returns the current block if it has what the display needs, otherwise null
  parseCurrent: function(json) {
    const cur = json && json.current;
    if (!cur) return null;
    const ok =
      Number.isFinite(cur.temperature_2m) &&
      Number.isFinite(cur.weather_code) &&
      (cur.is_day === 0 || cur.is_day === 1) &&
      typeof cur.time === "string";
    return ok ? cur : null;
  },

  // Display state: sun | clouds | rain | snow | night
  stateFromWeather: function(code, isDay) {
    if (code === 0 || code === 1) return isDay === 1 ? "sun" : "night";
    if (code === 71 || code === 73 || code === 75 || code === 77) return "snow";
    if (code === 85 || code === 86) return "snow";
    if (code >= 51 && code <= 67) return "rain";
    if (code >= 80 && code <= 82) return "rain";
    if (code >= 95 && code <= 99) return "rain";
    return "clouds"; // 2, 3, 45, 48 and anything unmapped
  },

  conditionWord: function(code, isDay) {
    const words = {
      0: isDay === 1 ? "Sunny" : "Clear",
      1: isDay === 1 ? "Mostly sunny" : "Mostly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Fog",
      51: "Light drizzle",
      53: "Drizzle",
      55: "Heavy drizzle",
      56: "Freezing drizzle",
      57: "Freezing drizzle",
      61: "Light rain",
      63: "Rain",
      65: "Heavy rain",
      66: "Freezing rain",
      67: "Freezing rain",
      71: "Light snow",
      73: "Snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Light showers",
      81: "Showers",
      82: "Heavy showers",
      85: "Snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm, hail",
      99: "Thunderstorm, hail",
    };
    return words[code] || "Cloudy";
  },

  // "2026-11-23T14:05" -> "2:05 PM" (time is already local, so no timezone maths)
  formatUpdated: function(timeString) {
    const m = /T(\d{2}):(\d{2})/.exec(timeString || "");
    if (!m) return "";
    const hour24 = Number(m[1]);
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return hour12 + ":" + m[2] + " " + suffix;
  },

  // Never succeeded yet is not stale (the page shows "Loading")
  isStale: function(lastOkMs, nowMs, staleMs) {
    if (lastOkMs === null) return false;
    return nowMs - lastOkMs > staleMs;
  },

  // Retry delays after failures: 1 min, 2 min, then every 5 min
  retryDelayMs: function(failureCount) {
    if (failureCount <= 1) return 60 * 1000;
    if (failureCount === 2) return 2 * 60 * 1000;
    return 5 * 60 * 1000;
  },
};

if (typeof module !== "undefined") {
  module.exports = Weather;
}
