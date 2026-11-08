# CONTEXT — TruckersMP Steam Helper

Браузерное расширение (Chrome / Firefox, **Manifest V3**), которое показывает данные TruckersMP об игроках прямо в Steam Community: в профиле и в списке друзей/приглашений.

## Сборка

- Node.js 20+, `npm install`, затем `npm run build` (production, обе версии) или `npm run watch` / `npm run watch:firefox` (dev).
- Отдельные сборки: `npm run build:chrome` → `distribution/`, `npm run build:firefox` → `distribution-firefox/` (переменная `BROWSER=firefox`, через `cross-env`). Эти папки грузить как распакованное расширение; в git не хранятся.
- Манифест подгоняется под браузер при копировании (`transformManifest` в `webpack.config.js`): Chrome — `background.service_worker`, без `browser_specific_settings`; Firefox — `background.scripts`, без `minimum_chrome_version`. Chrome считает `background.scripts` в MV3 ошибкой, поэтому общий манифест не годится.
- `npm run lint` — ESLint 10 + neostandard, конфиг `eslint.config.js` (flat config).
- Сборщик — webpack 5 (`webpack.config.js`). Babel не используется: целевые браузеры (Chrome/Firefox 121+) понимают современный JS.
  - Entry: `background`, `options`, `profile`, `friends`.
  - `copy-webpack-plugin` копирует из `source/` всё, кроме `*.js` и `templates/`, плюс `chota.min.css` из `node_modules` в `css/` (CSS страницы настроек — локально, без CDN).
  - `.hbs` компилируются `handlebars-loader`.
- `webextension-polyfill` импортируется в каждом entry (`import browser from 'webextension-polyfill'`), отдельный файл полифилла не копируется.

## Структура `source/`

| Файл | Назначение |
|---|---|
| `manifest.json` | MV3, общий исходник; ключ `background` перезаписывается при сборке под конкретный браузер (см. «Сборка»). Хосты в `host_permissions`. `web_accessible_resources` — `icons/tmp.png` для steamcommunity.com. Версия `0.0.0` подменяется в CI. |
| `background.js` | Service worker. Обрабатывает сообщения `player` и `options` от content scripts. Запросы: TruckersMP API (`api.truckersmp.com/v2/player/<steamId>`), онлайн-статус (`traffic.krashnz.com/api/v2/user/<id>`), список игр Steam (`steamcommunity.com/profiles/<id>/games/?xml=1`, с `credentials: 'include'` — Steam отдаёт XML только залогиненным, иначе редирект на логин → `null`). `fetchJson` при сетевой ошибке или не-JSON-ответе возвращает `{ error: true, descriptor }` (распознаёт страницу проверки Cloudflare «Just a moment»), профиль пишет эту причину в консоль. Алярм `cache-cleanup` раз в минуту чистит просроченный кэш; при установке/обновлении кэш очищается. |
| `cache.js` | Кэш в `browser.storage.local` с префиксом `cache:` (в service worker нет `localStorage`). `readFromCache(key, cb, minutes)` — отдаёт запись, если она не истекла, иначе вызывает `cb`; `null`/`undefined` от `cb` не кэшируется. Также `removeFromCache`, `removeExpiredItems`, `clearCache` (удаляет только ключи `cache:`). |
| `options-storage.js` | `webext-options-sync` (storage.sync): `showInProfile`, `showInFriends`, `showInInvites`, `showDiscord`, `showPatreon`, `friendsMaxWidth`. |
| `options.html/.js/.css` | Страница настроек. «Clear cache» чистит кэш напрямую через `cache.js` и пишет статус рядом со ссылкой. |
| `contentScripts/profile.js` | Профиль Steam: ищет SteamID (модалка жалобы или `"steamid"` в inline-скриптах), рендерит `profile.hbs` или `noProfile.hbs` в `div.profile_leftcol`. Хелперы Handlebars `ifEquals`, `ifNotEligible` (≤2 ч). Не вставляет блок повторно. |
| `contentScripts/friends.js` | Друзья/приглашения: рендерит `friend.hbs` / `invite.hbs` в каждый блок с `data-steamid`. Обработанные блоки помечаются атрибутом `data-tmp-helper` (страница друзей ajax — `MutationObserver` по смене URL перезапускает `init`, дублей нет). Предупреждение об API-лимитах вставляется один раз (`#tmp-helper-warning`). |
| `templates/*.hbs` | Шаблоны блоков. |
| `css/` | Стили профиля и друзей. |

## Объект игр (`games`)

`{ ets2, ats, all, count }`: часы в ETS2 (appID 227300) / ATS (270880), `-1` = не найдено; `all` стартует с `-1` и суммирует часы (используется как признак приватности: `-1` → Private); `count` — число игр. Если список игр недоступен — `games = null`.

## CI (`.github/workflows`)

- `release.yml` — по расписанию (сб 10:00) / вручную: тег через `fregante/daily-version-action`, сборка на Node 22 отдельно для каждого браузера (`build:chrome` → `distribution`, `build:firefox` → `distribution-firefox`), публикация: Chrome — `chrome-webstore-upload-cli@3`, Firefox — `web-ext@8 sign --channel=listed`. Нужны секреты `EXTENSION_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, `WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET`.
- `codeql-analysis.yml` — CodeQL v3.

## Известное

- `api.truckersmp.com` закрыт Cloudflare: запросы с «браузерным» User-Agent без браузерного TLS-отпечатка (например, curl) получают 403 «Just a moment». Из настоящего браузера обычно проходит, но при блокировке в консоли будет `blocked by Cloudflare challenge`.

- `web-ext lint distribution-firefox`: 0 ошибок; предупреждения только про `insertAdjacentHTML` (контент — экранированный вывод Handlebars).
- Для новых публикаций на AMO Mozilla требует `browser_specific_settings.gecko.data_collection_permissions` — пока не задано.
