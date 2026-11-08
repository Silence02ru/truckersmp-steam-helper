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

To install **this fork**, build it and load it unpacked:

1. Install [Node.js](https://nodejs.org/) 20+.
2. In the project folder run `npm install`, then `npm run build`.
3. **Chrome / Edge / Opera / Vivaldi:** open `chrome://extensions`, enable *Developer mode*, click *Load unpacked* and select the `distribution` folder.
4. **Firefox:** open `about:debugging#/runtime/this-firefox`, click *Load Temporary Add-on…* and select `distribution-firefox/manifest.json`.

Be signed in to Steam Community in the same browser — Steam serves the games list (ETS2/ATS playtime) only to signed-in users.

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
- `npm run lint` — ESLint (neostandard)

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
