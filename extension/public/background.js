chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_OFFSCREEN') {
    chrome.offscreen.hasDocument()
      .then((has) => {
        if (has) return
        return chrome.offscreen.createDocument({
          url: chrome.runtime.getURL('offscreen.html'),
          reasons: ['USER_MEDIA'],
          justification: 'Microphone pitch detection for guitar tuner',
        })
      })
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }))
    return true
  }

  if (msg.type === 'STOP_OFFSCREEN') {
    chrome.runtime.sendMessage({ type: 'STOP_AUDIO' }).catch(() => {})
    chrome.offscreen.hasDocument()
      .then((has) => (has ? chrome.offscreen.closeDocument() : null))
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: true }))
    return true
  }
})
