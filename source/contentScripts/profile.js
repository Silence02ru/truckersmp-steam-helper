import browser from 'webextension-polyfill'
import Handlebars from 'handlebars/runtime'

import profileTemplate from '../templates/profile.hbs'
import noProfileTemplate from '../templates/noProfile.hbs'

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('ifNotEligible', function (arg1, options) {
  return arg1 <= 2.0 ? options.fn(this) : options.inverse(this)
})

const iconURL = browser.runtime.getURL('icons/tmp.png')

const init = () => {
  browser.runtime.sendMessage(
    {
      query: 'options'
    }
  ).then((options) => {
    const steamId = getSteamId()

    if (!steamId) {
      console.log('steamId cannot be found! Aborted.')
      return
    }

    if (options.showInProfile) queryPlayer(steamId, options)
  }).catch(error => console.error('TruckersMP Steam Helper:', error))
}

/**
 * Check Steam ID correctness
 * @param {String} steamId
 * @return {Boolean}
 */
const isSteamId = (steamId) => {
  return !!(steamId && steamId.length === 17 && steamId.startsWith('765611'))
}

/**
 * Find and return Steam ID
 * @return {String|null} SteamID
 */
const getSteamId = () => {
  const abuseId = document.querySelector('#reportAbuseModal input[name=abuseID]')?.value
  if (isSteamId(abuseId)) return abuseId

  // Profile data is embedded into one of the inline scripts (g_rgProfileData)
  const regex = /"steamid":"(\d{17})"/
  for (const script of document.querySelectorAll('script:not([src])')) {
    const data = regex.exec(script.textContent)
    if (data !== null && isSteamId(data[1])) return data[1]
  }

  return null
}

/**
 * Query player from TruckersMP API
 * @param {String} steamId
 * @param {Object} options
 */
const queryPlayer = (steamId, options) => {
  browser.runtime.sendMessage(
    {
      query: 'player',
      steamId,
      key: 0,
      withGames: true,
      withMap: true
    }
  ).then((playerInfo) => {
    if (playerInfo && playerInfo.data && !playerInfo.data.error) {
      return renderProfile(playerInfo.data.response, playerInfo.online, options, playerInfo.timeout, playerInfo.games)
    }
    const reason = playerInfo?.data?.descriptor ?? playerInfo?.data?.response ?? 'no response from the extension'
    console.warn(`TruckersMP Steam Helper: no TruckersMP data (${reason}). Looking for the games on Steam profile...`)

    // Return 'no profile' template no matter what
    return renderNoProfile(playerInfo?.games, options, {
      blocked: !!playerInfo?.data?.blocked,
      reason: options.apiProxy ? playerInfo?.data?.descriptor : null
    })
  }).catch(error => console.error('TruckersMP Steam Helper:', error))
}

/**
 * Render block for not registered user (or when TruckersMP API is behind a Cloudflare check)
 * @param {Object} games
 * @param {Object} options
 * @param {Object} status
 * @param {Boolean} status.blocked TruckersMP API returned a Cloudflare challenge
 * @param {?String} status.reason Proxy error (when a proxy is configured)
 */
const renderNoProfile = (games, options, status = {}) => {
  const template = noProfileTemplate({
    ...games,
    ...options,
    ...status,
    iconURL
  })

  insertTemplate(template)
}

/**
 * Render profile with TruckersMP data
 * @param {Object} player
 * @param {Boolean} online
 * @param {Object} options
 * @param {Number} timeout
 * @param {Object} games
 */
const renderProfile = (player, online, options, timeout, games) => {
  if (player) {
    player = currentTier(player)
  }

  const template = profileTemplate({
    ...player,
    online,
    ...options,
    timeout: timeout ? new Date(timeout).toLocaleString() : null,
    ...games,
    iconURL
  })

  insertTemplate(template)
}

/**
 * Insert template
 * @param {String} template
 */
const insertTemplate = (template) => {
  // Already rendered (e.g. the script was injected twice)
  if (document.querySelector('div.profile_leftcol div.tmp_block')) return

  const fallbackSelector = 'div.profile_leftcol'
  const mainSelector = fallbackSelector + ' > :first-child'
  let mainTarget = 'beforebegin'

  let selector = document.querySelector(mainSelector)
  if (!selector) {
    selector = document.querySelector(fallbackSelector)
    mainTarget = 'afterbegin'
  }

  if (!selector) {
    console.log('Profile layout is not recognized, nothing to render.')
    return
  }

  selector.insertAdjacentHTML(mainTarget, template)
}

/**
 * Describe Patreon tier for the player
 * @param {Object} player
 * @param {Object} player.patreon
 * @param {Number} player.patreon.tierId
 * @param {Number} player.patreon.currentPledge
 * @return {*}
 */
const currentTier = (player) => {
  if (!player.patreon) return player

  let currentTier

  switch (player.patreon.tierId) {
    case 3822370:
      currentTier = 'Trucker tier'
      break

    case 3825320:
      currentTier = 'Fan tier'
      break

    case 3894844:
      currentTier = 'Master Trucker tier'
      break

    default:
      currentTier = player.patreon.currentPledge ? '$' + player.patreon.currentPledge / 100 : null
      break
  }
  player.patreon.currentTier = currentTier

  return player
}

init()
