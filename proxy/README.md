# Прокси API TruckersMP для VPS

`api.truckersmp.com` закрыт проверкой Cloudflare, и запросы из расширения получают 403. Серверные запросы с обычного IP проходят. Этот прокси запускается на своей VPS и:

- пропускает **только** `GET /v2/player/<SteamID64>` к `api.truckersmp.com`, остальное отклоняет (не открытый прокси);
- кэширует ответы: найденный игрок — 60 минут, «не найден» — 10 минут; одновременные запросы одного игрока объединяет;
- отдаёт только JSON (страницу проверки Cloudflare не пропускает), добавляет CORS-заголовки;
- представляется честным User-Agent `TruckersMP-Steam-Helper-Proxy/1.0`.

Расширение ходит через прокси только если прямой запрос получил проверку Cloudflare.

## 0. Проверка IP

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.truckersmp.com/v2/player/76561198114078285
```

Должно быть `200`. Если `403` — IP этой VPS тоже под проверкой, прокси на ней не поможет.

## Вариант A: Node.js (рекомендуется)

Нужен Node.js 18+ (`node -v`). Установка на Ubuntu/Debian, если его нет:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs
```

Копирование и запуск как службы:

```bash
sudo mkdir -p /opt/truckersmp-proxy
sudo cp server.mjs /opt/truckersmp-proxy/
sudo cp truckersmp-proxy.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now truckersmp-proxy
curl http://127.0.0.1:8787/v2/player/76561198114078285
```

Сервер слушает только `127.0.0.1:8787` — наружу его выставляет nginx с HTTPS (ниже). Логи: `journalctl -u truckersmp-proxy -f`.

## Вариант B: только nginx

Без Node.js: раскомментируйте «Option B» в `nginx.conf` (строку `proxy_cache_path` — в блок `http {}`).

## HTTPS (nginx + Let's Encrypt)

Нужен домен или поддомен, указывающий на IP VPS (A-запись).

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp nginx.conf /etc/nginx/sites-available/truckersmp-proxy
sudo sed -i 's/tmp.example.com/ВАШ_ДОМЕН/' /etc/nginx/sites-available/truckersmp-proxy
sudo ln -s /etc/nginx/sites-available/truckersmp-proxy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ВАШ_ДОМЕН
```

Проверка снаружи:

```bash
curl https://ВАШ_ДОМЕН/v2/player/76561198114078285
```

## Подключение к расширению

Настройки расширения → «TruckersMP API proxy» → `https://ВАШ_ДОМЕН` (без `/v2/...` и без слеша на конце).

Без HTTPS (по `http://IP:порт`) тоже можно, но тогда SteamID идут открытым текстом, а браузер может блокировать такие запросы.
