# Pepper's ghost weather display

Home Screen web app (plain HTML/CSS/JS, no build step) for an iPhone lying under a
45 degree pane. Design: `maker-research/notes/peppers-ghost-proposal.md` (r3).

## Phase 2: live data

Current weather for Long Island City from Open-Meteo, refreshed every 15 minutes
(`LAT`, `LON`, `REFRESH_MS`, `STALE_MS` at the top of `app.js`). Pure helpers are in
`weather.js`; run the tests with `node tests/weather.test.js`.

- State from the weather code: clear is `sun` by day and `night` after dark; clouds,
  fog, rain, snow as in the proposal. Cloudy, rain and snow at night keep their own
  state (night overlay comes in Phase 3).
- If a fetch fails, the last values stay and it retries after 1, 2, then every 5
  minutes. The dot is green when fresh, red after 60 minutes without an update, grey
  before the first load.
- `?state=...` still forces the state look and label; live temperature and word show.
- Device check: compare temperature and word with a weather app for about 24 hours.
  The "updated" time should move about every 15 minutes, and no state should stay
  stuck. For a stale test, use Airplane Mode for a few minutes, then turn it off: the
  values stay, then recover.

## Phase 1: static mock (now live data, see above)

- `?state=sun|clouds|rain|snow|night` switches the five states.
- Example: `https://karissawhiting.github.io/peppers-ghost-weather/?state=rain`
- Device check: put the phone under the pane, open each state, and read the text from
  3 to 4 ft. Nothing should be cut off; the state colours should look distinct.
- Keep the screen on with iOS Auto-Lock set to Never (Wake Lock is unsupported on the
  test phone; the code still tries it and shows its status in the bottom left).

## Phase 0: test card (replaced by Phase 1; settings below still apply)

Settings are at the top of `app.js`:

- `FLIP`: `"none"`, `"horizontal"`, `"vertical"` or `"both"`.
- `ROTATE`: `90` or `-90` turns the page to a wide layout; `0` keeps portrait.
- Quick test in Safari only: add `?flip=h`, `?flip=v`, `?flip=both` or `?flip=none` to the URL.

Corner labels: bottom left is the Wake Lock status (on / off / unsupported); bottom
right is the iOS version, `app` or `browser`, and the active flip.

## Device steps

1. Create a public GitHub repo, push this branch, then in Settings > Pages choose
   "Deploy from a branch" and pick the branch and `/ (root)`.
2. Open `https://<user>.github.io/<repo>/` in Safari. Try the `?flip=` values.
3. Share > Add to Home Screen. Open it from the Home Screen icon.
4. Check: label says `app`, iOS 18.4 or higher, wake lock `on`.
5. Put the phone under the pane. Pick the `FLIP` (and `ROTATE`) value where the "R"
   reads correctly and the arrow points up. Set it in `app.js`, push, reopen.
6. Leave it 1 hour on the charger: the screen should stay on.

The first Home Screen launch can show the old page after a push; close the app and
reopen it (or remove and re-add it) if the labels don't update.
