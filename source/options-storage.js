import OptionsSync from 'webext-options-sync'

export default new OptionsSync({
  defaults: {
    showInProfile: true,
    showInFriends: true,
    showInInvites: true,
    showDiscord: true,
    showPatreon: true,
    friendsMaxWidth: false,
    // Own API proxy (see proxy/ folder), used when api.truckersmp.com returns a Cloudflare challenge
    apiProxy: 'https://tmp.silence24.ru:8443'
  },
  migrations: [
    OptionsSync.migrations.removeUnused
  ],
  logging: true
})
