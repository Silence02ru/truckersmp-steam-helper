// TruckersMP Steam Helper — API proxy for a VPS.
// Forwards ONLY GET /v2/player/<SteamID64> to api.truckersmp.com, caches responses
// and adds CORS headers so the extension can call it. No dependencies, Node.js 18+.
//
// Env: PORT (default 8787), HOST (default 127.0.0.1 — put nginx/Caddy with HTTPS in front),
//      CACHE_MINUTES (default 60)

import http from 'node:http'

const PORT = Number(process.env.PORT) || 8787
const HOST = process.env.HOST || '127.0.0.1'
const CACHE_MS = (Number(process.env.CACHE_MINUTES) || 60) * 60 * 1000
const NOT_FOUND_CACHE_MS = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 50000
const UPSTREAM = 'https://api.truckersmp.com'
const USER_AGENT = 'TruckersMP-Steam-Helper-Proxy/1.0 (+https://github.com/Silence02ru/truckersmp-steam-helper)'

const ROUTE = /^\/v2\/player\/(7656119\d{10})$/

/** @type {Map<string, {expires: number, status: number, body: string}>} */
const cache = new Map()
/** @type {Map<string, Promise<{status: number, body: string}>>} */
const inFlight = new Map()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

const send = (res, status, body, extra = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...CORS_HEADERS,
    ...extra
  })
  res.end(body)
}

const fetchUpstream = async (steamId) => {
  const response = await fetch(`${UPSTREAM}/v2/player/${steamId}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000)
  })
  const body = await response.text()

  // Make sure we pass through JSON only (not a Cloudflare challenge page)
  try {
    JSON.parse(body)
  } catch {
    return { status: 502, body: JSON.stringify({ error: true, descriptor: `Upstream HTTP ${response.status}: not JSON` }) }
  }

  return { status: response.status, body }
}

const getPlayer = async (steamId) => {
  const cached = cache.get(steamId)
  if (cached && cached.expires > Date.now()) return { ...cached, hit: true }

  // Collapse concurrent requests for the same player into one upstream call
  if (!inFlight.has(steamId)) {
    inFlight.set(steamId, fetchUpstream(steamId).finally(() => inFlight.delete(steamId)))
  }
  const result = await inFlight.get(steamId)

  const ttl = result.status === 200 ? CACHE_MS : result.status === 404 ? NOT_FOUND_CACHE_MS : 0
  if (ttl) {
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value)
    cache.set(steamId, { ...result, expires: Date.now() + ttl })
  }

  return { ...result, hit: false }
}

// Drop expired entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache) if (value.expires <= now) cache.delete(key)
}, 10 * 60 * 1000).unref()

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '')
  if (req.method !== 'GET') return send(res, 405, '{"error":true,"descriptor":"Method not allowed"}')

  const path = new URL(req.url, 'http://localhost').pathname
  if (path === '/health') return send(res, 200, '{"ok":true}')

  const match = ROUTE.exec(path)
  if (!match) return send(res, 404, '{"error":true,"descriptor":"Only /v2/player/<SteamID64> is proxied"}')

  try {
    const result = await getPlayer(match[1])
    send(res, result.status, result.body, { 'X-Cache': result.hit ? 'HIT' : 'MISS' })
  } catch (error) {
    console.error(new Date().toISOString(), match[1], error.message)
    send(res, 502, JSON.stringify({ error: true, descriptor: 'Upstream request failed' }))
  }
})

server.listen(PORT, HOST, () => {
  console.log(`TruckersMP API proxy listening on http://${HOST}:${PORT}`)
})
