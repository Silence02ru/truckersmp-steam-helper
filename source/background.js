import browser from 'webextension-polyfill'
import { XMLParser } from 'fast-xml-parser'

import optionsStorage from './options-storage.js'
import { clearCache, readFromCache, removeExpiredItems, removeFromCache } from './cache.js'

const CLEANUP_ALARM = 'cache-cleanup'
const CLEANUP_PERIOD = 1.0 // minutes

// Listeners for a content scripts
browser.runtime.onMessage.addListener((request, _sender) => {
  switch (request.query) {
    case 'player':
      return queryPlayer(request)

    case 'options':
      return queryOptions()
  }

  return undefined
})

/**
 * Queue delay
 * @param key Index key to delay
 * @return {Promise<Function>}
 */
const delay = (key) => new Promise(resolve => setTimeout(resolve, key * 150 + Math.random() * 10))

/**
 * Fetch JSON. On network/HTTP/parsing problems returns an API-like error object
 * ({ error: true, descriptor }) so callers and logs can tell what went wrong
 * @param {String} url
 * @returns {Promise<Object>}
 */
const fetchJson = async (url) => {
  let response
  try {
    // Send cookies: api.truckersmp.com is behind a Cloudflare challenge, and the
    // clearance cookie the user gets after passing it in a tab must reach the API
    response = await fetch(url, { credentials: 'include' })
  } catch (error) {
    console.warn('Request failed:', url, error)
    return { error: true, descriptor: `Network error: ${error.message}` }
  }

  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    const blocked = /<title>Just a moment/i.test(text)
    const descriptor = `HTTP ${response.status}: ` + (blocked ? 'blocked by Cloudflare challenge' : 'response is not JSON')
    console.warn('Request failed:', url, descriptor)
    return { error: true, blocked, descriptor }
  }
}

/**
 * Return TruckersMP player data
 * @param {Object} request Data object
 * @param {String} request.steamId Steam ID
 * @param {String} request.key Delay key
 * @param {?Boolean} request.withGames Check for games if no TMP profile
 * @param {?Boolean} request.withMap Check for online status
 * @returns {Object}
 */
const queryPlayer = async (request) => {
  const key = `player:${request.steamId}`
  const playerInfo = await readFromCache(key, async function () {
    await delay(request.key)
    return fetchJson(`https://api.truckersmp.com/v2/player/${request.steamId}`)
  })

  // Check if the user is not registered
  if (!playerInfo.data || playerInfo.data.error) {
    await removeFromCache(key)
  } else if (request.withMap && !playerInfo.data.response.banned) {
    // Grabbing map
    playerInfo.online = await queryMap(playerInfo.data.response.id)
  }

  // Grabbing games
  if (request.withGames) {
    playerInfo.games = await queryGames(request)
  }

  return playerInfo
}

/**
 * Return extension options
 * @returns {Object}
 */
const queryOptions = async () => {
  return await optionsStorage.getAll()
}

const cacheBusting = () => {
  return Math.floor(Math.random() * 69420)
}

/**
 * Check user games
 * @param {Object} request Data object
 * @param {String} request.steamId Steam ID
 * @returns {Object|null}
 */
const queryGames = async (request) => {
  const key = `games:${request.steamId}`
  const gamesData = await readFromCache(key, async function () {
    // Requesting the XML data. Steam requires a signed-in session for this endpoint now
    let data
    try {
      const response = await fetch(
        `https://steamcommunity.com/profiles/${request.steamId}/games/?xml=1&v=${cacheBusting()}`,
        { credentials: 'include' }
      )
      data = await response.text()
      if (!response.ok || !data.trimStart().startsWith('<?xml')) {
        console.warn('Steam games list is unavailable (signed out?)')
        return null
      }
    } catch (error) {
      console.warn('Steam games request failed:', error)
      return null
    }

    // Parsing XML data
    const parser = new XMLParser({
      ignoreDeclaration: true,
      ignorePiTags: true,
      processEntities: false,
      parseTagValue: false,
      // A profile with a single game must still give us an array
      isArray: (_name, jpath) => jpath === 'gamesList.games.game'
    })

    let xmlDoc
    try {
      xmlDoc = parser.parse(data)
    } catch (error) {
      console.warn('Steam games XML cannot be parsed:', error)
      return null
    }

    /**
     * @typedef Game Game object
     * @param {String?} game.hoursOnRecord
     * @param {String} game.appID
     */

    // We only need games data (missing for private or empty profiles)
    const gamesList = xmlDoc?.gamesList?.games?.game ?? null

    // Games object for the template
    const games = {
      ets2: -1,
      ats: -1,
      all: -1,
      count: 0
    }

    // Fallback if no games data
    if (!Array.isArray(gamesList) || !gamesList.length) {
      return games
    }

    games.count = gamesList.length

    gamesList.forEach(game => {
      // Parse hoursOnRecord (if available)
      const gameTime = game.hoursOnRecord ? parseHours(game.hoursOnRecord) : 0

      // Grab hoursOnRecord for eligible games
      switch (String(game.appID)) {
        case '227300':
          games.ets2 = gameTime
          break

        case '270880':
          games.ats = gameTime
          break
      }

      // Calculate all games time (for privacy checks)
      games.all += gameTime
    })

    return games
  }, 1)

  return gamesData.data
}

/**
 * Parse hours, minding the comma sign
 * @param {String} hours
 * @returns {Number}
 */
function parseHours (hours) {
  const value = Number.parseFloat(String(hours).replaceAll(',', ''))
  return Number.isNaN(value) ? 0 : value
}

/**
 * Check user online status
 * @param {string} id TruckersMP ID
 * @returns {Promise<Boolean>}
 */
const queryMap = async (id) => {
  const mapData = await readFromCache(`map:${id}`, async function () {
    return fetchJson(`https://traffic.krashnz.com/api/v2/user/${id}?v=${cacheBusting()}`)
  }, 1)

  return !!(mapData.data && !mapData.data.error && mapData.data.response?.online)
}

// Cache governor (the service worker may be restarted at any time, so keep the alarm idempotent)
removeExpiredItems()
browser.alarms.get(CLEANUP_ALARM).then(alarm => {
  if (!alarm) browser.alarms.create(CLEANUP_ALARM, { periodInMinutes: CLEANUP_PERIOD })
})
browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === CLEANUP_ALARM) removeExpiredItems()
})

// Clear cache prematurely after an update
browser.runtime.onInstalled.addListener(details => {
  console.log('Clearing the cache prematurely:', details.reason)
  clearCache()
})
