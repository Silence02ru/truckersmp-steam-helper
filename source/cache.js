import browser from 'webextension-polyfill'

// All cache entries live in storage.local under this prefix
// (localStorage is not available in the MV3 service worker)
const PREFIX = 'cache:'

/**
 * Write to cache
 * @param {String} key Cache key
 * @param {Object} data Data to write
 * @param {Number} timeout Expiration timestamp (in ms)
 */
const writeToCache = async (key, data, timeout) => {
  await browser.storage.local.set({ [PREFIX + key]: { data, timeout } })
}

/**
 * Read from cache
 * @param {String} key Cache key
 * @param {Function} callback Callback function (if data is not cached). Returning null/undefined skips caching
 * @param {?Number} timeout Cache timeout (in minutes)
 * @returns {Promise<{data: Object, timeout: Number}>}
 */
const readFromCache = async (key, callback, timeout = 60) => {
  const stored = await browser.storage.local.get(PREFIX + key)
  const cachedData = stored[PREFIX + key] || null

  // Return cached data if it is not expired yet
  if (cachedData && cachedData.data && cachedData.timeout > Date.now()) {
    return cachedData
  }

  // Execute a callback, put response in a new cache entry
  const data = await callback(key)
  const cacheTimeout = Date.now() + timeout * 60 * 1000

  if (data === null || data === undefined) {
    await removeFromCache(key)
  } else {
    await writeToCache(key, data, cacheTimeout)
  }

  return {
    data,
    timeout: cacheTimeout
  }
}

/**
 * Remove from cache
 * @param {String} key
 */
const removeFromCache = async (key) => {
  await browser.storage.local.remove(PREFIX + key)
}

/**
 * Return all cache keys with their entries
 * @returns {Promise<Array<[String, Object]>>}
 */
const cacheEntries = async () => {
  const all = await browser.storage.local.get(null)
  return Object.entries(all).filter(([key]) => key.startsWith(PREFIX))
}

/**
 * Remove expired items
 * Scheduled job
 */
const removeExpiredItems = async () => {
  const currentDate = Date.now()
  const stale = (await cacheEntries())
    .filter(([, value]) => !value || !(currentDate <= value.timeout))
    .map(([key]) => key)

  if (stale.length) {
    await browser.storage.local.remove(stale)
    console.log(`Cache cleanup: removed ${stale.length} stale key(s)`)
  }
}

/**
 * Remove all cache entries (options are stored in storage.sync and stay intact)
 */
const clearCache = async () => {
  const keys = (await cacheEntries()).map(([key]) => key)
  if (keys.length) await browser.storage.local.remove(keys)
}

export { readFromCache, removeFromCache, removeExpiredItems, clearCache }
