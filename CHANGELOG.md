# Changelog

## 2026-11-08 (3)

### Улучшения
- Понятная диагностика, когда нет данных TruckersMP: вместо `[object Object]` в консоли профиля пишется причина — игрок не найден, ошибка сети, HTTP-статус или блокировка проверкой Cloudflare. Фоновый скрипт при ошибке возвращает объект `{ error: true, descriptor }`, а не `null`.

## 2026-11-08 (2)

### Исправления
- Chrome не загружал расширение с ошибкой `'background.scripts' requires manifest version of 2 or lower`. Сборка теперь делает отдельные манифесты: `npm run build:chrome` → `distribution/` (service worker), `npm run build:firefox` → `distribution-firefox/` (background scripts). `npm run build` собирает обе. CI собирает и публикует каждую версию из своей папки.

## 2026-11-08

### Обновление
- Переход на **Manifest V3** (Chrome 121+, Firefox 121+): service worker вместо фоновой страницы, `host_permissions`, `browser_specific_settings`, новый формат `web_accessible_resources`, `runtime.getURL` вместо удалённого `extension.getURL`. Без этого расширение не запускается в актуальном Chrome.
- Кэш перенесён из `localStorage` в `browser.storage.local` (в service worker `localStorage` недоступен).
- Сборка: webpack 4 → 5 (webpack 4 не собирается на Node 17+), webpack-cli 7, copy-webpack-plugin 14; удалены Babel, clean-webpack-plugin, size-plugin, terser-webpack-plugin, npm-run-all и неиспользуемый milligram.
- Зависимости: fast-xml-parser 5, webext-options-sync 4, webextension-polyfill 0.12, handlebars 4.7.10. Полифилл теперь импортируется в бандлы.
- ESLint 7 + standard → ESLint 10 + neostandard (flat config), добавлен `npm run lint`.
- CSS страницы настроек (chota) берётся локально, а не с `unpkg.com/chota@latest`.
- CI: actions/checkout v4, setup-node (Node 22), CodeQL v3, chrome-webstore-upload-cli@3, `web-ext sign` вместо устаревшего web-ext-submit; исправлено `needs.Version` → `needs.version`.

### Исправления
- Кэш отдавал просроченные записи до ближайшей чистки (неверное сравнение времени истечения).
- Игрок ровно с одной игрой в Steam определялся как «Private» (XML-парсер возвращал объект вместо массива).
- Падение при приватном/пустом списке игр, при ошибке сети или не-JSON-ответе API — теперь блок всё равно показывается.
- Список игр Steam теперь требует входа: запрос отправляется с cookies, редирект на логин обрабатывается как «нет данных».
- Падение профиля, если у игрока нет данных Patreon или не найден нужный `<script>` со SteamID.
- В «Друзьях» при ajax-переходах дублировались блоки TruckersMP и предупреждение; падение, если на странице нет заголовка списка.
- В настройках дублировалась подпись «Friends»; «Clear cache» вызывал `alert` через удалённый `getBackgroundPage` — теперь статус пишется рядом со ссылкой.
- Иконка `icon256.png` была 1000×1000 — приведена к 256×256.
