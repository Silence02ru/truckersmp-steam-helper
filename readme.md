# ![icon](/source/icons/icon24.png) TruckersMP Steam Helper

> Chrome / Firefox extension to provide useful information about TruckersMP players in Steam.

---

## About this fork

**TruckersMP Steam Helper was created by [CJMAXiK](https://github.com/cjmaxik)** — original repository: [cjmaxik/truckersmp-steam-helper](https://github.com/cjmaxik/truckersmp-steam-helper). The original extension is feature-complete and is no longer maintained upstream; it was built on Manifest V2, which Chrome has since disabled.

This fork by [Silence02ru](https://github.com/Silence02ru) keeps it working:

- **Manifest V3** — runs in current Chrome (121+) and Firefox (121+); separate builds for each browser.
- **Works again despite the Cloudflare check on the TruckersMP API.** `api.truckersmp.com` now answers browser and extension requests with a Cloudflare challenge (HTTP 403). The extension tries the API directly first and, if blocked, falls back to a small caching proxy (`https://tmp.silence24.ru:8443` by default, configurable in Options). The proxy code is in [`proxy/`](proxy/README.md) — you can host your own.
- **Bug fixes** — stale cache, players with a single Steam game shown as "Private", crashes on private profiles / network errors / missing Patreon data, duplicated blocks on the Friends page, and more. See [CHANGELOG.md](CHANGELOG.md).
- **Modern toolchain** — webpack 5, ESLint 10, up-to-date dependencies, builds on current Node.js.

All credit for the idea, design and original code goes to CJMAXiK.

---

## Installation

The store listings below belong to the **original** extension and may be outdated or unavailable (Manifest V2):

- [Chrome Web Store](https://chrome.google.com/webstore/detail/truckersmp-steam-helper/lodcclicinbifbajhlapkolpedcjgbme) · [Firefox Add-ons](https://addons.mozilla.org/addon/truckersmp-steam-helper/) · [TruckersMP forum topic](https://forum.truckersmp.com/index.php?/topic/102560-truckersmp-steam-helper/)

This fork is not in the stores yet. Install it manually:

### Get the files

- **Ready-made archives:** `truckersmp-steam-helper-chrome-<version>.zip` / `truckersmp-steam-helper-firefox-<version>.zip` (from [Releases](https://github.com/Silence02ru/truckersmp-steam-helper/releases), or build them yourself — see below). Unzip the Chrome archive into a folder you will **keep** (the browser loads the extension from it).
- **Or build from source:** install [Node.js](https://nodejs.org/) 20+, run `npm install` and `npm run build` in the project folder. Output: `distribution` (Chrome) and `distribution-firefox` (Firefox).

### Chrome, Edge, Opera, Vivaldi, Yandex Browser

1. Open `chrome://extensions` (Edge: `edge://extensions`, Opera: `opera://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped Chrome folder (or `distribution`) — the folder that contains `manifest.json`.
4. To update: replace the folder contents with the new version and press ⟳ on the extension card.

Chrome may show a "developer mode extensions" reminder on start — this is normal for manually installed extensions.

### Firefox

- **Temporary (until Firefox restarts):** open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → select `manifest.json` in `distribution-firefox` (or the Firefox `.zip` itself).
- **Permanent:** Firefox installs only add-ons signed by Mozilla. Sign the build for yourself (free, not published in the catalog): create API keys at [addons.mozilla.org → Developer Hub → API keys](https://addons.mozilla.org/developers/addon/api/key/), then run

  ```bash
  npm run build:firefox
  WEB_EXT_API_KEY=... WEB_EXT_API_SECRET=... npm run sign:firefox
  ```

  Windows PowerShell: `$env:WEB_EXT_API_KEY="..."; $env:WEB_EXT_API_SECRET="..."; npm run sign:firefox`

  The signed `.xpi` appears in `packages/`. Open it in Firefox (drag into the window or *Add-ons → ⚙ → Install Add-on From File…*).

### After installing

- Be signed in to Steam Community in the same browser — Steam serves the games list (ETS2/ATS playtime) only to signed-in users.
- Options: right-click the extension icon → **Options**. The *TruckersMP API proxy* field is pre-filled; clear it to disable the proxy.

## Screenshots
![Profile](/media/profile-registered.png)

![Profile](/media/profile-not-registered.png)

![Friends](/media/friends.png)

## Features
- TruckersMP Info panel in Community Profile
- Steam Privacy settings checkout (if no TruckersMP profile found)
- Compact TruckersMP Info in Friends tab (including Pending Invites)
- Various additional settings, including Steam-related
- TruckersMP API proxy setting (fork)

*This extension is inspired by TruckersMP Helper and internal TruckersMP Team tools.*

## For Developers
Requires Node.js 20+. Run `npm install` in the project's root folder.

Scripts:
- `npm run build` — production build for both browsers: `distribution` (Chrome) and `distribution-firefox` (Firefox); `build:chrome` / `build:firefox` for one
- `npm run watch` / `npm run watch:firefox` — development build (reload the extension manually to refresh content scripts)
- `npm run lint` — ESLint (neostandard); `npm run lint:firefox` — Mozilla add-on linter
- `npm run package` — build and pack store-ready archives into `packages/`: Chrome `.zip`, Firefox `.zip` and the source `.zip` that addons.mozilla.org asks for (committed files only — commit first)
- `npm run sign:firefox` — sign the Firefox build as unlisted (needs `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`)

The version lives in `source/manifest.json` (`YY.M.D`, same scheme as the original).

### Publishing a release
Bump the version in `source/manifest.json`, commit, then push a tag with the same version:

```bash
git tag v26.11.8
git push origin v26.11.8
```

GitHub Actions (`.github/workflows/release.yml`) builds both browsers, packs the Chrome, Firefox and source archives and publishes them on the [Releases](https://github.com/Silence02ru/truckersmp-steam-helper/releases) page. It can also be started manually from the Actions tab (*Release → Run workflow*). Store submission is a separate optional job: set the repository variable `PUBLISH_TO_STORES=true` and the secrets `EXTENSION_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` (Chrome Web Store) and `WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET` (addons.mozilla.org).

API proxy (optional, for your own server): see [proxy/README.md](proxy/README.md). Project overview for contributors: [CONTEXT.md](CONTEXT.md).

## License
This browser extension is released under [MIT license](LICENSE.md). Original work © 2021 CJMAXiK.

## Credits
- **[CJMAXiK](https://github.com/cjmaxik)** — original author ([support the author](https://paypal.me/cjmaxik))
- [browser-extension-template](https://github.com/fregante/browser-extension-template)
- [Handlebars](https://handlebarsjs.com/)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- [Augmented Steam](https://github.com/tfedor/AugmentedSteam)
- [TruckersMP API](https://truckersmp.com)
