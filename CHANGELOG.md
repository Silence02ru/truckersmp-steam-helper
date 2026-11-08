# Changelog

## 2026-11-08 (10)

### Исправления
- Иконка TruckersMP не отображалась на страницах Steam (битая картинка «Icon» в «Друзьях» и в профиле). Steam теперь отдаёт CSP `default-src blob: data: https: …`, и картинки `chrome-extension://…` блокируются. Иконка `icons/tmp.png` встраивается в контент-скрипты как `data:`-URL (webpack `asset/inline`); `web_accessible_resources` из манифеста убран как ненужный.

## 2026-11-08 (9)

### CI
- `release.yml` переписан: релиз на GitHub по тегу `v*` (или вручную из Actions с указанием тега). Сборка, линтер, упаковка Chrome/Firefox/исходников и публикация архивов в Releases через `softprops/action-gh-release`; версия манифеста берётся из тега. Убран еженедельный запуск по расписанию (создавал бы пустые релизы). Публикация в магазины — отдельная задача, включается переменной репозитория `PUBLISH_TO_STORES=true`.
- README: как выпустить релиз.

## 2026-11-08 (8) · v26.11.8

### Упаковка
- Версия расширения `26.11.8` (схема `ГГ.М.Д`, как у оригинала). `homepage_url` → репозиторий форка.
- Свой ID для Firefox: `truckersmp-steam-helper@silence24.ru` (прежний ID принадлежит оригинальному автору). Добавлено `data_collection_permissions: { required: ["websiteContent"] }` — обязательно для новых дополнений AMO; из-за него минимальная версия Firefox поднята до 140 (Android — 142).
- Команды: `npm run package` — архивы для магазинов в `packages/` (Chrome, Firefox и исходники для проверки Mozilla), `npm run lint:firefox`, `npm run sign:firefox` (подпись Firefox-сборки как unlisted для установки у себя). Добавлен `web-ext` в devDependencies, `scripts/package-source.mjs`.
- В «Друзьях» подсказка о блокировке собирается через DOM вместо `innerHTML` (замечание линтера Mozilla).

### Документация
- README: подробная ручная установка (готовый архив или сборка из исходников; Chrome/Edge/Opera/Vivaldi/Яндекс; Firefox временно и навсегда через подпись unlisted), описание команд упаковки и схемы версий.

## 2026-11-08 (7)

### Документация
- README переписан: раздел «About this fork» с указанием оригинального автора (CJMAXiK, ссылка на исходный репозиторий и поддержку автора) и списком изменений форка; установка форка (сборка и загрузка распакованного расширения для Chrome и Firefox), пометка, что ссылки на магазины ведут к оригинальной версии; описание прокси API и новых скриптов сборки. Убраны бейджи версий оригинала.

## 2026-11-08 (6)

### Новое
- Прокси API развёрнут на `https://tmp.silence24.ru:8443` (за прокси Cloudflare, IP сервера скрыт; порт 8443 на сервере открыт только для IP Cloudflare). Этот адрес — значение `apiProxy` по умолчанию, расширение работает без ручной настройки.
- В `proxy/README.md` добавлена инструкция для варианта за Cloudflare: самоподписанный сертификат + режим SSL «Full», порт 8443, nftables-ограничение по IP Cloudflare.

## 2026-11-08 (5)

### Новое
- Свой прокси API TruckersMP для VPS (папка `proxy/`): `server.mjs` на Node.js без зависимостей (только `GET /v2/player/<SteamID64>`, кэш 60 мин / 10 мин для «не найден», объединение одновременных запросов, CORS, только JSON), служба systemd и конфиг nginx (HTTPS-прокси или вариант «только nginx» с кэшем). Инструкция — `proxy/README.md`.
- Настройка «TruckersMP API proxy» (`apiProxy`): если прямой запрос получил проверку Cloudflare, расширение повторяет его через `<адрес прокси>/v2/player/<SteamID>`.

### Изменения
- Убрана отправка cookies в API TruckersMP (`credentials: 'include'`): Chrome хранит cookie-допуск Cloudflare в отдельном разделе и не передаёт его запросам расширения, так что способ «пройти проверку во вкладке» не работает.
- Подсказки при блокировке в профиле и «Друзьях» теперь предлагают указать прокси в настройках; при ошибке самого прокси в профиле показывается её причина.

## 2026-11-08 (4)

### Исправления
- API TruckersMP (`api.truckersmp.com`) закрыт проверкой Cloudflare и отвечал расширению 403, из-за чего зарегистрированные игроки показывались как «No TruckersMP account». Запросы к API теперь отправляются с cookies (`credentials: 'include'`): после того как пользователь один раз проходит проверку на странице API, cookie-допуск Cloudflare доходит до API и данные загружаются.
- При блокировке профиль показывает «TruckersMP data is unavailable» с подсказкой и ссылкой на страницу API для прохождения проверки, а «Друзья» заменяют верхнее предупреждение на ту же подсказку. Фоновый скрипт помечает такие ответы флагом `blocked`.

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
