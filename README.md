# Pepper's ghost weather display

Home Screen web app (plain HTML/CSS/JS, no build step) for an iPhone lying under a
45 degree pane. Design: `maker-research/notes/peppers-ghost-proposal.md` (r3).

## Phase 0: test card

A white "R" and an up arrow on #000, to check how the reflection reads and whether
Wake Lock keeps the screen on.

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
