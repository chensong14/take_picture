const storage = require('./utils/storage')

App({
  globalData: {
    user: null,
    draft: null
  },

  onLaunch() {
    this.globalData.user = storage.getUser()
  },

  setDraft(draft) {
    this.globalData.draft = draft
    storage.setDraft(draft)
  },

  getDraft() {
    return this.globalData.draft || storage.getDraft()
  }
})
