import browser from 'webextension-polyfill'

import friendTemplate from '../templates/friend.hbs'
import inviteTemplate from '../templates/invite.hbs'

// Marks the blocks we have already processed (friends list is reloaded via ajax)
const RENDERED_ATTR = 'data-tmp-helper'
const WARNING_ID = 'tmp-helper-warning'

const iconURL = browser.runtime.getURL('icons/tmp.png')

const init = () => {
  browser.runtime.sendMessage(
    {
      query: 'options'
    }
  ).then((options) => {
    warningMessage()

    if (options.showInFriends) {
      const friends = document.querySelectorAll('div.friend_block_v2')
      friends.forEach((friend, key) => render(friend, 'div.friend_block_content', friendTemplate, key))
    }

    if (options.showInInvites) {
      const invites = document.querySelectorAll('div.invite_row')
      invites.forEach((invite, key) => render(invite, 'div.invite_block_details', inviteTemplate, key))
    }

    if (options.friendsMaxWidth) {
      document.querySelectorAll('div.pagecontent').forEach(element => element.classList.add('max_width'))
    }
  }).catch(error => console.error('TruckersMP Steam Helper:', error))
}

/**
 * Insert a warning message
 */
const warningMessage = () => {
  if (document.getElementById(WARNING_ID)) return

  const titleBar = document.querySelector('div.profile_friends.title_bar')
  if (!titleBar) return

  const template = `<div id="${WARNING_ID}" class="search_results_none">Due to <img src="${iconURL}" alt="Icon"> API limits, new data might load with a noticeable delay. Be patient 😉 --CJMAXiK</div>`
  titleBar.insertAdjacentHTML('beforebegin', template)
}

/**
 * Replace the warning with a Cloudflare check hint (TruckersMP API is blocking requests)
 * @param {String} steamId Any Steam ID to build the API page link
 */
const blockedMessage = (steamId) => {
  const warning = document.getElementById(WARNING_ID)
  if (!warning || warning.hasAttribute('data-blocked')) return

  warning.setAttribute('data-blocked', '')
  warning.innerHTML = `<img src="${iconURL}" alt="Icon"> TruckersMP API asks for a Cloudflare security check. ` +
    `<a href="https://api.truckersmp.com/v2/player/${steamId}" target="_blank" rel="noopener noreferrer">Open the API page</a>, ` +
    'wait until the check passes, then reload this page.'
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
 * Render the template
 * @param {Element} mainSelector
 * @param {String} targetSelector
 * @param {Function} template
 * @param {Number} key
 */
const render = (mainSelector, targetSelector, template, key) => {
  const steamId = mainSelector.getAttribute('data-steamid')

  if (!isSteamId(steamId) || mainSelector.hasAttribute(RENDERED_ATTR)) return
  mainSelector.setAttribute(RENDERED_ATTR, '')

  browser.runtime.sendMessage(
    {
      query: 'player',
      steamId,
      key,
      withGames: false
    }
  ).then((playerInfo) => {
    let player = null
    if (playerInfo && playerInfo.data && !playerInfo.data.error) {
      player = playerInfo.data.response
    } else if (playerInfo?.data?.blocked) {
      blockedMessage(steamId)
    }

    const blockContent = mainSelector.querySelector(targetSelector)
    if (!blockContent) return

    blockContent.insertAdjacentHTML('beforeend', template(
      {
        ...player,
        iconURL
      }
    ))
  }).catch(error => {
    // Allow another attempt on the next ajax navigation
    mainSelector.removeAttribute(RENDERED_ATTR)
    console.error('TruckersMP Steam Helper:', error)
  })
}

// Check for URL changes (friends menu is ajax)
let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    init()
  }
}).observe(document, {
  subtree: true,
  childList: true
})

init()
